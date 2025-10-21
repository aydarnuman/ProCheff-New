/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Enhanced PDF Analysis API with Error Handling & Logging
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { extractTextWithFallback } from "@/lib/ocr/quick-fallback";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const USE_STRUCTURED_ANALYSIS = process.env.USE_STRUCTURED_ANALYSIS !== "false"; // Default true

// ===== ShartnameAnalysisV1 Schema =====
interface Evidence {
  page: number;
  line: string;
  method: "keyword" | "ml" | "ocr" | "regex";
}

interface ShartnameAnalysisV1 {
  meta: {
    doc_hash: string;
    pages: number;
    extraction_chain: string[];
    generated_at: string;
    version: "v1";
  };
  institution: {
    name: string;
    type: string;
    location: string;
    confidence: number;
    evidence: Evidence[];
  };
  procurement: {
    method: string;
    estimated_value_try: number;
    deadline: string; // YYYY-MM-DD
    duration_days: number;
    confidence: number;
    evidence: Evidence[];
  };
  service_profile: {
    persons: number;
    meals_per_day: number;
    service_days_per_week: number;
    calorie_requirements: Record<string, number>;
    portion_specs: Array<{ meal: string; item: string; gram: number }>;
    confidence: number;
    evidence: Evidence[];
  };
  requirements: {
    certificates: string[];
    staffing: Array<{ role: string; count: number }>;
    logistics: {
      onsite_kitchen: boolean;
      delivery_window: string;
    };
    hygiene_standards: string[];
    confidence: number;
    evidence: Evidence[];
  };
  penalties_payments: {
    delay_penalty_pct_per_day: number;
    payment_term_days: number;
    acceptance_criteria: string[];
  };
  kik: {
    k_factor: number;
    threshold_value_try: number;
    explanation_required: boolean;
  };
  risk: {
    level: "DÜŞÜK" | "ORTA" | "YÜKSEK";
    drivers: string[];
    mitigations: string[];
  };
}

// ===== Normalization Layer =====
class NormalizationService {
  static normalizeFinancial(value: string): number {
    if (!value) return 0;
    // Handle Turkish number format: 1.500.000,50 TL
    const cleanStr = value
      .replace(/[^\d,.-]/g, "") // Remove non-numeric except comma/dot/minus
      .replace(/\./g, "") // Remove thousand separators
      .replace(",", "."); // Convert decimal comma to dot

    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  static normalizeDate(value: string): string {
    if (!value || value === "Belirtilmemiş") return "";

    // Handle various date formats
    const datePatterns = [
      /(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/, // DD.MM.YYYY or DD/MM/YYYY
      /(\d{4})[-\.\/](\d{1,2})[-\.\/](\d{1,2})/, // YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
      const match = value.match(pattern);
      if (match) {
        let day, month, year;
        if (match[3] && match[3].length === 4) {
          // DD.MM.YYYY format
          [, day, month, year] = match;
        } else {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        }

        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0]; // YYYY-MM-DD
        }
      }
    }

    return "";
  }

  static normalizeCount(value: string | number): number {
    if (typeof value === "number") return Math.round(value);
    if (!value) return 0;

    const num = parseInt(value.toString().replace(/[^\d]/g, ""));
    return isNaN(num) ? 0 : num;
  }

  static normalizeFilename(filename: string): string {
    return filename
      .normalize("NFC") // Unicode normalization
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-") // Slug format
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  static calculateDocHash(content: string): string {
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
  }
}

// ===== Evidence Tracking =====
class EvidenceTracker {
  private static findTextInLines(text: string, searchTerm: string): Evidence[] {
    const lines = text.split("\n");
    const evidence: Evidence[] = [];

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
        evidence.push({
          page: Math.floor(index / 50) + 1, // Rough page estimation
          line: `${index + 1}`,
          method: "keyword",
        });
      }
    });

    return evidence;
  }

  static findEvidenceForRegex(text: string, pattern: RegExp): Evidence[] {
    const lines = text.split("\n");
    const evidence: Evidence[] = [];

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        evidence.push({
          page: Math.floor(index / 50) + 1,
          line: `${index + 1}`,
          method: "regex",
        });
      }
    });

    return evidence;
  }

  static findEvidenceForKeyword(text: string, keyword: string): Evidence[] {
    return this.findTextInLines(text, keyword);
  }
}

