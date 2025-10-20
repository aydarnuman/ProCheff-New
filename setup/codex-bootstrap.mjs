#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const log = (message) => console.log('•', message);

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function ensurePkgCommand(command, description) {
  try {
    log(description);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.warn(`! Komut başarısız oldu (${command}). Manuel müdahale gerekebilir.`);
  }
}

log('Bağımlılıklar yükleniyor (pdf-parse, next, react, ts)...');
ensurePkgCommand('npm pkg set type=module', 'package.json type alanı ayarlanıyor');
ensurePkgCommand('npm i next@14 react react-dom pdf-parse zod undici', 'Ana bağımlılıklar kuruluyor');
ensurePkgCommand('npm i -D typescript @types/node', 'TypeScript bağımlılıkları kuruluyor');

log('package.json yazılıyor...');
write(
  'package.json',
  `{
  "name":"procheff","private":true,"version":"1.0.0","type":"module",
  "scripts":{"dev":"next dev","build":"next build","start":"next start","typecheck":"tsc --noEmit","smoke":"node scripts/smoke.mjs"},
  "dependencies":{"next":"14.2.5","react":"18.3.1","react-dom":"18.3.1","pdf-parse":"^1.1.1","zod":"^3.23.8","undici":"^6.19.8"},
  "devDependencies":{"typescript":"^5.6.3","@types/node":"^20.14.9"}
}`
);

log('Next ve TS konfigleri yazılıyor...');
write('next.config.mjs', `export default { serverExternalPackages: ['pdf-parse'] };`);
write(
  'tsconfig.json',
  `{
  "compilerOptions": {
    "lib": ["dom","dom.iterable","es2022"],"allowJs": false,"skipLibCheck": true,"strict": true,"noEmit": true,
    "esModuleInterop": true,"module": "esnext","moduleResolution": "bundler","resolveJsonModule": true,
    "isolatedModules": true,"jsx": "preserve","incremental": true,
    "baseUrl": ".","paths":{"@/*":["src/*"],"@/components/*":["src/components/*"],"@/lib/*":["src/lib/*"],"@/types/*":["src/types/*"]}
  },
  "include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]
}`
);

log('Env şablonu yazılıyor...');
write(
  '.env.template',
  `ANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nGOOGLE_GEMINI_API_KEY=\nPDFTOTEXT_PATH=\nPDFTOPPM_PATH=\n`
);

