import { NextResponse } from "next/server";
import { log } from "@/lib/utils/logger";
import { ingestPDF } from "@/lib/ingest";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // multipart/form-data al
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Dosya yüklenmedi." }, { status: 400 });
    }

    // geçici dizine kaydet
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = "/tmp/uploads";
    const filename = `${Date.now()}_${file.name}`;
    const fullPath = path.join(uploadDir, filename);

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    // PDF parse et
    const result = await ingestPDF(fullPath);

    // geçici dosyayı temizle
    fs.unlinkSync(fullPath);

    log.info("PDF başarıyla parse edildi", { source: file.name });
    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    log.error("Ingest hatası", { err: err.message });
    return NextResponse.json(
      { error: "PDF işleme hatası", detail: err.message },
      { status: 500 }
    );
  }
}