// ===== Confidence Calculator =====
class ConfidenceCalculator {
  static calculateFieldConfidence(
    value: any,
    evidence: Evidence[],
    extractionMethod: string = "pdf-parse"
  ): number {
    let baseConfidence = 0.9; // pdf-parse default

    // Base confidence by extraction method
    switch (extractionMethod) {
      case "pdf-parse":
        baseConfidence = 0.9;
        break;
      case "pdfjs-dist":
        baseConfidence = 0.8;
        break;
      case "ocr":
        baseConfidence = 0.6;
        break;
      default:
        baseConfidence = 0.7;
    }

    // Multiple evidence boost
    if (evidence.length > 1) {
      baseConfidence += 0.05;
    }

    // Value validation
    if (!value || value === "Tespit Edilemedi" || value === "Belirtilmemiş") {
      baseConfidence -= 0.3;
    }

    // Evidence quality
    const hasRegexEvidence = evidence.some((e) => e.method === "regex");
    if (hasRegexEvidence) {
      baseConfidence += 0.05;
    }

    return Math.max(0, Math.min(1, baseConfidence));
  }
}

// Logging utility
class Logger {
  static log(level: "INFO" | "ERROR" | "WARNING", message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
    };

    console.log(`[${timestamp}] ${level}: ${message}`, data || "");

    // Write to log file
    const logFile = path.join(process.cwd(), "logs", "pdf-analysis.log");
    const logLine = `${JSON.stringify(logEntry)}\n`;

    try {
      if (!fs.existsSync(path.dirname(logFile))) {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
      }
      fs.appendFileSync(logFile, logLine);
    } catch (e) {
      console.error("Log yazma hatası:", e);
    }
  }
}

// ===== Standardized Error Codes =====
type ErrorCode =
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "PARSE_FAILED"
  | "INTERNAL_ERROR"
  | "INVALID_REQUEST";

// Error handler utility
class ErrorHandler {
  static handle(error: any, context: string, code?: ErrorCode): any {
    const errorInfo = {
      context,
      message: error?.message || "Bilinmeyen hata",
      stack: error?.stack,
      type: error?.constructor?.name || "UnknownError",
    };

    Logger.log("ERROR", `PDF Analysis Error in ${context}`, errorInfo);

    return {
      success: false,
      code: code || "INTERNAL_ERROR",
      message: `${context} hatası`,
      details: error?.message || "Bilinmeyen hata",
      timestamp: new Date().toISOString(),
    };
  }
}

// Retry mechanism
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      Logger.log("WARNING", `Retry attempt ${i + 1}/${maxRetries}`, {
        error: (error as Error)?.message || "Bilinmeyen hata",
      });

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  throw lastError;
}

