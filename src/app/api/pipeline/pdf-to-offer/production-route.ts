// Production-Ready PDF Analysis API with Cloud Run Compatibility
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { createWriteStream, readFileSync } from "fs";

// Next.js/Vercel production optimizations
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // No caching
export const maxDuration = 300; // 5 minutes timeout

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_TYPES = ["application/pdf", "application/octet-stream"];

// Standard error codes for UI stability
const ERROR_CODES = {
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  PARSE_FAILED: "PARSE_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_PDF: "INVALID_PDF",
  NO_FILE: "NO_FILE",
} as const;

// Cloud Run compatible logging
class ProductionLogger {
  static log(level: "INFO" | "ERROR" | "WARNING", message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data || {},
    };

    // Primary: Console logging (Cloud Logging will collect)
    console.log(`[${timestamp}] ${level}: ${message}`, data || "");

    // Secondary: /tmp logging (Cloud Run compatible)
    try {
      const logDir = "/tmp/logs";
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, "pdf-analysis.log");
      const logLine = `${JSON.stringify(logEntry)}\n`;
      fs.appendFileSync(logFile, logLine);
    } catch (e) {
      // Fallback to console only if /tmp fails
      console.warn(
        "Tmp log write failed, using console only:",
        (e as Error)?.message || "Unknown error"
      );
    }
  }
}

// Enhanced error handler with standard codes
class ProductionErrorHandler {
  static handle(error: any, context: string, code: keyof typeof ERROR_CODES) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorInfo = {
      context,
      code,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : "Unknown",
    };

    ProductionLogger.log("ERROR", `PDF Analysis Error: ${context}`, errorInfo);

    return {
      success: false,
      code,
      error: `${context} hatası`,
      details: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

// Retry with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      ProductionLogger.log("WARNING", `Retry attempt ${i + 1}/${maxRetries}`, {
        error: errorMessage,
      });

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Safe filename generation (Unicode + special chars)
function generateSafeFilename(originalName: string): string {
  return (
    originalName
      .normalize("NFC") // Unicode normalization
      .replace(/\s+/g, "-") // Spaces to hyphens
      .replace(/[^a-zA-Z0-9.\-_]/g, "") // Remove special chars
      .toLowerCase() || `upload-${Date.now()}.pdf`
  ); // Fallback
}

// Magic bytes validation
function validatePDFMagicBytes(buffer: Buffer): boolean {
  const header = buffer.slice(0, 5).toString();
  return header === "%PDF-";
}

// Streaming file to /tmp (memory efficient)
async function streamToTemp(file: File): Promise<string> {
  const safeFilename = generateSafeFilename(file.name);
  const tmpDir = "/tmp/uploads";

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const tmpPath = path.join(tmpDir, safeFilename);

  // WebStream → Node stream → /tmp file
  await new Promise<void>((resolve, reject) => {
    Readable.fromWeb(file.stream() as any)
      .pipe(createWriteStream(tmpPath))
      .on("finish", resolve)
      .on("error", reject);
  });

  return tmpPath;
}

