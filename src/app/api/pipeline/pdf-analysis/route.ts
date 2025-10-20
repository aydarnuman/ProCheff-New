import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const KEY_TERMS = [
  "İstekli",
  "Teminat",
  "Garanti",
  "Birim Fiyat",
  "Menü",
  "Teslim",
  "İhale",
  "Teklif",
  "Şartname",
  "Sözleşme"
];

type KeywordStat = {
  term: string;
  count: number;
};

type PdfAnalysisResponse = {
  success: boolean;
  message?: string;
  data?: {
    fileName: string;
    fileSize: number;
    pageCount: number;
    textLength: number;
    preview: string;
    keywords: KeywordStat[];
    meta: {
      title: string | null;
      author: string | null;
      producer: string | null;
    };
    status: {
      readability: "READABLE" | "OCR_RECOMMENDED";
      ocrRecommended: boolean;
      keyTermsLow: boolean;
      message: string;
    };
  };
};

const formatMetadataValue = (value: unknown) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json<PdfAnalysisResponse>(
        { success: false, message: "PDF dosyası bulunamadı." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json<PdfAnalysisResponse>(
        { success: false, message: "PDF dosyası boş." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<PdfAnalysisResponse>(
        {
          success: false,
          message: "Dosya boyutu 15 MB limitini aşıyor. Lütfen daha küçük bir dosya yükleyin."
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await pdfParse(buffer);

    const rawText = parsed.text ?? "";
    const text = rawText.replace(/\s+/g, " ").trim();
    const textLength = text.length;

    const keywordStats: KeywordStat[] = KEY_TERMS.map((term) => {
      if (!textLength) {
        return { term, count: 0 };
      }
      const regex = new RegExp(term, "gi");
      const matches = text.match(regex);
      return { term, count: matches ? matches.length : 0 };
    });

    const totalKeywordHits = keywordStats.reduce((acc, item) => acc + item.count, 0);
    const ocrRecommended = textLength < 100;
    const keyTermsLow = totalKeywordHits === 0;

    const readability = ocrRecommended ? "OCR_RECOMMENDED" : "READABLE";
    const statusMessage = ocrRecommended
      ? "PDF tarama olabilir, OCR işlemi önerilir."
      : keyTermsLow
        ? "Anahtar ihale terimleri bulunamadı; yanlış belge seçilmiş olabilir."
        : "PDF metni okunabilir ve anahtar terimler tespit edildi.";

    const preview = textLength > 0 ? text.slice(0, 2000) : "";

    let producerRaw: unknown = parsed.info?.Producer;
    if (!producerRaw && parsed.metadata) {
      const metadataAny = parsed.metadata as any;
      if (typeof metadataAny.get === "function" && metadataAny.has("Producer")) {
        producerRaw = metadataAny.get("Producer");
      } else if (metadataAny._metadata?.Producer) {
        producerRaw = metadataAny._metadata.Producer;
      }
    }

    const meta = {
      title: formatMetadataValue(parsed.info?.Title),
      author: formatMetadataValue(parsed.info?.Author),
      producer: formatMetadataValue(producerRaw)
    };

    return NextResponse.json<PdfAnalysisResponse>({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        pageCount: parsed.numpages ?? parsed.info?.Pages ?? 0,
        textLength,
        preview,
        keywords: keywordStats,
        meta,
        status: {
          readability,
          ocrRecommended,
          keyTermsLow,
          message: statusMessage
        }
      }
    });
  } catch (error) {
    console.error("PDF analizi sırasında hata oluştu", error);
    return NextResponse.json<PdfAnalysisResponse>(
      {
        success: false,
        message: "PDF analizi sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
      },
      { status: 500 }
    );
  }
}