// Enhanced analysis function with structured output
function analyzeShartname(
  text: string,
  filename: string = "",
  pageCount: number = 0,
  extractionMethod: string = "pdf-parse"
): ShartnameAnalysisV1 {
  try {
    Logger.log("INFO", "Şartname analizi başlıyor", {
      textLength: text.length,
      extractionMethod,
    });

    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Generate document hash and metadata
    const docHash = NormalizationService.calculateDocHash(text);
    const extractionChain = [extractionMethod];
    const generatedAt = new Date().toISOString();

    // Kurum tespiti
    let institutionName = "Tespit Edilemedi";
    let institutionType = "Kurum";
    let location = "Belirtilmemiş";

    // Gelişmiş kurum tespiti
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

    // Konum tespiti
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

    // Tahmini değer tespiti - Gelişmiş
    let estimatedValue = 0;
    const valuePatterns = [
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺|lira)/gi,
      /(\d{1,3}(?:\.\d{3})*)\s*(?:türk\s*lirası)/gi,
    ];

    for (const pattern of valuePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const numStr = match[1].replace(/\./g, "").replace(",", ".");
        const num = parseFloat(numStr);
        if (num > estimatedValue) {
          estimatedValue = num;
        }
      }
    }

    // Kişi sayısı tespiti - Gelişmiş
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
          // Mantıklı sınır
          personCount = num;
        }
      }
    }

    // Tarih tespiti - Gelişmiş
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

    // Sertifikalar
    const certificates = [];
    if (text.includes("ISO 22000")) certificates.push("ISO 22000");
    if (text.includes("HACCP")) certificates.push("HACCP");
    if (text.includes("ISO 14001")) certificates.push("ISO 14001");
    if (text.includes("Helal")) certificates.push("Helal Gıda Sertifikası");

    // Öğün türleri
    const mealTypes = [];
    if (text.toLowerCase().includes("kahvaltı")) mealTypes.push("Kahvaltı");
    if (text.toLowerCase().includes("öğle")) mealTypes.push("Öğle yemeği");
    if (text.toLowerCase().includes("akşam")) mealTypes.push("Akşam yemeği");

    // Risk analizi
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

    // Generate evidence for each field
    const institutionEvidence = EvidenceTracker.findEvidenceForKeyword(
      text,
      institutionName
    );
    const valueEvidence = EvidenceTracker.findEvidenceForRegex(
      text,
      /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺|lira)/gi
    );
    const personEvidence = EvidenceTracker.findEvidenceForRegex(
      text,
      /(\d+)\s*(?:kişi|öğrenci|personel)/gi
    );
    const certificateEvidence = certificates.flatMap((cert) =>
      EvidenceTracker.findEvidenceForKeyword(text, cert)
    );

    // Normalize values
    const normalizedValue = NormalizationService.normalizeFinancial(
      estimatedValue.toString()
    );
    const normalizedDeadline = NormalizationService.normalizeDate(deadline);
    const normalizedPersons = NormalizationService.normalizeCount(personCount);

    // Calculate confidence scores
    const institutionConfidence = ConfidenceCalculator.calculateFieldConfidence(
      institutionName,
      institutionEvidence,
      "pdf-parse"
    );
    const procurementConfidence = ConfidenceCalculator.calculateFieldConfidence(
      normalizedValue,
      valueEvidence,
      "pdf-parse"
    );
    const serviceConfidence = ConfidenceCalculator.calculateFieldConfidence(
      normalizedPersons,
      personEvidence,
      "pdf-parse"
    );
    const requirementsConfidence =
      ConfidenceCalculator.calculateFieldConfidence(
        certificates,
        certificateEvidence,
        "pdf-parse"
      );

    // Build structured result
    const result: ShartnameAnalysisV1 = {
      meta: {
        doc_hash: docHash,
        pages: pageCount,
        extraction_chain: extractionChain,
        generated_at: generatedAt,
        version: "v1",
      },
      institution: {
        name: institutionName,
        type: institutionType,
        location: location,
        confidence: institutionConfidence,
        evidence: institutionEvidence,
      },
      procurement: {
        method: "Açık İhale",
        estimated_value_try: normalizedValue,
        deadline: normalizedDeadline,
        duration_days: 365, // Default 12 months
        confidence: procurementConfidence,
        evidence: valueEvidence,
      },
      service_profile: {
        persons: normalizedPersons,
        meals_per_day: mealTypes.length || 3,
        service_days_per_week: 7,
        calorie_requirements: {
          breakfast: 600,
          lunch: 900,
          dinner: 900,
        },
        portion_specs: [
          { meal: "çorba", item: "mercimek", gram: 250 },
          { meal: "ana yemek", item: "et", gram: 120 },
        ],
        confidence: serviceConfidence,
        evidence: personEvidence,
      },
      requirements: {
        certificates: certificates,
        staffing: [
          { role: "aşçı", count: Math.ceil(normalizedPersons / 200) },
          { role: "diyetisyen", count: 1 },
        ],
        logistics: {
          onsite_kitchen: true,
          delivery_window: "06:00-19:00",
        },
        hygiene_standards: ["TS 8985", "Hijyen planı"],
        confidence: requirementsConfidence,
        evidence: certificateEvidence,
      },
      penalties_payments: {
        delay_penalty_pct_per_day: 0.1,
        payment_term_days: 30,
        acceptance_criteria: ["numune", "sıcaklık ölçümü"],
      },
      kik: {
        k_factor: 0.93,
        threshold_value_try: 0, // Will be calculated in Faz 2
        explanation_required: false,
      },
      risk: {
        level: riskLevel as "DÜŞÜK" | "ORTA" | "YÜKSEK",
        drivers: ["yüksek kişi sayısı", "7/24 servis"],
        mitigations: ["yedek personel planı", "ikame menü listesi"],
      },
    };

    Logger.log("INFO", "Şartname analizi tamamlandı", {
      institution: result.institution.name,
      value: result.procurement.estimated_value_try,
      persons: result.service_profile.persons,
      confidence: {
        institution: institutionConfidence,
        procurement: procurementConfidence,
        service: serviceConfidence,
      },
    });

    return result;
  } catch (error) {
    Logger.log("ERROR", "Şartname analizi hatası", {
      error: (error as Error)?.message || "Bilinmeyen hata",
    });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  Logger.log("INFO", "PDF analiz isteği başlıyor");

  try {
    // File size check
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      Logger.log("WARNING", "Dosya boyutu çok büyük", { size: contentLength });
      return NextResponse.json(
        ErrorHandler.handle(
          new Error(
            `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB`
          ),
          "File Size Check",
          "FILE_TOO_LARGE"
        ),
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      Logger.log("WARNING", "Dosya bulunamadı");
      return NextResponse.json(
        ErrorHandler.handle(
          new Error("PDF dosyası bulunamadı"),
          "File Validation",
          "INVALID_REQUEST"
        ),
        { status: 400 }
      );
    }

    Logger.log("INFO", "PDF dosyası alındı", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // File type check
    if (file.type !== "application/pdf") {
      Logger.log("WARNING", "Geçersiz dosya türü", { type: file.type });
      return NextResponse.json(
        ErrorHandler.handle(
          new Error("Sadece PDF dosyaları desteklenir"),
          "File Type Validation",
          "UNSUPPORTED_TYPE"
        ),
        { status: 400 }
      );
    }

    // Convert to buffer with retry
    const arrayBuffer = await withRetry(() => file.arrayBuffer());
    const buffer = Buffer.from(arrayBuffer);

    Logger.log("INFO", "Enhanced PDF parsing with OCR fallback başlıyor");

    // Get PDF metadata for page count
    const pdfMetadata = await withRetry(() => pdfParse(buffer));
    const pageCount = pdfMetadata.numpages || 1;

    // Enhanced text extraction with OCR fallback
    const extractionResult = await extractTextWithFallback(buffer);

    const extractedText = extractionResult.text;
    Logger.log("INFO", "Enhanced PDF parsing tamamlandı", {
      method: extractionResult.method,
      confidence: extractionResult.confidence,
      textLength: extractedText.length,
      processingTime: extractionResult.processingTime,
      pages: pageCount,
    });

    // Update extraction chain with actual method used
    const extractionChain = [extractionResult.method];

    if (!extractedText || extractedText.trim().length === 0) {
      Logger.log(
        "WARNING",
        `PDF'den metin çıkarılamadı (method: ${extractionResult.method})`
      );
      return NextResponse.json(
        ErrorHandler.handle(
          new Error(
            `PDF'den metin çıkarılamadı. OCR dahil tüm yöntemler denendi. Method: ${extractionResult.method}`
          ),
          "PDF Text Extraction",
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

    Logger.log("INFO", "Doküman türü tespit edildi", { isShartname });

    let panelData;
    let analysisV1: ShartnameAnalysisV1 | null = null;

    if (isShartname) {
      // Generate structured analysis
      if (USE_STRUCTURED_ANALYSIS) {
        analysisV1 = analyzeShartname(
          extractedText,
          file.name,
          pageCount,
          extractionResult.method
        );

        // Legacy format for backward compatibility
        const legacyAnalysis = {
          document: {
            type: "shartname" as const,
            title: `${analysisV1.institution.name} Yemek Hizmeti İhalesi`,
            extractedText: extractedText.substring(0, 500) + "...",
            detectedLanguage: "tr",
          },
          institution: {
            name: analysisV1.institution.name,
            type: analysisV1.institution.type,
            location: analysisV1.institution.location,
            contact:
              extractedText.match(/[\w\.-]+@[\w\.-]+/)?.[0] || "Belirtilmemiş",
          },
          tender: {
            type: analysisV1.procurement.method,
            estimatedValue: analysisV1.procurement.estimated_value_try,
            currency: "TL",
            deadline: analysisV1.procurement.deadline || "Belirtilmemiş",
            duration: "12 ay",
            lotCount: 1,
          },
          requirements: {
            mandatory: ["Deneyim belgesi", "Mali yeterlilik"],
            technical: ["Gıda güvenliği"],
            financial: ["Mali yeterlilik belgesi"],
            experience: ["Minimum 3 yıl deneyim"],
            certificates: analysisV1.requirements.certificates,
            references: ["Referans iş listesi"],
          },
          specifications: {
            mealTypes: ["Kahvaltı", "Öğle yemeği", "Akşam yemeği"].slice(
              0,
              analysisV1.service_profile.meals_per_day
            ),
            dailyMealCount: analysisV1.service_profile.meals_per_day,
            personCount: analysisV1.service_profile.persons,
            serviceAreas: ["Yemekhane", "Kafeterya"],
            qualityStandards: ["Hijyen kuralları", "Beslenme standartları"],
            hygieneRequirements: analysisV1.requirements.certificates,
          },
          strategy: {
            recommendation: `${
              analysisV1.institution.name
            } için özel gereksinimler analiz edilmeli. ${
              analysisV1.requirements.certificates.length > 0
                ? "Gerekli sertifikalar: " +
                  analysisV1.requirements.certificates.join(", ")
                : "Sertifika gereksinimleri kontrol edilmeli."
            } Büyük kapasiteli hizmet deneyimi şart.`,
            riskLevel: analysisV1.risk.level,
            competitionLevel: "YÜKSEK",
            successProbability: analysisV1.risk.level === "YÜKSEK" ? 35 : 50,
          },
        };

        panelData = {
          shartname: legacyAnalysis,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Fallback to old logic if structured analysis is disabled
        analysisV1 = analyzeShartname(
          extractedText,
          file.name,
          pageCount,
          extractionResult.method
        );
        panelData = {
          shartname: "Legacy mode disabled", // Simplified for now
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      // Menu analysis logic here (simplified for now)
      panelData = {
        menu: { message: "Menü analizi henüz geliştirilmedi" },
        timestamp: new Date().toISOString(),
      };
    }

    const processingTime = Date.now() - startTime;
    Logger.log("INFO", "PDF analizi başarıyla tamamlandı", {
      processingTime: `${processingTime}ms`,
      type: isShartname ? "shartname" : "menu",
    });

    // Response with backward compatibility
    const response: any = {
      success: true,
      message: "PDF başarıyla analiz edildi",
      panelData,
      processingTime: `${processingTime}ms`,
    };

    // Add structured analysis if enabled
    if (USE_STRUCTURED_ANALYSIS && analysisV1) {
      response.analysis_v1 = analysisV1;

      // Faz 1 Automation Hooks Implementation
      try {
        // Import automation system
        const { triggerAutomationPipeline } = await import(
          "@/lib/workflow/automation"
        );
        const { PrismaClient } = await import("@prisma/client");

        const prisma = new PrismaClient();

        // 1. Save Analysis to database (idempotent upsert)
        let tender = await prisma.tender.findFirst({
          where: {
            title: { contains: analysisV1.institution.name },
          },
        });

        // 2. Create or Update Tender
        if (!tender) {
          tender = await prisma.tender.create({
            data: {
              title: `${analysisV1.institution.name} Yemek Hizmeti İhalesi`,
              description: "PDF analysis ile oluşturuldu",
              restaurantId: "default-restaurant-id",
              budget: analysisV1.procurement.estimated_value_try,
              deadline:
                analysisV1.procurement.deadline ||
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              requirements: analysisV1,
              status: "OPEN",
              publishedAt: new Date(),
            },
          });
        }

        // 3. Upsert TenderAnalysis
        await prisma.tenderAnalysis.upsert({
          where: {
            tenderId_documentHash: {
              tenderId: tender.id,
              documentHash: analysisV1.meta.doc_hash,
            },
          },
          update: {
            analysis_v1: analysisV1,
            confidence: Math.min(
              analysisV1.institution.confidence,
              analysisV1.procurement.confidence
            ),
            updatedAt: new Date(),
          },
          create: {
            tenderId: tender.id,
            documentHash: analysisV1.meta.doc_hash,
            analysis_v1: analysisV1,
            confidence: Math.min(
              analysisV1.institution.confidence,
              analysisV1.procurement.confidence
            ),
            version: "1.0",
          },
        });

        // 4. Trigger Automation Pipeline (async)
        triggerAutomationPipeline(
          tender.id,
          "system-user",
          analysisV1.meta.doc_hash,
          analysisV1 as unknown as Record<string, unknown>
        )
          .then((results) => {
            Logger.log("INFO", "Automation pipeline completed", {
              tenderId: tender.id,
              steps: results.length,
              success: results.every((r) => r.success),
              errors: results.filter((r) => !r.success).map((r) => r.error),
            });
          })
          .catch((error) => {
            Logger.log("ERROR", "Automation pipeline failed", {
              tenderId: tender.id,
              error: error.message,
            });
          });

        // Add tender info to response
        response.tender = {
          id: tender.id,
          title: tender.title,
          status: tender.status,
        };
      } catch (automationError) {
        Logger.log("ERROR", "Automation setup failed", {
          error:
            automationError instanceof Error
              ? automationError.message
              : String(automationError),
          doc_hash: analysisV1.meta.doc_hash,
        });
        // Don't fail the entire response if automation fails
      }

      Logger.log("INFO", "Structured analysis completed", {
        doc_hash: analysisV1.meta.doc_hash,
        institution_confidence: analysisV1.institution.confidence,
        procurement_confidence: analysisV1.procurement.confidence,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorResponse = ErrorHandler.handle(
      error,
      "PDF Processing",
      "INTERNAL_ERROR"
    );

    Logger.log("ERROR", "PDF analizi başarısız", {
      processingTime: `${processingTime}ms`,
      error: (error as Error)?.message || "Bilinmeyen hata",
    });

    return NextResponse.json(
      {
        ...errorResponse,
        processingTime: `${processingTime}ms`,
      },
      { status: 500 }
    );
  }
}
