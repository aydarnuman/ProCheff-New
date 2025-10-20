import pdfParse from 'pdf-parse';

export type PdfIngestResult = {
  numPages: number;
  text: string;
  meta: { title?: string; author?: string; producer?: string };
  flags: string[];
};

export async function ingestPdf(buffer: Buffer): Promise<PdfIngestResult> {
  const data = await pdfParse(buffer as any);
  const text = (data?.text || '').replace(/\s+/g, ' ').trim();
  const flags: string[] = [];
  if (!text || text.length < 40) flags.push('OCR_RECOMMENDED');
  if (!/teklif|istekli|teminat/i.test(text)) flags.push('LOW_PROCUREMENT_TERMS_COVERAGE');
  return {
    numPages: Number(data?.numpages ?? 0),
    text,
    meta: {
      title: data?.info?.Title,
      author: data?.info?.Author,
      producer: data?.info?.Producer,
    },
    flags,
  };
}
