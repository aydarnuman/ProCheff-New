// OCR Fallback Service for PDF Processing
import { createWorker, Worker } from "tesseract.js";
import pdfParse from "pdf-parse";

interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

export class OCRFallbackService {
  private static instance: OCRFallbackService;
  private worker: Worker | null = null;

  static getInstance(): OCRFallbackService {
    if (!OCRFallbackService.instance) {
      OCRFallbackService.instance = new OCRFallbackService();
    }
    return OCRFallbackService.instance;
  }

  async initializeWorker(): Promise<void> {
    if (!this.worker) {
      console.log("🔧 Initializing Tesseract OCR worker for Turkish...");
      this.worker = await createWorker("tur");
      console.log("✅ OCR worker ready");
    }
  }

  async processBuffer(fileBuffer: Buffer): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      await this.initializeWorker();

      if (!this.worker) {
        throw new Error("OCR worker not initialized");
      }

      console.log("🔍 Running OCR on PDF buffer...");
      const { data } = await this.worker.recognize(fileBuffer);

      const processingTime = Date.now() - startTime;
      const confidence = data.confidence || 0;

      console.log(
        `✅ OCR completed in ${processingTime}ms, confidence: ${confidence}%`
      );

      return {
        text: data.text || "",
        confidence,
        processingTime,
      };
    } catch (error) {
      console.error("❌ OCR processing failed:", error);
      return {
        text: "",
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  normalizeText(text: string): string {
    return (
      text
        // Remove page numbers
        .replace(/Sayfa\s+\d+/gi, "")
        .replace(/Page\s+\d+/gi, "")
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove footers/headers patterns
        .replace(/^\d+\s*$/gm, "")
        // Remove date patterns at start/end of lines
        .replace(/^\d{2}[./-]\d{2}[./-]\d{4}\s*/gm, "")
        // Clean up
        .trim()
    );
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log("🧹 OCR worker terminated");
    }
  }
}

// Text density checker
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

  // Consider low density if less than 1000 chars or less than 100 words
  const isLowDensity = density < 1000 || wordCount < 100;

  return { density, wordCount, isLowDensity };
}

// Enhanced PDF text extraction with OCR fallback
export async function extractTextWithFallback(fileBuffer: Buffer): Promise<{
  text: string;
  method: "pdf-parse" | "ocr" | "hybrid";
  confidence: number;
  processingTime: number;
}> {
  const startTime = Date.now();

  try {
    // Step 1: Try pdf-parse first
    console.log("📄 Attempting PDF text extraction...");
    const pdfData = await pdfParse(fileBuffer);
    const pdfText = pdfData.text || "";

    const densityCheck = checkTextDensity(pdfText);
    console.log(
      `📊 PDF text density: ${densityCheck.density} chars, ${densityCheck.wordCount} words`
    );

    if (!densityCheck.isLowDensity) {
      // Good text extraction, return it
      return {
        text: pdfText,
        method: "pdf-parse",
        confidence: 0.9,
        processingTime: Date.now() - startTime,
      };
    }

    // Step 2: Low density detected, trigger OCR fallback
    console.log("⚠️  Low text density detected - triggering OCR fallback");
    const ocrService = OCRFallbackService.getInstance();
    const ocrResult = await ocrService.processBuffer(fileBuffer);

    if (ocrResult.text && ocrResult.text.length > pdfText.length * 2) {
      // OCR produced better results
      const normalizedText = ocrService.normalizeText(ocrResult.text);
      return {
        text: normalizedText,
        method: "ocr",
        confidence: ocrResult.confidence / 100,
        processingTime: Date.now() - startTime,
      };
    } else if (pdfText.length > 0 && ocrResult.text.length > 0) {
      // Combine both results
      const combinedText = `${pdfText}\n\n--- OCR SUPPLEMENT ---\n\n${ocrService.normalizeText(
        ocrResult.text
      )}`;
      return {
        text: combinedText,
        method: "hybrid",
        confidence: Math.max(0.6, ocrResult.confidence / 100),
        processingTime: Date.now() - startTime,
      };
    } else {
      // Fallback to whatever we have
      return {
        text: pdfText || ocrResult.text,
        method: pdfText.length > ocrResult.text.length ? "pdf-parse" : "ocr",
        confidence: 0.3,
        processingTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    console.error("❌ Text extraction failed:", error);
    return {
      text: "",
      method: "pdf-parse",
      confidence: 0,
      processingTime: Date.now() - startTime,
    };
  }
}
