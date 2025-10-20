import { extractTextFromPDF, extractTextFromFile } from "./pdfParser";
import { splitSections, type Section } from "./textSplitter";
import { ingestPdf, type PdfIngestResult } from "./pdf";

export { extractTextFromPDF, extractTextFromFile } from "./pdfParser";
export { splitSections, type Section } from "./textSplitter";
export { ingestPdf, type PdfIngestResult } from "./pdf";

export async function ingestPDF(filePath: string) {
  const text = await extractTextFromFile(filePath);
  const sections = splitSections(text);

  return {
    meta: {
      source: filePath.split("/").pop() || "unknown.pdf",
      type: "pdf",
      createdAt: new Date().toISOString(),
    },
    sections,
  };
}