log('Tip ve kütüphane dosyaları yazılıyor...');
write(
  'src/types/index.ts',
  `export type SpecificationProfile={institution:string;city?:string;durationDays?:number;mealsPerDay?:number;population?:number;notes?:string[]};export type CostAnalysis={materials:number;labor:number;overhead:number;profit:number;thresholdK:0.93;thresholdValue:number;asdFlag:boolean};export type MenuItem={name:string;grams:number;kcal?:number;cost?:number};export type MenuAdaptation={items:MenuItem[];deltas?:{name:string;diffGrams:number;diffCost?:number}[]};export type TenderReport={spec:SpecificationProfile;menu:MenuAdaptation;cost:CostAnalysis;warnings:string[]};`
);
write('src/types/pdf-parse.d.ts', `declare module 'pdf-parse' { const pdf: any; export default pdf; }`);
write(
  'src/lib/ingest/pdf.ts',
  `import pdfParse from 'pdf-parse';export type PdfIngestResult={numPages:number;text:string;meta:{title?:string;author?:string;producer?:string};flags:string[]};export async function ingestPdf(buffer:Buffer):Promise<PdfIngestResult>{const data=await pdfParse(buffer as any);const text=(data?.text||'').replace(/\s+/g,' ').trim();const flags:string[]=[];if(!text||text.length<40)flags.push('OCR_RECOMMENDED');if(!/teklif|istekli|teminat/i.test(text))flags.push('LOW_PROCUREMENT_TERMS_COVERAGE');return{numPages:Number(data?.numpages??0),text,meta:{title:data?.info?.Title,author:data?.info?.Author,producer:data?.info?.Producer},flags};}`
);
write(
  'src/lib/analysis/kik.ts',
  `import { z } from 'zod';export const KikInput=z.object({materials:z.number().nonnegative(),labor:z.number().nonnegative(),overhead:z.number().nonnegative(),profit:z.number().nonnegative(),k:z.literal(0.93).default(0.93)});export type KikInput=typeof KikInput._type;export function calcThreshold(i:KikInput){const total=i.materials+i.labor+i.overhead+i.profit;const thresholdValue=total*i.k;return{total,thresholdValue}}export function checkAsd(bid:number,thresholdValue:number){return bid<thresholdValue}`
);
write(
  'src/lib/ai/providers.ts',
  `import { request } from 'undici';export async function callClaude(prompt:string,model='claude-3-haiku-20240307'){const key=process.env.ANTHROPIC_API_KEY;if(!key)throw new Error('ANTHROPIC_API_KEY missing');const {body}=await request('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:800,temperature:0,messages:[{role:'user',content:prompt}]})});const j:any=await body.json();return j?.content?.[0]?.text??''}export async function callOpenAI(prompt:string,model='gpt-4o-mini'){const key=process.env.OPENAI_API_KEY;if(!key)throw new Error('OPENAI_API_KEY missing');const {body}=await request('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'user',content:prompt}],max_tokens:800,temperature:0})});const j:any=await body.json();return j?.choices?.[0]?.message?.content??''}export async function callGemini(prompt:string,model='models/gemini-1.5-flash'){const key=process.env.GOOGLE_GEMINI_API_KEY;if(!key)throw new Error('GOOGLE_GEMINI_API_KEY missing');const {body}=await request(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}]})});const j:any=await body.json();const parts=j?.candidates?.[0]?.content?.parts;return Array.isArray(parts)?parts.map((p:any)=>p.text).join('\n'):''}export async function aiFallback(prompt:string){try{return{provider:'anthropic',text:await callClaude(prompt)}}catch{}try{return{provider:'openai',text:await callOpenAI(prompt)}}catch{}try{return{provider:'gemini',text:await callGemini(prompt)}}catch{}return{provider:'none',text:''}}`
);

log('API rotaları yazılıyor...');
write(
  'src/app/api/analyze-pdf/route.ts',
  `import { NextRequest, NextResponse } from 'next/server';import { ingestPdf } from '@/lib/ingest/pdf';export const runtime='nodejs';export const dynamic='force-dynamic';type AnalyzeOk={ok:true;numPages:number;textChars:number;preview:string;flags:string[];meta:{title?:string;author?:string;producer?:string}};type AnalyzeErr={ok:false;error:string;details?:string};export async function POST(req:NextRequest){try{const fd=await req.formData();const file=fd.get('file') as File|null;if(!file)return NextResponse.json<AnalyzeErr>({ok:false,error:'FILE_REQUIRED'},{status:400});if(!(file.type==='application/pdf'||file.name?.toLowerCase().endsWith('.pdf')))return NextResponse.json<AnalyzeErr>({ok:false,error:'UNSUPPORTED_TYPE'},{status:415});if(file.size>15*1024*1024)return NextResponse.json<AnalyzeErr>({ok:false,error:'FILE_TOO_LARGE',details:'Max 15MB'},{status:413});const buf=Buffer.from(await file.arrayBuffer());const data=await ingestPdf(buf);return NextResponse.json<AnalyzeOk>({ok:true,numPages:data.numPages,textChars:data.text.length,preview:data.text.slice(0,2000),flags:data.flags,meta:data.meta});}catch(e:any){return NextResponse.json<AnalyzeErr>({ok:false,error:'PARSE_FAILED',details:String(e?.message||e)},{status:500})}}export async function GET(){return NextResponse.json({status:'ready',service:'PDF→Text Analyzer (pdf-parse)'});}`
);
write(
  'src/app/api/analysis/kik/route.ts',
  `import { NextRequest, NextResponse } from 'next/server';import { KikInput, calcThreshold, checkAsd } from '@/lib/analysis/kik';export const runtime='nodejs';export async function POST(req:NextRequest){try{const body=await req.json();const i=KikInput.parse(body);const { total, thresholdValue }=calcThreshold(i);const asdFlag=checkAsd(total,thresholdValue);return NextResponse.json({ok:true,total,thresholdValue,k:i.k,asdFlag});}catch(e:any){return NextResponse.json({ok:false,error:String(e?.message||e)},{status:400})}}`
);