// Enhanced analysis with corrected field names
function analyzeShartname(text: string) {
  try {
    ProductionLogger.log("INFO", "Şartname analizi başlıyor", {
      textLength: text.length,
    });

    // Institution detection
    let institutionName = "Tespit Edilemedi";
    let institutionType = "Kurum";
    let location = "Belirtilmemiş";

    const institutionPatterns = [
      {
        pattern: /PMYO|Polis Meslek/i,
        name: "PMYO (Polis Meslek Yüksek Okulu)",
        type: "Eğitim Kurumu",
      },
      {
        pattern: /Belediye|BELEDİYE/i,
        name: "Belediye",
        type: "Yerel Yönetim",
      },
      {
        pattern: /Üniversite|ÜNİVERSİTE/i,
        name: "Üniversite",
        type: "Eğitim Kurumu",
      },
      {
        pattern: /Hastane|HASTANE|Sağlık/i,
        name: "Sağlık Kurumu",
        type: "Sağlık",
      },
      {
        pattern: /Bakanlık|BAKANLIK/i,
        name: "Bakanlık",
        type: "Merkezi Yönetim",
      },
    ];

    for (const pattern of institutionPatterns) {
      if (pattern.pattern.test(text)) {
        institutionName = pattern.name;
        institutionType = pattern.type;
        break;
      }
    }

    // Location detection
    const locationPatterns = [
      "Ankara",
      "İstanbul",
      "İzmir",
      "Bursa",
      "Antalya",
    ];
    for (const loc of locationPatterns) {
      if (text.includes(loc)) {
        location = loc;
        break;
      }
    }

    // Value extraction (fixed: parseFloat instead of parseInt)
    let estimatedValue = 0;
    const valuePatterns = [
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺|lira)/gi,
      /(\d{1,3}(?:\.\d{3})*)\s*(?:türk\s*lirası)/gi,
    ];

    for (const pattern of valuePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const numStr = match[1].replace(/\./g, "").replace(",", ".");
        const num = parseFloat(numStr); // Fixed: parseFloat instead of parseInt
        if (num > estimatedValue) {
          estimatedValue = num;
        }
      }
    }

    // Person count detection
    let personCount = 0;
    const personPatterns = [
      /(\d+)\s*(?:kişi|öğrenci|personel|kişilik)/gi,
      /yaklaşık\s*(\d+)/gi,
      /toplam\s*(\d+)/gi,
    ];

    for (const pattern of personPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const num = parseInt(match[1]);
        if (num > personCount && num < 100000) {
          personCount = num;
        }
      }
    }

    // Date detection
    let deadline = "Belirtilmemiş";
    const datePatterns = [
      /(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/g,
      /(\d{4}[-\.\/]\d{1,2}[-\.\/]\d{1,2})/g,
    ];

    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        deadline = matches[matches.length - 1];
        break;
      }
    }

    // Certificates
    const certificates = [];
    if (text.includes("ISO 22000")) certificates.push("ISO 22000");
    if (text.includes("HACCP")) certificates.push("HACCP");
    if (text.includes("ISO 14001")) certificates.push("ISO 14001");
    if (text.includes("Helal")) certificates.push("Helal Gıda Sertifikası");

    // Meal types
    const mealTypes = [];
    if (text.toLowerCase().includes("kahvaltı")) mealTypes.push("Kahvaltı");
    if (text.toLowerCase().includes("öğle")) mealTypes.push("Öğle yemeği");
    if (text.toLowerCase().includes("akşam")) mealTypes.push("Akşam yemeği");

    // Risk analysis
    let riskLevel = "ORTA";
    let competitionLevel = "YÜKSEK";
    let successProbability = 50;

    if (estimatedValue > 5000000) {
      riskLevel = "YÜKSEK";
      competitionLevel = "ÇOK YÜKSEK";
      successProbability = 30;
    } else if (estimatedValue > 1000000) {
      riskLevel = "ORTA";
      competitionLevel = "YÜKSEK";
      successProbability = 45;
    }

    if (
      institutionType === "Eğitim Kurumu" &&
      institutionName.includes("PMYO")
    ) {
      riskLevel = "YÜKSEK";
      successProbability = 35;
    }

    const result = {
      document: {
        type: "shartname" as const,
        title: `${institutionName} Yemek Hizmeti İhalesi`,
        extractedText: text.substring(0, 500) + "...",
        detectedLanguage: "tr",
      },
      institution: {
        name: institutionName,
        type: institutionType,
        location: location,
        contact: text.match(/[\w\.-]+@[\w\.-]+/)?.[0] || "Belirtilmemiş",
      },
      tender: {
        type: "Açık İhale",
        estimatedValue: estimatedValue,
        currency: "TL",
        deadline: deadline,
        duration: "12 ay",
        lotCount: 1,
      },
      requirements: {
        mandatory: ["Deneyim belgesi", "Mali yeterlilik"],
        technical: ["Gıda güvenliği"],
        financial: ["Mali yeterlilik belgesi"],
        experience: ["Minimum 3 yıl deneyim"],
        certificates: certificates,
        references: ["Referans iş listesi"],
      },
      specifications: {
        mealTypes: mealTypes,
        dailyMealCount: mealTypes.length || 3,
        personCount: personCount,
        serviceAreas: ["Yemekhane", "Kafeterya"],
        qualityStandards: ["Hijyen kuralları", "Beslenme standartları"],
        hygieneRequirements: certificates, // Fixed: hygieneRequirements (not hygienieRequirements)
      },
      strategy: {
        recommendation: `${institutionName} için özel gereksinimler analiz edilmeli. ${
          certificates.length > 0
            ? "Gerekli sertifikalar: " + certificates.join(", ")
            : "Sertifika gereksinimleri kontrol edilmeli."
        } Büyük kapasiteli hizmet deneyimi şart.`,
        riskLevel: riskLevel,
        competitionLevel: competitionLevel,
        successProbability: successProbability,
      },
    };

    ProductionLogger.log("INFO", "Şartname analizi tamamlandı", {
      institution: result.institution.name,
      value: result.tender.estimatedValue,
      persons: result.specifications.personCount,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    ProductionLogger.log("ERROR", "Şartname analizi hatası", {
      error: errorMessage,
    });
    throw error;
  }
}

