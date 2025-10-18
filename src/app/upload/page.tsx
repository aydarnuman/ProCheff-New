"use client";
import { useState } from "react";
import { usePanelStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function UploadPage() {
  const { setPanelData, setLoading, isLoading } = usePanelStore();
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Lütfen geçerli bir PDF dosyası seçin.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setUploadResult(null);

    try {
      const res = await fetch("/api/pipeline/pdf-to-offer", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.panelData) {
        setPanelData(json.panelData);
        setUploadResult({
          success: true,
          message: "PDF başarıyla analiz edildi!",
          data: json.panelData,
        });
      } else {
        setUploadResult({
          success: false,
          message: json.message || "PDF analizi başarısız oldu.",
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: "Bir hata oluştu: " + (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📄 PDF Menü Yükleme</h1>
          <p className="text-gray-600 mt-2">
            Menü PDF'inizi yükleyin, otomatik analiz ve teklif hesaplama başlasın.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>PDF Dosyası Seçin</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isLoading ? (
                <div className="space-y-4">
                  <div className="text-lg font-medium text-gray-700">⏳ PDF İşleniyor...</div>
                  <Progress value={undefined} className="w-full" />
                  <p className="text-sm text-gray-500">
                    PDF metne çevriliyor → Menü analizi → Piyasa araştırması → Teklif hesaplama
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">📁</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      PDF dosyasını buraya sürükleyip bırakın
                    </p>
                    <p className="text-sm text-gray-500 mb-4">veya dosya seçmek için tıklayın</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors"
                    >
                      Dosya Seç
                    </label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {uploadResult && (
          <Card className={uploadResult.success ? "border-emerald-200" : "border-red-200"}>
            <CardContent className="p-4">
              <div
                className={`flex items-center gap-2 ${
                  uploadResult.success ? "text-emerald-700" : "text-red-700"
                }`}
              >
                <span className="text-xl">{uploadResult.success ? "✅" : "❌"}</span>
                <span className="font-medium">{uploadResult.message}</span>
              </div>

              {uploadResult.success && uploadResult.data && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium text-gray-700">Menü Türü</div>
                    <div className="text-lg">{uploadResult.data.menu?.type || "Bilinmiyor"}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium text-gray-700">Toplam Ürün</div>
                    <div className="text-lg">{uploadResult.data.menu?.items || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium text-gray-700">Tahmini Fiyat</div>
                    <div className="text-lg text-emerald-600 font-semibold">
                      {uploadResult.data.offer?.price?.toFixed(2) || "0.00"} ₺
                    </div>
                  </div>
                </div>
              )}

              {uploadResult.success && (
                <div className="mt-4 flex gap-2">
                  <a
                    href="/menu"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    📊 Menü Analizi
                  </a>
                  <a
                    href="/offer"
                    className="inline-block bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 transition-colors"
                  >
                    💰 Teklif Detayı
                  </a>
                  <a
                    href="/reasoning"
                    className="inline-block bg-amber-600 text-white px-4 py-2 rounded text-sm hover:bg-amber-700 transition-colors"
                  >
                    🧠 Risk Analizi
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Nasıl Çalışır?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl mb-2">📄</div>
                <div className="font-medium">PDF Upload</div>
                <div className="text-sm text-gray-600">Menü PDF'ini yükle</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-medium">Metin Analizi</div>
                <div className="text-sm text-gray-600">AI ile menü çözümleme</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💹</div>
                <div className="font-medium">Piyasa Araştırması</div>
                <div className="text-sm text-gray-600">Güncel fiyat analizi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-medium">Teklif Hesaplama</div>
                <div className="text-sm text-gray-600">Otomatik fiyatlandırma</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
