#!/usr/bin/env node
// Quick extraction test for a PDF using pdf-parse + optional tesseract OCR fallback
// Usage: node scripts/extract-sample.js /path/to/file.pdf [pagesToOcr]

import fs from "fs";
import os from "os";
import path from "path";
import pdfParse from "pdf-parse";
import sharp from "sharp";
import { createWorker } from "tesseract.js";

function checkDensity(text) {
  const t = (text || "").trim();
  const words = t.split(/\s+/).filter(Boolean).length;
  return { chars: t.length, words, low: t.length < 1000 || words < 120 };
}

async function ocrPages(buffer, pagesToProcess = 2) {
  const parsed = await pdfParse(buffer);
  const pages = Math.max(1, parsed.numpages || 1);
  const toProcess = Math.min(pagesToProcess, pages);

  console.log(`OCR: pages total=${pages}, pagesToProcess=${toProcess}`);

  // createWorker returns a Promise that resolves to a ready worker; await it.
  const worker = await createWorker("tur+eng", undefined, {
    logger: (m) => console.log("[tess]", m),
  });
  const results = [];
  const t0 = Date.now();

  try {
    // createWorker(..., lang) already preloads and initializes the worker
    // (no explicit load/loadLanguage/initialize calls required)

    for (let i = 0; i < toProcess; i++) {
      try {
        // Rasterize page to PNG and write to temporary file — passing a path
        const imgBuffer = await sharp(buffer, { density: 300, page: i })
          .flatten({ background: "#fff" })
          .png({ compressionLevel: 9 })
          .toBuffer();
        const tmpPath = path.join(
          os.tmpdir(),
          `tess-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.png`
        );
        fs.writeFileSync(tmpPath, imgBuffer);
        try {
          const res = await worker.recognize(tmpPath);
          // Remove tmp file after recognition
          fs.unlinkSync(tmpPath);
          const text = res?.data?.text || "";
          const conf =
            typeof res?.data?.confidence === "number"
              ? res.data.confidence
              : null;
          console.log(
            `OCR page ${i + 1}/${toProcess} — text len=${
              text.length
            } — conf=${conf}`
          );
          results.push({ index: i, text, conf });
        } catch (err) {
          // Ensure temp file is removed on error
          try {
            fs.unlinkSync(tmpPath);
          } catch {}
          console.error(
            `OCR page ${i + 1} failed:`,
            err && err.message ? err.message : err
          );
          results.push({ index: i, text: "", conf: 0, error: String(err) });
        }
      } catch (err) {
        console.error(
          `OCR page ${i + 1} failed:`,
          err && err.message ? err.message : err
        );
        results.push({ index: i, text: "", conf: 0, error: String(err) });
      }
    }
  } finally {
    try {
      if (worker && typeof worker.terminate === "function") {
        await worker.terminate();
      } else if (worker && typeof worker.worker?.terminate === "function") {
        // Some environments expose a nested worker
        await worker.worker.terminate();
      } else {
        console.warn(
          "OCR worker has no terminate method; skipping termination"
        );
      }
    } catch (err) {
      console.warn(
        "Error terminating OCR worker:",
        err && err.message ? err.message : err
      );
    }
  }

  const processingMs = Date.now() - t0;
  return { results, processingMs };
}

async function main() {
  const filePath =
    process.argv[2] || "/home/codespace/ProCheff-New/pmyo-sartname.pdf";
  const pagesToOcr = parseInt(process.argv[3] || "2", 10);

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(2);
  }

  const buffer = fs.readFileSync(filePath);
  console.log("Loaded file:", filePath, "size:", buffer.length);

  try {
    const t0 = Date.now();
    const parsed = await pdfParse(buffer);
    const baseText = (parsed.text || "").trim();
    const density = checkDensity(baseText);
    console.log(
      `pdf-parse: pages=${parsed.numpages || 1}, baseTextLen=${
        baseText.length
      }, densityLow=${density.low}`
    );
    console.log("--- base text sample ---");
    console.log(baseText.slice(0, 800));
    console.log("--- end base text sample ---");

    if (!density.low) {
      console.log("pdf-parse extracted enough text — skipping OCR fallback.");
      console.log(`Execution time: ${Date.now() - t0} ms`);
      process.exit(0);
    }

    console.log("Falling back to OCR for a few pages...");
    const ocrRes = await ocrPages(buffer, pagesToOcr);
    const combined = ocrRes.results
      .map((r) => r.text)
      .filter(Boolean)
      .join("\n\n");
    console.log("OCR combined length:", combined.length);
    console.log("--- OCR sample ---");
    console.log(combined.slice(0, 1200));
    console.log("--- end OCR sample ---");
    console.log("OCR processing ms:", ocrRes.processingMs);

    const finalText = combined || baseText;
    console.log("FINAL text length:", finalText.length);
    console.log(`Total runtime: ${Date.now() - t0} ms`);

    // Exit non-zero for CI if no text was extracted to catch regressions
    if (!finalText || !finalText.trim()) {
      console.error("FINAL text empty — OCR/PDF extraction failed");
      process.exit(4);
    }
  } catch (err) {
    console.error("Extraction failed:", err && err.message ? err.message : err);
    process.exit(3);
  }
}

main();
