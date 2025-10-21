import pdf from "pdf-parse";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import FormData from "form-data";

// Minimal worker-like interface to avoid `any` casts when terminating
type RecognizeResult = { data: { text?: string; confidence?: number } };

// Normalized worker interface used throughout the codebase
type TesseractWorkerLike = {
  recognize: (input: string | Buffer | Uint8Array) => Promise<RecognizeResult>;
  terminate: () => Promise<unknown> | unknown;
};

// --- Helpers: local raster capability checks and cloud OCR fallback ---
async function canRasterizeWithSharp(buffer: Buffer): Promise<boolean> {
  try {
    // Try a light-weight rasterization of the first page
    await sharp(buffer, { density: 72, page: 0 }).png().toBuffer();
    return true;
  } catch {
    return false;
  }
}

// Inline pdftoppm checks are used where necessary.

async function ocrSpaceParse(
  buffer: Buffer,
  filename = "file.pdf"
): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) throw new Error("OCR_SPACE_API_KEY not configured");

  // Use the well-known 'form-data' package for Node multipart upload
  const form = new FormData();
  form.append("apikey", apiKey);
  form.append("language", "tur");
  form.append("isOverlayRequired", "false");
  form.append("file", buffer, { filename, contentType: "application/pdf" });

  // Node's global fetch accepts streams; pass form-data stream + headers
  const headers = form.getHeaders();
  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers,
    // form is a readable stream provided by `form-data` — cast to BodyInit
    body: form as unknown as BodyInit,
  });

  if (!res.ok) {
    throw new Error(
      `OCR.space request failed: ${res.status} ${res.statusText}`
    );
  }

  const j = await res.json();
  if (j?.IsErroredOnProcessing) {
    const errMsg = Array.isArray(j?.ErrorMessage)
      ? j.ErrorMessage.join("; ")
      : j?.ErrorMessage || JSON.stringify(j);
    throw new Error(`OCR.space error: ${errMsg}`);
  }

  type OcrSpaceResult = { ParsedText?: string };
  const parsed = (j?.ParsedResults || [])
    .map((p: OcrSpaceResult) => p?.ParsedText || "")
    .join("\n\n");
  return parsed || "";
}

// Basit yoğunluk kontrolü – metin PDF mi, tarama mı ayrımı için
function checkDensity(text: string) {
  const t = (text || "").trim();
  const words = t.split(/\s+/).filter(Boolean).length;
  return { chars: t.length, words, low: t.length < 1000 || words < 120 };
}

// Erken durdurma için ipucu dedektörleri
function hasInstitutionHint(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("pmyo") ||
    t.includes("polis") ||
    t.includes("belediye") ||
    t.includes("üniversite") ||
    t.includes("universite") ||
    t.includes("bakanlığı") ||
    t.includes("bakanligi")
  );
}

function hasPersonCount(text: string): boolean {
  return /(\d{2,5})\s*(?:kişi|ogrenci|öğrenci|personel|kişilik)/i.test(text);
}

function hasDateHint(text: string): boolean {
  return /(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})|(\d{4}[-.\/]\d{1,2}[-.]\d{1,2})/i.test(
    text
  );
}

// OCR worker oluşturma (TR+EN) – v6 API
// Return the raw worker object; callers will cast to the normalized interface
async function createTurkishWorker(): Promise<unknown> {
  const w = await createWorker("tur+eng");
  return w;
}

