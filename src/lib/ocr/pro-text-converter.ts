import pdf from "pdf-parse";
import FormData from "form-data";

// Yeni Pro-only OCR converter
export async function extractTextWithProOCR(
  buffer: Buffer,
  filename: string
): Promise<{
  text: string;
  method: "pdf-parse" | "ocr" | "hybrid";
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
    // OCR.space API key kontrol
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new Error("OCR_SPACE_API_KEY not configured - Pro plan required");
    }

    const isProPlan = apiKey.length >= 10;
    if (!isProPlan) {
      throw new Error("Pro plan required for PDF processing");
    }

    console.log("🚀 PRO PLAN: Starting OCR.space processing...");

    // İlk olarak PDF parse dene
    const parsed = await pdf(buffer);
    const baseText = (parsed.text || "").trim();
    const pages = parsed.numpages || 1;

    // Text kalitesi kontrol
    const density = checkTextDensity(baseText, pages);
    console.log(
      `📊 Text density: ${density.ratio.toFixed(3)} chars/page (${
        density.low ? "LOW" : "OK"
      })`
    );

    let finalText = baseText;
    let method: "pdf-parse" | "ocr" | "hybrid" = "pdf-parse";
    let confidence = 0.95;

    // OCR gerekli mi?
    if (density.low) {
      console.log(`☁️ Low text density, using OCR.space for ${pages} pages...`);

      try {
        const cloudText = await callOcrSpaceApi(buffer, filename, apiKey);

        if (
          cloudText &&
          cloudText.length > Math.max(500, baseText.length * 1.5)
        ) {
          finalText = cloudText;
          method = "ocr";
          confidence = 0.9;
          console.log(`✅ OCR SUCCESS: ${cloudText.length} chars extracted`);
        } else if (cloudText && baseText) {
          finalText = `${baseText}\n\n--- OCR SUPPLEMENT ---\n\n${cloudText}`;
          method = "hybrid";
          confidence = 0.85;
          console.log(
            `✅ HYBRID: Combined ${baseText.length} + ${cloudText.length} chars`
          );
        } else {
          console.log(`⚠️ OCR failed, using PDF parse only`);
        }
      } catch (ocrError) {
        console.error(`❌ OCR.space error:`, (ocrError as Error).message);
        // PDF parse sonucunu kullan
      }
    }

    const processingTime = Date.now() - t0;
    console.log(`⏱️ Processing completed in ${processingTime}ms`);

    return {
      text: finalText,
      method,
      confidence,
      meta: {
        filename,
        textLength: finalText.length,
        processingTime: `${processingTime}ms`,
        extractionChain:
          method === "pdf-parse"
            ? ["pdf-parse"]
            : ["pdf-parse", "ocr.space-pro"],
        pages,
        pagesProcessed: pages,
        avgConfidence: confidence,
        qualityHint: finalText.length > 1000 ? "ok" : "low",
      },
    };
  } catch (error) {
    console.error("Pro OCR processing failed:", error);
    return {
      text: "",
      method: "pdf-parse",
      confidence: 0,
      meta: {
        filename,
        error: (error as Error).message,
        processingTime: `${Date.now() - t0}ms`,
      },
    };
  }
}

// Text density checker
function checkTextDensity(text: string, pages: number) {
  const ratio = text.length / pages;
  return {
    ratio,
    low: ratio < 200 || text.length < 300, // Düşük kalite threshold
  };
}

// OCR.space API caller
async function callOcrSpaceApi(
  buffer: Buffer,
  filename: string,
  apiKey: string
): Promise<string> {
  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`📤 OCR.space upload: ${filename} (${fileSizeMB.toFixed(1)}MB)`);

  // Pro plan 50MB limit check
  if (fileSizeMB > 45) {
    throw new Error(
      `File too large: ${fileSizeMB.toFixed(1)}MB > 45MB Pro limit`
    );
  }

  const form = new FormData();
  form.append("language", "tur");
  form.append("isOverlayRequired", "false");
  form.append("OCREngine", "2"); // Pro engine
  form.append("file", buffer, {
    filename,
    contentType: "application/pdf",
  });

  const headers = {
    ...form.getHeaders(),
    apikey: apiKey,
  };
  const response = await fetch("https://apipro1.ocr.space/parse/image", {
    method: "POST",
    headers,
    body: form as unknown as BodyInit,
  });

  if (!response.ok) {
    throw new Error(
      `OCR.space HTTP ${response.status}: ${response.statusText}`
    );
  }

  const result = await response.json();

  if (result.IsErroredOnProcessing) {
    const errorMsg = Array.isArray(result.ErrorMessage)
      ? result.ErrorMessage.join("; ")
      : result.ErrorMessage || "Unknown OCR error";
    throw new Error(`OCR.space processing error: ${errorMsg}`);
  }

  // Extract text from all pages
  const extractedText = (result.ParsedResults || [])
    .map((page: { ParsedText?: string }) => page.ParsedText || "")
    .join("\n\n")
    .trim();

  console.log(`📝 OCR.space result: ${extractedText.length} characters`);
  return extractedText;
}
