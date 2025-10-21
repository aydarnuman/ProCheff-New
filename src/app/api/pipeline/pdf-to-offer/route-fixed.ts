/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Enhanced PDF Analysis API with Error Handling & Logging
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DURATION = 300; // 5 dakika

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

// Error handler utility
class ErrorHandler {
  static handle(error: any, context: string) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorInfo = {
      context,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : "Unknown",
    };

    Logger.log("ERROR", `PDF Analysis Error in ${context}`, errorInfo);

    return {
      success: false,
      error: `${context} hatası`,
      details: errorMessage,
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.log("WARNING", `Retry attempt ${i + 1}/${maxRetries}`, {
        error: errorMessage,
      });

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  throw lastError;
}

// Enhanced analysis function
function analyzeShartname(text: string) {
  try {
    Logger.log("INFO", "Şartname analizi başlıyor", {
      textLength: text.length,
    });

    const lines = text.split("\n").filter((line) => line.trim().length > 0);

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
        const num = parseInt(numStr);
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
        hygienieRequirements: certificates,
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

    Logger.log("INFO", "Şartname analizi tamamlandı", {
      institution: result.institution.name,
      value: result.tender.estimatedValue,
      persons: result.specifications.personCount,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.log("ERROR", "Şartname analizi hatası", { error: errorMessage });
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
        {
          success: false,
          message: `Dosya boyutu çok büyük. Maksimum ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      Logger.log("WARNING", "Dosya bulunamadı");
      return NextResponse.json(
        {
          success: false,
          message: "PDF dosyası bulunamadı",
        },
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
        {
          success: false,
          message: "Sadece PDF dosyaları desteklenir",
        },
        { status: 400 }
      );
    }

    // Convert to buffer with retry
    const arrayBuffer = await withRetry(() => file.arrayBuffer());
    const buffer = Buffer.from(arrayBuffer);

    Logger.log("INFO", "PDF parsing başlıyor");

    // Parse PDF with retry
    const data = await withRetry(() => pdfParse(buffer));

    const extractedText = data.text;
    Logger.log("INFO", "PDF parsing tamamlandı", {
      pages: data.numpages,
      textLength: extractedText.length,
    });

    if (!extractedText || extractedText.trim().length === 0) {
      Logger.log("WARNING", "PDF'den metin çıkarılamadı");
      return NextResponse.json(
        {
          success: false,
          message: "PDF'den metin çıkarılamadı. Dosya hasarlı olabilir.",
        },
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

    if (isShartname) {
      const shartnameAnalysis = await withRetry(() =>
        Promise.resolve(analyzeShartname(extractedText))
      );

      panelData = {
        shartname: shartnameAnalysis,
        timestamp: new Date().toISOString(),
      };
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

    return NextResponse.json({
      success: true,
      message: "PDF başarıyla analiz edildi",
      panelData,
      processingTime: `${processingTime}ms`,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorResponse = ErrorHandler.handle(error, "PDF Processing");
    const errorMessage = error instanceof Error ? error.message : String(error);

    Logger.log("ERROR", "PDF analizi başarısız", {
      processingTime: `${processingTime}ms`,
      error: errorMessage,
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