// PDF → (gerekirse) OCR ile metne dönüştür
export async function autoConvertPdfToText(buffer: Buffer): Promise<string> {
  try {
    const parsed = await pdf(buffer);
    const baseText = (parsed.text || "").trim();
    const density = checkDensity(baseText);
    if (!density.low) return baseText; // Metin PDF, yeterli

    // OCR fallback: ilk etapta tüm sayfaları sıralı tara
    const pages = parsed.numpages || 1;
    let combined = "";
    // Decide whether local rasterization is possible; if not, prefer cloud fallback
    const canLocalRaster = await canRasterizeWithSharp(buffer);
    let cloudFallbackUsed = false;
    let worker: unknown | null = null; // raw worker from tesseract.js, cast when used
    if (canLocalRaster) {
      worker = await createTurkishWorker();
    }

    try {
      for (let i = 0; i < pages; i++) {
        const pageIndex = i;
        try {
          // Try rasterizing with sharp first
          let tmpImagePath: string | null = null;
          try {
            const imgBuffer = await sharp(buffer, {
              density: 300,
              page: pageIndex,
            })
              .flatten({ background: "#fff" })
              .png({ compressionLevel: 9 })
              .toBuffer();
            tmpImagePath = path.join(
              os.tmpdir(),
              `tess-${Date.now()}-${pageIndex}-${Math.random()
                .toString(36)
                .slice(2)}.png`
            );
            fs.writeFileSync(tmpImagePath, imgBuffer);
          } catch {
            // sharp fails when libvips lacks PDF support — try pdftoppm (poppler)
            try {
              const pdfTmp = path.join(
                os.tmpdir(),
                `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
              );
              fs.writeFileSync(pdfTmp, buffer);
              const outPrefix = path.join(
                os.tmpdir(),
                `tess-${Date.now()}-${pageIndex}-${Math.random()
                  .toString(36)
                  .slice(2)}`
              );
              const pageNumber = pageIndex + 1;
              const res = spawnSync(
                "pdftoppm",
                [
                  "-png",
                  "-f",
                  String(pageNumber),
                  "-singlefile",
                  "-r",
                  "300",
                  pdfTmp,
                  outPrefix,
                ],
                { encoding: "utf8" }
              );
              try {
                fs.unlinkSync(pdfTmp);
              } catch {}
              const outPath = `${outPrefix}.png`;
              if (res.status === 0 && fs.existsSync(outPath)) {
                tmpImagePath = outPath;
              } else {
                tmpImagePath = null;
              }
            } catch {
              tmpImagePath = null;
            }
          }

          if (!tmpImagePath) {
            // If no local image could be produced, attempt cloud OCR of full PDF
            if (!cloudFallbackUsed) {
              try {
                const cloudText = await ocrSpaceParse(buffer, "file.pdf");
                if (cloudText && cloudText.trim()) {
                  combined += (combined ? "\n\n" : "") + cloudText;
                  cloudFallbackUsed = true;
                }
              } catch {
                // cloud fallback failed, continue to next page
              }
            }
            continue;
          }

          try {
            if (!worker) {
              // No local worker available, try cloud fallback for this page
              try {
                const cloudText = await ocrSpaceParse(buffer, "file.pdf");
                if (cloudText && cloudText.trim()) {
                  combined += (combined ? "\n\n" : "") + cloudText;
                  cloudFallbackUsed = true;
                }
                continue;
              } catch {
                continue;
              }
            }

            const { data } = await (worker as TesseractWorkerLike).recognize(
              tmpImagePath
            );
            const pageText = data.text || "";
            if (pageText) combined += (combined ? "\n\n" : "") + pageText;
          } finally {
            try {
              fs.unlinkSync(tmpImagePath);
            } catch {}
          }
        } catch {
          // skip page on any per-page error
        }
      }
    } finally {
      if (worker) {
        try {
          await (worker as TesseractWorkerLike).terminate();
        } catch {
          // ignore
        }
      }
    }

    const cleaned = (combined || baseText)
      .replace(/\u00AD/g, "") // soft hyphen
      .replace(/(\w)-\n(\w)/g, "$1$2") // satır sonu tire birleştirme
      .replace(/\n+/g, "\n")
      .replace(/\s{2,}/g, " ")
      .replace(/(?:^|\n)Sayfa\s+\d+(?:\s*\/\s*\d+)?/gim, "")
      .trim();

    return cleaned;
  } catch {
    // pdf-parse tamamen çökerse boş döndürme – çağıran katman hatayı işler
    return "";
  }
}

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
    avgConfidence?: number; // 0-1
    earlyStop?: string;
    qualityHint?: "low" | "ok";
    error?: string;
  };
}> {
  const t0 = Date.now();
  try {
    const parsed = await pdf(buffer);
    const baseText = (parsed.text || "").trim();
    const density = checkDensity(baseText);
    let finalText = baseText;
    let method: "pdf-parse" | "ocr" | "hybrid" = "pdf-parse";
    let conf = density.low ? 0.5 : 0.9;
    let pagesProcessed = 0;
    let avgConfidence = 0;
    let earlyStop: string | undefined;

    if (density.low) {
      // OCR devreye al
      const pages = parsed.numpages || 1;
      let combined = "";
      let confSum = 0;
      // Paralellik: 2 worker ile batch halinde işle
      const poolSize = Math.min(2, Math.max(1, pages));
      const rawWorkers = await Promise.all(
        Array.from({ length: poolSize }, () => createTurkishWorker())
      );
      const workers = rawWorkers.map(
        (w) => w as unknown as TesseractWorkerLike
      );
      try {
        for (let i = 0; i < pages; i += poolSize) {
          // Batch raster + OCR
          const tasks = [] as Array<
            Promise<{ index: number; text: string; conf: number }>
          >;
          for (let j = 0; j < poolSize; j++) {
            const pageIndex = i + j;
            if (pageIndex >= pages) break;
            const worker = workers[j];
            tasks.push(
              (async () => {
                try {
                  const img = await sharp(buffer, {
                    density: 300,
                    page: pageIndex,
                  })
                    .png()
                    .toBuffer();
                  const { data } = await (
                    worker as TesseractWorkerLike
                  ).recognize(img);
                  const text = data.text || "";
                  const conf =
                    typeof data.confidence === "number" ? data.confidence : 0;
                  return { index: pageIndex, text, conf };
                } catch {
                  return { index: pageIndex, text: "", conf: 0 };
                }
              })()
            );
          }

          const results = await Promise.allSettled(tasks);
          // Sıraya göre birleştir
          const batch = results
            .filter(
              (
                r
              ): r is PromiseFulfilledResult<{
                index: number;
                text: string;
                conf: number;
              }> => r.status === "fulfilled"
            )
            .map((r) => r.value)
            .sort((a, b) => a.index - b.index);

          for (const r of batch) {
            if (r.text) combined += (combined ? "\n\n" : "") + r.text;
            confSum += r.conf;
            pagesProcessed++;
          }

          // Erken durdurma: kurum + kişi + tarih bulunduysa
          const snapshot = combined.slice(-8000);
          const hasInst = hasInstitutionHint(snapshot);
          const hasCount = hasPersonCount(snapshot);
          const hasDate = hasDateHint(snapshot);
          if (hasInst && hasCount && hasDate) {
            earlyStop = "institution+person+date";
            break;
          }
        }
      } finally {
        // Worker havuzunu kapat (terminate metodu her implementasyonda olmayabilir)
        await Promise.allSettled(
          workers.map(async (w) => {
            try {
              await (w as TesseractWorkerLike).terminate();
            } catch {
              // ignore termination errors
            }
          })
        );
      }

      if (combined && combined.length > baseText.length * 1.5) {
        finalText = combined;
        method = "ocr";
        avgConfidence =
          pagesProcessed > 0 ? confSum / pagesProcessed / 100 : 0.7;
        conf = Math.max(0.6, avgConfidence);
      } else if (combined && baseText) {
        finalText = `${baseText}\n\n--- OCR SUPPLEMENT ---\n\n${combined}`;
        method = "hybrid";
        avgConfidence =
          pagesProcessed > 0 ? confSum / pagesProcessed / 100 : 0.65;
        conf = Math.max(0.6, avgConfidence);
      } else {
        finalText = baseText; // Elimizde olanı verelim
        method = baseText ? "pdf-parse" : "ocr";
        avgConfidence = baseText ? 0.4 : 0.2;
        conf = baseText ? 0.4 : 0.2;
      }
    }

    const processingTime = Date.now() - t0;
    return {
      text: finalText,
      method,
      confidence: conf,
      meta: {
        filename,
        textLength: finalText.length,
        processingTime: `${processingTime}ms`,
        extractionChain: density.low ? ["pdf-parse", method] : ["pdf-parse"],
        pages: parsed.numpages || 1,
        pagesProcessed:
          pagesProcessed || (density.low ? 0 : parsed.numpages || 1),
        avgConfidence,
        earlyStop,
        qualityHint:
          pagesProcessed >= 5 &&
          finalText.length < 1000 &&
          (avgConfidence || 0) < 0.6
            ? "low"
            : "ok",
      },
    };
  } catch (error) {
    return {
      text: "",
      method: "pdf-parse",
      confidence: 0,
      meta: {
        filename,
        error: (error as Error).message,
      },
    };
  }
}