log('UI sayfası yazılıyor...');
write(
  'src/app/ihale/sartname-analizi/page.tsx',
  `'use client';import React,{useState}from'react';type ApiOk={ok:true;numPages:number;textChars:number;preview:string;flags:string[];meta:{title?:string;author?:string;producer?:string}};type ApiErr={ok:false;error:string;details?:string};export default function Page(){const [file,setFile]=useState<File|null>(null);const [res,setRes]=useState<ApiOk|null>(null);const [err,setErr]=useState<string|null>(null);const [loading,setLoading]=useState(false);const onSubmit=async(e:any)=>{e.preventDefault();setErr(null);setRes(null);if(!file)return setErr('Lütfen PDF seçin.');const fd=new FormData();fd.append('file',file);setLoading(true);try{const r=await fetch('/api/analyze-pdf',{method:'POST',body:fd});const j:ApiOk|ApiErr=await r.json();if(!r.ok||(j as ApiErr).ok===false){const ee=j as ApiErr;setErr(`Analiz hatası: ${ee.error}${ee.details?` - ${ee.details}`:''}`);return;}setRes(j as ApiOk);}catch(e:any){setErr(String(e?.message||e));}finally{setLoading(false)}};return(<div className="max-w-3xl mx-auto p-6 space-y-6"><h1 className="text-2xl font-semibold">Şartname Analizi</h1><form onSubmit={onSubmit} className="space-y-4 border rounded p-4"><input type="file" accept="application/pdf" onChange={(e)=>setFile(e.target.files?.[0]??null)}/><button disabled={loading||!file} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">{loading?'Analiz ediliyor…':'Analiz Et'}</button>{err&&<div className="text-sm text-red-600">{err}</div>}</form>{res&&(<div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Card title="Sayfa" value={res.numPages}/><Card title="Karakter" value={res.textChars}/></div><div className="border rounded p-4"><h2 className="font-medium mb-2">Meta</h2><ul className="text-sm text-gray-700 list-disc pl-5 space-y-1"><li>Başlık: {res.meta.title||'—'}</li><li>Yazar: {res.meta.author||'—'}</li><li>Üretici: {res.meta.producer||'—'}</li></ul></div>{res.flags.length>0&&(<div className="border rounded p-4"><h2 className="font-medium mb-2">Uyarılar</h2><ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">{res.flags.map(f=><li key={f}>{flagToText(f)}</li>)}</ul></div>)}<div className="border rounded p-4"><h2 className="font-medium mb-2">Metin Önizleme (2000)</h2><pre className="whitespace-pre-wrap text-sm text-gray-800">{res.preview||'—'}</pre></div></div>)}</div>)}function Card({title,value}:{title:string;value:any}){return(<div className="border rounded p-4"><div className="text-sm text-gray-600">{title}</div><div className="text-xl font-semibold">{value}</div></div>)}function flagToText(flag:string){switch(flag){case'OCR_RECOMMENDED':return'Metin çok az/boş. PDF muhtemelen taranmış. OCR önerilir.';case'LOW_PROCUREMENT_TERMS_COVERAGE':return'İhale/teklif terminolojisi düşük yoğunlukta.';default:return flag}}`
);

log('Smoke testi scripti yazılıyor...');
write('scripts/smoke.mjs', `import { request } from 'undici';(async()=>{const {statusCode,body}=await request('http://localhost:3000/api/analyze-pdf');console.log('SMOKE /api/analyze-pdf →',statusCode);console.log(await body.text());})();`);

log('Bootstrap tamam. Şimdi:');
console.log('\n  npm run dev\n');
