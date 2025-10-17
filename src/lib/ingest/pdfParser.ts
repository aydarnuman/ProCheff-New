import fs from "fs";
import pdf from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (err: any) {
    throw new Error("PDF parse failed: " + err.message);
  }
}

export async function extractTextFromFile(path: string): Promise<string> {
  const buffer = fs.readFileSync(path);
  return extractTextFromPDF(buffer);
}