// Fallback PDF parsing chain
async function parseWithFallback(buffer: Buffer): Promise<string> {
  // Try 1: pdf-parse (primary)
  try {
    const data = await pdfParse(buffer);
    if (data.text && data.text.trim().length > 0) {
      ProductionLogger.log("INFO", "PDF parsed with pdf-parse", {
        textLength: data.text.length,
      });
      return data.text;
    }
  } catch (error) {
    ProductionLogger.log("WARNING", "pdf-parse failed, trying fallback", {
      error: (error as Error).message,
    });
  }

  // Try 2: Could add pdfjs-dist here in future
  // For now, throw to indicate parsing failed
  throw new Error("PDF parsing failed - all fallback methods exhausted");
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  ProductionLogger.log("INFO", "PDF analiz isteği başlıyor");

  let tmpPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Validation 1: File exists
    if (!file) {
      ProductionLogger.log("WARNING", "Dosya bulunamadı");
      return NextResponse.json(
        ProductionErrorHandler.handle(
          new Error("No file provided"),
          "File Validation",
          "NO_FILE"
        ),
        { status: 400 }
      );
    }

    // Validation 2: File size (use actual file.size, not Content-Length header)
    if (file.size > MAX_FILE_SIZE) {
      ProductionLogger.log("WARNING", "Dosya boyutu çok büyük", {
        size: file.size,
      });
      return NextResponse.json(
        ProductionErrorHandler.handle(
          new Error(`File size ${file.size} exceeds limit ${MAX_FILE_SIZE}`),
          "File Size Validation",
          "FILE_TOO_LARGE"
        ),
        { status: 413 }
      );
    }

    ProductionLogger.log("INFO", "PDF dosyası alındı", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Stream to /tmp (memory efficient)
    tmpPath = await streamToTemp(file);
    const buffer = readFileSync(tmpPath);

    // Validation 3: Magic bytes (more reliable than MIME type)
    if (!validatePDFMagicBytes(buffer)) {
      // Check MIME type as secondary validation
      if (!SUPPORTED_TYPES.includes(file.type)) {
        ProductionLogger.log("WARNING", "Geçersiz PDF dosyası", {
          type: file.type,
          magicBytes: buffer.slice(0, 5).toString(),
        });
        return NextResponse.json(
          ProductionErrorHandler.handle(
            new Error(
              `Invalid PDF: bad magic bytes and unsupported MIME type ${file.type}`
            ),
            "File Type Validation",
            "INVALID_PDF"
          ),
          { status: 400 }
        );
      }
    }

    ProductionLogger.log("INFO", "PDF parsing başlıyor");

    // Parse with fallback chain
    const extractedText = await withRetry(async () => {
      return await parseWithFallback(buffer);
    });

    ProductionLogger.log("INFO", "PDF parsing tamamlandı", {
      textLength: extractedText.length,
    });

    if (!extractedText || extractedText.trim().length === 0) {
      ProductionLogger.log("WARNING", "PDF'den metin çıkarılamadı");
      return NextResponse.json(
        ProductionErrorHandler.handle(
          new Error("No text extracted from PDF"),
          "Text Extraction",
          "PARSE_FAILED"
        ),
        { status: 400 }
      );
    }

    // Document type detection
    const isShartname =
      extractedText.includes("ihale") ||
      extractedText.includes("İHALE") ||
      extractedText.includes("tender") ||
      extractedText.includes("şartname") ||
      extractedText.includes("ŞARTNAME") ||
      extractedText.includes("teknik şart") ||
      extractedText.includes("PMYO") ||
      extractedText.includes("belediye") ||
      extractedText.includes("BELEDİYE") ||
      extractedText.includes("üniversite") ||
      file.name.toLowerCase().includes("teknik") ||
      file.name.toLowerCase().includes("sartname");

    ProductionLogger.log("INFO", "Doküman türü tespit edildi", { isShartname });

    let panelData;
    if (isShartname) {
      const shartnameAnalysis = await withRetry(() =>
        Promise.resolve(analyzeShartname(extractedText))
      );

      panelData = {
        shartname: shartnameAnalysis,
        timestamp: new Date().toISOString(),
      };
    } else {
      panelData = {
        menu: { message: "Menü analizi henüz geliştirilmedi" },
        timestamp: new Date().toISOString(),
      };
    }

    const processingTime = Date.now() - startTime;
    ProductionLogger.log("INFO", "PDF analizi başarıyla tamamlandı", {
      processingTime: `${processingTime}ms`,
      type: isShartname ? "shartname" : "menu",
    });

    // Success response with metadata
    return NextResponse.json({
      success: true,
      message: "PDF başarıyla analiz edildi",
      panelData,
      processingTime: `${processingTime}ms`,
      meta: {
        filename: file.name,
        filesize: file.size,
        pages: "Unknown", // Could extract from pdf-parse result
        textLength: extractedText.length,
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorResponse = ProductionErrorHandler.handle(
      error,
      "PDF Processing",
      "INTERNAL_ERROR"
    );

    ProductionLogger.log("ERROR", "PDF analizi başarısız", {
      processingTime: `${processingTime}ms`,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ...errorResponse,
        processingTime: `${processingTime}ms`,
      },
      { status: 500 }
    );
  } finally {
    // Cleanup /tmp file
    if (tmpPath && fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
        ProductionLogger.log("INFO", "Temp file cleaned up", { tmpPath });
      } catch (cleanupError) {
        ProductionLogger.log("WARNING", "Temp file cleanup failed", {
          tmpPath,
          error: (cleanupError as Error).message,
        });
      }
    }
  }
}
