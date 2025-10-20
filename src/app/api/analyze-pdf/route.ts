import { NextRequest, NextResponse } from 'next/server';
import { ingestPdf } from '@/lib/ingest/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnalyzeOk = {
  ok: true;
  numPages: number;
  textChars: number;
  preview: string;
  flags: string[];
  meta: { title?: string; author?: string; producer?: string };
};

type AnalyzeErr = { ok: false; error: string; details?: string };

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get('file') as File | null;
    if (!file) return NextResponse.json<AnalyzeErr>({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
    if (!(file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')))
      return NextResponse.json<AnalyzeErr>({ ok: false, error: 'UNSUPPORTED_TYPE' }, { status: 415 });
    if (file.size > 15 * 1024 * 1024)
      return NextResponse.json<AnalyzeErr>(
        { ok: false, error: 'FILE_TOO_LARGE', details: 'Max 15MB' },
        { status: 413 }
      );

    const buf = Buffer.from(await file.arrayBuffer());
    const data = await ingestPdf(buf);
    return NextResponse.json<AnalyzeOk>({
      ok: true,
      numPages: data.numPages,
      textChars: data.text.length,
      preview: data.text.slice(0, 2000),
      flags: data.flags,
      meta: data.meta,
    });
  } catch (e: any) {
    return NextResponse.json<AnalyzeErr>(
      { ok: false, error: 'PARSE_FAILED', details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ready', service: 'PDF→Text Analyzer (pdf-parse)' });
}
