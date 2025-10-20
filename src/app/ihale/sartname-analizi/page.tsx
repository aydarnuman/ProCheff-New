'use client';

import React, { useState } from 'react';

type ApiOk = {
  ok: true;
  numPages: number;
  textChars: number;
  preview: string;
  flags: string[];
  meta: { title?: string; author?: string; producer?: string };
};

type ApiErr = { ok: false; error: string; details?: string };

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<ApiOk | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setRes(null);
    if (!file) {
      setErr('Lütfen PDF seçin.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const r = await fetch('/api/analyze-pdf', { method: 'POST', body: fd });
      const j: ApiOk | ApiErr = await r.json();
      if (!r.ok || (j as ApiErr).ok === false) {
        const ee = j as ApiErr;
        setErr(`Analiz hatası: ${ee.error}${ee.details ? ` - ${ee.details}` : ''}`);
        return;
      }
      setRes(j as ApiOk);
    } catch (error: any) {
      setErr(String(error?.message ?? error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Şartname Analizi</h1>
      <form onSubmit={onSubmit} className="space-y-4 border rounded p-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button
          disabled={loading || !file}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Analiz ediliyor…' : 'Analiz Et'}
        </button>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>
      {res && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card title="Sayfa" value={res.numPages} />
            <Card title="Karakter" value={res.textChars} />
          </div>
          <div className="border rounded p-4">
            <h2 className="font-medium mb-2">Meta</h2>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Başlık: {res.meta.title || '—'}</li>
              <li>Yazar: {res.meta.author || '—'}</li>
              <li>Üretici: {res.meta.producer || '—'}</li>
            </ul>
          </div>
          {res.flags.length > 0 && (
            <div className="border rounded p-4">
              <h2 className="font-medium mb-2">Uyarılar</h2>
              <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
                {res.flags.map((flag) => (
                  <li key={flag}>{flagToText(flag)}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="border rounded p-4">
            <h2 className="font-medium mb-2">Metin Önizleme (2000)</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{res.preview || '—'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function flagToText(flag: string) {
  switch (flag) {
    case 'OCR_RECOMMENDED':
      return 'Metin çok az/boş. PDF muhtemelen taranmış. OCR önerilir.';
    case 'LOW_PROCUREMENT_TERMS_COVERAGE':
      return 'İhale/teklif terminolojisi düşük yoğunlukta.';
    default:
      return flag;
  }
}
