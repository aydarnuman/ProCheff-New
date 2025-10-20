"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

interface KeywordStat {
  term: string;
  count: number;
}

interface AnalysisResult {
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
}

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(size / 1024).toFixed(2)} KB`;
};

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrorMessage("Lütfen yalnızca PDF dosyası yükleyin.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Dosya boyutu 15 MB sınırını aşıyor. Lütfen daha küçük bir dosya seçin.");
      return;
    }

    setSelectedFile(file);
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/pipeline/pdf-analysis", {
        method: "POST",
        body: formData
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setErrorMessage(json.message || "PDF analizi başarısız oldu.");
        return;
      }

      setAnalysisResult(json.data as AnalysisResult);
    } catch (error) {
      setErrorMessage(`Bir hata oluştu: ${(error as Error).message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    event.target.value = "";
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f172a 0%, #020617 60%, #000 100%)",
        padding: "48px 24px"
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(59, 130, 246, 0.1)",
              color: "#60A5FA",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "12px"
            }}
          >
            🚀 İlk Adım
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#F8FAFC", marginBottom: "12px" }}>
            Şartname Ön Analiz Merkezi
          </h1>
          <p style={{ color: "#94A3B8", maxWidth: "720px", fontSize: "1.05rem" }}>
            İhale dosyanızın okunabilirliğini kontrol edin, anahtar terimlerin varlığını test edin ve OCR gereksinimi
            olup olmadığını birkaç saniye içinde öğrenin.
          </p>
        </header>

        <Card
          className={dragActive ? "border-emerald-400" : ""}
          style={{
            transition: "border-color 0.3s ease, transform 0.3s ease",
            borderColor: dragActive ? "rgba(52, 211, 153, 0.6)" : "rgba(59, 130, 246, 0.2)"
          }}
        >
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.75rem" }}>📄</span>
              PDF Yükleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: "2px dashed rgba(148, 163, 184, 0.4)",
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                background: dragActive ? "rgba(16, 185, 129, 0.1)" : "rgba(15, 23, 42, 0.6)",
                transition: "background 0.3s ease, border-color 0.3s ease"
              }}
            >
              {isAnalyzing ? (
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "12px", color: "#F8FAFC" }}>
                    ⏳ PDF analiz ediliyor...
                  </div>
                  <p style={{ color: "#94A3B8", marginBottom: "24px" }}>
                    Metin katmanı okunuyor → Anahtar terimler taranıyor → Meta veriler çıkarılıyor
                  </p>
                  <div
                    style={{
                      width: "160px",
                      height: "160px",
                      margin: "0 auto",
                      borderRadius: "50%",
                      border: "4px solid rgba(59, 130, 246, 0.2)",
                      borderTopColor: "#38BDF8",
                      animation: "pulse 1.5s ease-in-out infinite"
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "3rem" }}>📁</div>
                  <p style={{ fontSize: "1.15rem", marginTop: "12px", color: "#E2E8F0" }}>
                    PDF dosyanızı buraya sürükleyip bırakın
                  </p>
                  <p style={{ color: "#94A3B8", marginBottom: "20px" }}>veya dosya seçmek için tıklayın</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    style={{
                      display: "inline-block",
                      padding: "12px 24px",
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      color: "#0B1120",
                      borderRadius: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    Dosya Seç
                  </label>
                  <p style={{ color: "#64748B", marginTop: "16px", fontSize: "0.9rem" }}>
                    Maksimum 15 MB • PDF formatı • OCR gerektiren taramalar için uyarı alırsınız
                  </p>
                </div>
              )}
            </div>

            {selectedFile && !isAnalyzing && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  color: "#BBF7D0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>✅ {selectedFile.name}</div>
                  <div style={{ color: "#A7F3D0", fontSize: "0.9rem" }}>{formatFileSize(selectedFile.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setAnalysisResult(null);
                    setErrorMessage(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#F87171",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Dosyayı Kaldır
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(248, 113, 113, 0.12)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  color: "#FCA5A5",
                  fontWeight: 500
                }}
              >
                ❌ {errorMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {analysisResult && (
          <section style={{ marginTop: "32px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px"
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>✅</span>
                    Analiz Durumu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        background: analysisResult.status.ocrRecommended
                          ? "rgba(248, 113, 113, 0.18)"
                          : "rgba(34, 197, 94, 0.18)",
                        color: analysisResult.status.ocrRecommended ? "#FCA5A5" : "#BBF7D0"
                      }}
                    >
                      {analysisResult.status.readability === "OCR_RECOMMENDED"
                        ? "OCR Öneriliyor"
                        : "Metin okunabilir"}
                    </span>
                    <p style={{ color: "#E2E8F0", lineHeight: 1.6 }}>{analysisResult.status.message}</p>
                    {analysisResult.status.keyTermsLow && (
                      <p style={{ color: "#FACC15" }}>
                        ⚠️ Anahtar ihale terimleri çok düşük. Belgeyi tekrar kontrol edin.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>📊</span>
                    Belge Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Sayfa Sayısı</span>
                      <strong style={{ color: "#F8FAFC" }}>{analysisResult.pageCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Toplam Metin Karakteri</span>
                      <strong style={{ color: "#F8FAFC" }}>{analysisResult.textLength.toLocaleString("tr-TR")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Dosya Boyutu</span>
                      <strong style={{ color: "#F8FAFC" }}>{formatFileSize(analysisResult.fileSize)}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🧭</span>
                    Meta Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <span style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Başlık</span>
                      <p style={{ color: "#F8FAFC", margin: 0 }}>
                        {analysisResult.meta.title || "Belirtilmemiş"}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Yazar</span>
                      <p style={{ color: "#F8FAFC", margin: 0 }}>
                        {analysisResult.meta.author || "Belirtilmemiş"}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#94A3B8", fontSize: "0.85rem" }}>Üretici</span>
                      <p style={{ color: "#F8FAFC", margin: 0 }}>
                        {analysisResult.meta.producer || "Belirtilmemiş"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
                marginTop: "24px"
              }}
            >
              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🔑</span>
                    Anahtar Terim İstatistikleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {analysisResult.keywords.map((keyword) => (
                      <div
                        key={keyword.term}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "rgba(15, 118, 110, 0.18)"
                        }}
                      >
                        <span style={{ color: "#5EEAD4", fontWeight: 500 }}>{keyword.term}</span>
                        <span style={{ color: "#F0FDFA", fontWeight: 700 }}>{keyword.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>📝</span>
                    İlk 2000 Karakter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      padding: "16px",
                      borderRadius: "12px",
                      background: "rgba(15, 23, 42, 0.65)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "#E2E8F0",
                      fontFamily: "'Source Serif Pro', serif",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {analysisResult.preview || "Metin katmanı tespit edilemedi."}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🚀</span>
                    Sonraki Adımlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}>
                    <li style={{ color: "#E2E8F0" }}>
                      <strong>Metin temiz:</strong> Maliyet Simülasyon Motoru'na aktarabilir ve teklif hesaplamasına
                      başlayabilirsiniz.
                    </li>
                    <li style={{ color: "#E2E8F0" }}>
                      <strong>OCR önerildi:</strong> Tarama PDF'ler için Tesseract ile OCR çalıştırın, ardından yeniden
                      yükleyin.
                    </li>
                    <li style={{ color: "#E2E8F0" }}>
                      <strong>Anahtar terimler az:</strong> Belgeyi doğrulayın; yanlış şartname seçilmiş olabilir.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {!analysisResult && !isAnalyzing && !errorMessage && (
          <section style={{ marginTop: "32px" }}>
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🧠</span>
                  Analiz Kapsamı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div style={{ color: "#E2E8F0" }}>
                    <strong>Metin Çıkarma:</strong> pdf-parse ile metin katmanı okunur, karakter sayısı hesaplanır.
                  </div>
                  <div style={{ color: "#E2E8F0" }}>
                    <strong>Anahtar Terimler:</strong> {KEY_TERMS.join(", ")} ifadeleri aranır ve sayılır.
                  </div>
                  <div style={{ color: "#E2E8F0" }}>
                    <strong>Meta Veriler:</strong> Başlık, yazar, üretici bilgileri çıkarılır.
                  </div>
                  <div style={{ color: "#E2E8F0" }}>
                    <strong>Uygunluk Kontrolü:</strong> Metin yoksa OCR önerilir, terimler eksikse uyarı gösterilir.
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
