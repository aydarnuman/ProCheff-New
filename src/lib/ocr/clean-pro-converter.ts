import pdf from "pdf-parse";
import FormData from "form-data";

// PRO PLAN: Sadece OCR.space kullanan temiz OCR converter
export async function extractTextWithAdvancedOCR(
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
    console.log("🚀 PRO PLAN: Starting OCR.space processing...");

    // API key kontrolü
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new Error("OCR_SPACE_API_KEY not configured");
    }

    // PDF parse ile başla (hata durumunda OCR'a geç)
    let parsed: { text?: string; numpages?: number } | null = null;
    let baseText = "";
    let pages = 1;
    let isLowQuality = true;

    try {
      parsed = await pdf(buffer);
      baseText = (parsed.text || "").trim();
      pages = parsed.numpages || 1;

      // Text kalitesi kontrol
      const textDensity = baseText.length / pages;
      isLowQuality = textDensity < 200 || baseText.length < 300;

      console.log(
        `📊 PDF: ${pages} pages, ${
          baseText.length
        } chars, density: ${textDensity.toFixed(0)} chars/page`
      );
    } catch (pdfError) {
      console.log(
        `⚠️ PDF parse failed, using OCR only:`,
        (pdfError as Error).message
      );
      // PDF parse başarısız, direkt OCR kullan
      isLowQuality = true;
      pages = 1;
    }

    if (isLowQuality) {
      console.log(`☁️ Low text quality detected, using OCR.space Pro...`);

      try {
        // OCR.space API çağrısı
        const ocrText = await callOcrSpaceAPI(buffer, filename, apiKey);

        if (ocrText && ocrText.length > Math.max(500, baseText.length * 1.5)) {
          // Sadece OCR sonucu kullan
          const processingTime = Date.now() - t0;
          console.log(
            `✅ OCR SUCCESS: ${ocrText.length} chars in ${processingTime}ms`
          );

          return {
            text: ocrText,
            method: "ocr",
            confidence: 0.9,
            meta: {
              filename,
              textLength: ocrText.length,
              processingTime: `${processingTime}ms`,
              extractionChain: ["pdf-parse", "ocr.space-pro"],
              pages,
              pagesProcessed: pages,
              avgConfidence: 0.9,
              qualityHint: "ok",
            },
          };
        } else if (ocrText && baseText) {
          // Hybrid: PDF + OCR
          const hybridText = `${baseText}\n\n--- OCR SUPPLEMENT ---\n\n${ocrText}`;
          const processingTime = Date.now() - t0;
          console.log(
            `✅ HYBRID: ${hybridText.length} chars in ${processingTime}ms`
          );

          return {
            text: hybridText,
            method: "hybrid",
            confidence: 0.85,
            meta: {
              filename,
              textLength: hybridText.length,
              processingTime: `${processingTime}ms`,
              extractionChain: ["pdf-parse", "ocr.space-pro"],
              pages,
              pagesProcessed: pages,
              avgConfidence: 0.85,
              qualityHint: "ok",
            },
          };
        }
      } catch (ocrError) {
        console.error(`❌ OCR.space failed:`, (ocrError as Error).message);
      }
    }

    // Fallback: Sadece PDF parse
    const processingTime = Date.now() - t0;
    console.log(
      `📄 Using PDF parse only: ${baseText.length} chars in ${processingTime}ms`
    );

    return {
      text: baseText,
      method: "pdf-parse",
      confidence: isLowQuality ? 0.5 : 0.95,
      meta: {
        filename,
        textLength: baseText.length,
        processingTime: `${processingTime}ms`,
        extractionChain: ["pdf-parse"],
        pages,
        pagesProcessed: pages,
        avgConfidence: isLowQuality ? 0.5 : 0.95,
        qualityHint: isLowQuality ? "low" : "ok",
      },
    };
  } catch (error) {
    const processingTime = Date.now() - t0;
    console.error("❌ Pro OCR processing failed:", error);

    return {
      text: "",
      method: "pdf-parse",
      confidence: 0,
      meta: {
        filename,
        error: (error as Error).message,
        processingTime: `${processingTime}ms`,
      },
    };
  }
}

// OCR.space API çağrısı
async function callOcrSpaceAPI(
  buffer: Buffer,
  filename: string,
  apiKey: string
): Promise<string> {
  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`📤 OCR.space: ${filename} (${fileSizeMB.toFixed(1)}MB)`);

  // Pro plan 50MB limit
  if (fileSizeMB > 45) {
    throw new Error(`File too large: ${fileSizeMB.toFixed(1)}MB > 45MB limit`);
  }

  // Form data hazırla
  const form = new FormData();
  form.append("apikey", apiKey);
  form.append("language", "tur");
  form.append("isOverlayRequired", "false");
  form.append("filetype", "pdf"); // ✅ küçük harf - daha güvenli
  form.append("OCREngine", "2"); // ✅ Pro engine
  form.append("scale", "true"); // ✅ Auto-scale for better accuracy
  form.append("isTable", "true"); // ✅ Table detection (menü tabloları için)
  form.append("detectOrientation", "true"); // ✅ Auto-rotate

  // Clean filename - remove Turkish characters for OCR.space compatibility
  const cleanFilename = filename
    .replace(
      /[ğĞüÜşŞıİöÖçÇ]/g,
      (match) =>
        ({
          ğ: "g",
          Ğ: "G",
          ü: "u",
          Ü: "U",
          ş: "s",
          Ş: "S",
          ı: "i",
          İ: "I",
          ö: "o",
          Ö: "O",
          ç: "c",
          Ç: "C",
        }[match] || match)
    )
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  form.append("file", buffer, {
    filename: cleanFilename,
    contentType: "application/pdf",
  });

  // API çağrısı - Pro plan endpoint
  const headers = form.getHeaders();
  headers["Accept"] = "application/json";

  const response = await fetch("https://apipro1.ocr.space/parse/image", {
    method: "POST",
    headers,
    body: form as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR.space HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  // Hata kontrolü
  if (result.IsErroredOnProcessing) {
    const errorMsg = Array.isArray(result.ErrorMessage)
      ? result.ErrorMessage.join("; ")
      : result.ErrorMessage || "Unknown OCR error";
    throw new Error(`OCR.space error: ${errorMsg}`);
  }

  // Text extraction
  const extractedText = (result.ParsedResults || [])
    .map((page: { ParsedText?: string }) => page.ParsedText || "")
    .join("\n\n")
    .trim();

  console.log(`📝 OCR.space result: ${extractedText.length} characters`);
  return extractedText;
}

// Backward compatibility için eski fonksiyon (kullanılmayacak)
export async function autoConvertPdfToText(buffer: Buffer): Promise<string> {
  console.log(
    "⚠️ autoConvertPdfToText deprecated, using extractTextWithAdvancedOCR"
  );
  const result = await extractTextWithAdvancedOCR(buffer, "legacy.pdf");
  return result.text;
}
