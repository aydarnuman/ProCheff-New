// QUICK FIX: OCR-Free PDF Processing to avoid timeout issues
import pdfParse from "pdf-parse";

interface ExtractionResult {
  text: string;
  method: "pdf-parse" | "fallback";
  confidence: number;
  processingTime: number;
}

// Simple text density checker
export function checkTextDensity(text: string): {
  density: number;
  wordCount: number;
  isLowDensity: boolean;
} {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const density = text.length;
  const wordCount = words.length;

  // Consider low density if less than 500 chars or less than 50 words
  const isLowDensity = density < 500 || wordCount < 50;

  return { density, wordCount, isLowDensity };
}

// Quick PDF text extraction WITHOUT OCR to avoid timeout
export async function extractTextWithFallback(
  fileBuffer: Buffer
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    console.log("📄 PDF text extraction başlıyor...");
    const pdfData = await pdfParse(fileBuffer);
    const pdfText = pdfData.text || "";

    const densityCheck = checkTextDensity(pdfText);
    console.log(
      `📊 PDF text density: ${densityCheck.density} chars, ${densityCheck.wordCount} words`
    );

    if (pdfText.length > 0) {
      return {
        text: pdfText,
        method: "pdf-parse",
        confidence: densityCheck.isLowDensity ? 0.4 : 0.9,
        processingTime: Date.now() - startTime,
      };
    } else {
      // Empty PDF - provide helpful message
      return {
        text: "Bu PDF dosyasından metin çıkarılamadı. Taranmış (scanned) PDF olabilir. Lütfen metin tabanlı PDF kullanın veya OCR destekli sürümü bekleyin.",
        method: "fallback",
        confidence: 0.1,
        processingTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    console.error("❌ PDF text extraction failed:", error);
    return {
      text: "PDF işleme hatası oluştu. Lütfen dosyanın geçerli bir PDF olduğundan emin olun.",
      method: "fallback",
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}
