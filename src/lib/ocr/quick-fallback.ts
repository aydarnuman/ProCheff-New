import pdf from "pdf-parse";

// Hızlı PDF-parse fallback - OCR.space yedek
export async function extractTextWithFallback(
  buffer: Buffer,
  filename: string
): Promise<{
  text: string;
  method: "pdf-parse" | "ocr" | "hybrid" | "empty";
  confidence: number;
  meta: {
    filename: string;
    textLength?: number;
    processingTime?: string;
    extractionChain?: string[];
    pages?: number;
    pagesProcessed?: number;
    avgConfidence?: number;
    qualityHint?: "low" | "ok";
    error?: string;
  };
}> {
  const t0 = Date.now();

  try {
    console.log("📄 Quick fallback: PDF-parse attempting...");

    const parsed = await pdf(buffer);
    const text = (parsed.text || "").trim();
    const pages = parsed.numpages || 1;
    const processingTime = Date.now() - t0;

    if (text.length > 100) {
      console.log(
        `✅ PDF-parse SUCCESS: ${text.length} chars, ${pages} pages in ${processingTime}ms`
      );

      return {
        text,
        method: "pdf-parse",
        confidence: 0.8,
        meta: {
          filename,
          textLength: text.length,
          processingTime: `${processingTime}ms`,
          extractionChain: ["pdf-parse"],
          pages,
          pagesProcessed: pages,
          avgConfidence: 0.8,
          qualityHint: "ok",
        },
      };
    } else {
      console.log(`⚠️ PDF-parse low quality: ${text.length} chars`);

      return {
        text: "",
        method: "empty",
        confidence: 0.1,
        meta: {
          filename,
          textLength: 0,
          processingTime: `${processingTime}ms`,
          extractionChain: ["pdf-parse"],
          pages,
          pagesProcessed: pages,
          avgConfidence: 0.1,
          qualityHint: "low",
          error: "Insufficient text extracted from PDF-parse",
        },
      };
    }
  } catch (error) {
    const processingTime = Date.now() - t0;
    console.error(`❌ PDF-parse failed:`, (error as Error).message);

    return {
      text: "",
      method: "empty",
      confidence: 0,
      meta: {
        filename,
        error: (error as Error).message,
        processingTime: `${processingTime}ms`,
        extractionChain: ["pdf-parse"],
        pages: 1,
        pagesProcessed: 0,
        avgConfidence: 0,
        qualityHint: "low",
      },
    };
  }
}
