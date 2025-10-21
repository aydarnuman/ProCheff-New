"use client";
import React, { useState } from "react";
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📄 PDF Analiz Sistemi</h1>
        <p className="text-gray-600 mt-2">
          Menü veya şartname PDF dosyalarınızı yükleyerek detaylı analiz alın
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>PDF Dosyası Yükle</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-emerald-500 bg-emerald-50"
                : isLoading
                ? "border-gray-300 bg-gray-50"
                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="space-y-4">
                <div className="text-lg font-medium text-gray-600">📊 PDF analiz ediliyor...</div>
                <Progress value={75} className="w-full max-w-md mx-auto" />
                <div className="text-sm text-gray-500">
                  Bu işlem birkaç dakika sürebilir, lütfen bekleyin.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-2xl">📄</div>
                <div>
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    PDF dosyanızı buraya sürükleyin veya seçin
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Desteklenen format: PDF (Max 100MB)
                  </div>
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

      {/* Results */}
      {uploadResult && (
        <div className="space-y-6">
          {/* Status Message */}
          <Card>
            <CardContent className="p-4">
              <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className={`flex items-center ${uploadResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                  <span className="mr-2">
                    {uploadResult.success ? '✅' : '❌'}
                  </span>
                  {uploadResult.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {uploadResult.success && uploadResult.data && (
            <div className="space-y-6">
              {/* Şartname Analizi */}
              {uploadResult.data.shartname && (
                <div className="space-y-6">
                  {/* İhale Özet Kartları */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-700">Kurum</div>
                      <div className="text-lg font-semibold text-blue-900">{uploadResult.data.shartname.institution.name}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm font-medium text-purple-700">İhale Türü</div>
                      <div className="text-lg font-semibold text-purple-900">{uploadResult.data.shartname.tender.type}</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <div className="text-sm font-medium text-emerald-700">Tahmini Değer</div>
                      <div className="text-lg font-semibold text-emerald-900">
                        ₺{uploadResult.data.shartname.tender.estimatedValue?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="text-sm font-medium text-amber-700">Son Başvuru</div>
                      <div className="text-lg font-semibold text-amber-900">
                        {uploadResult.data.shartname.tender.deadline}
                      </div>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                      <div className="text-sm font-medium text-rose-700">Başarı Olasılığı</div>
                      <div className="text-lg font-semibold text-rose-900">
                        %{uploadResult.data.shartname.strategy.successProbability}
                      </div>
                    </div>
                  </div>

                  {/* Şartname Detayları */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Kurum ve İhale Bilgileri */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">🏢 Kurum ve İhale Bilgileri</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Kurum Türü:</span>
                            <span className="ml-2 text-sm text-gray-900">{uploadResult.data.shartname.institution.type}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Konum:</span>
                            <span className="ml-2 text-sm text-gray-900">{uploadResult.data.shartname.institution.location}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Sözleşme Süresi:</span>
                            <span className="ml-2 text-sm text-gray-900">{uploadResult.data.shartname.tender.duration}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Risk Seviyesi:</span>
                            <span className={`ml-2 text-sm px-2 py-1 rounded ${
                              uploadResult.data.shartname.strategy.riskLevel === 'Yüksek' ? 'bg-red-100 text-red-800' :
                              uploadResult.data.shartname.strategy.riskLevel === 'Orta' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {uploadResult.data.shartname.strategy.riskLevel}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Şartlar ve Gereksinimler */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">📋 Şartlar ve Gereksinimler</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Zorunlu Şartlar:</span>
                            <ul className="mt-1 text-xs text-gray-700 space-y-1">
                              {uploadResult.data.shartname.requirements.mandatory.map((req: string, index: number) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Teknik Şartlar:</span>
                            <ul className="mt-1 text-xs text-gray-700 space-y-1">
                              {uploadResult.data.shartname.requirements.technical.map((req: string, index: number) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1 h-1 bg-purple-500 rounded-full mr-2"></span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Strateji ve Öneriler */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🎯 Strateji ve Öneriler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Rekabet Analizi</h4>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-600">Rekabet Seviyesi:</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                uploadResult.data.shartname.strategy.competitionLevel === 'Yüksek' ? 'bg-red-100 text-red-800' :
                                uploadResult.data.shartname.strategy.competitionLevel === 'Orta' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {uploadResult.data.shartname.strategy.competitionLevel}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {uploadResult.data.shartname.strategy.recommendation}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Kritik Noktalar</h4>
                          <ul className="text-xs text-gray-700 space-y-1">
                            {uploadResult.data.shartname.strategy.criticalPoints.map((point: string, index: number) => (
                              <li key={index} className="flex items-center">
                                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zaman Çizelgesi */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">⏰ Zaman Çizelgesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs font-medium text-blue-700">Başvuru Deadline</div>
                          <div className="text-sm font-semibold text-blue-900">{uploadResult.data.shartname.timeline.applicationDeadline}</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-xs font-medium text-purple-700">Teknik Değerlendirme</div>
                          <div className="text-sm font-semibold text-purple-900">{uploadResult.data.shartname.timeline.technicalEvaluation}</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                          <div className="text-xs font-medium text-emerald-700">Mali Değerlendirme</div>
                          <div className="text-sm font-semibold text-emerald-900">{uploadResult.data.shartname.timeline.financialEvaluation}</div>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                          <div className="text-xs font-medium text-amber-700">Sözleşme Başlangıcı</div>
                          <div className="text-sm font-semibold text-amber-900">{uploadResult.data.shartname.timeline.contractStart}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Menü Analizi (Eski sistem) */}
              {uploadResult.data.menu && (
                <div className="space-y-6">
                  {/* Özet Kartları */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-700">Menü Türü</div>
                      <div className="text-lg font-semibold text-blue-900">{uploadResult.data.menu?.type || "Bilinmiyor"}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm font-medium text-purple-700">Toplam Ürün</div>
                      <div className="text-lg font-semibold text-purple-900">{uploadResult.data.menu?.items || 0}</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <div className="text-sm font-medium text-emerald-700">Tahmini Fiyat</div>
                      <div className="text-lg font-semibold text-emerald-900">
                        {uploadResult.data.offer?.price?.toLocaleString() || "0"} ₺
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="text-sm font-medium text-amber-700">Güven Skoru</div>
                      <div className="text-lg font-semibold text-amber-900">
                        %{uploadResult.data.offer?.confidence || 0}
                      </div>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                      <div className="text-sm font-medium text-rose-700">Risk Skoru</div>
                      <div className="text-lg font-semibold text-rose-900">
                        {uploadResult.data.analysis?.riskScore || 0}
                      </div>
                    </div>
                  </div>

                  {/* Menü Detayları */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">📋 Menü Detayları</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {uploadResult.data.menu?.dishes && uploadResult.data.menu.dishes.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Tespit Edilen Ürünler ({uploadResult.data.menu.dishes.length})
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {uploadResult.data.menu.dishes.slice(0, 10).map((dish: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <span className="font-medium">{dish.name}</span>
                                  <div className="flex gap-2">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {dish.category || "Kategori"}
                                    </span>
                                    {dish.price && (
                                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                        {dish.price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {uploadResult.data.menu.dishes.length > 10 && (
                                <div className="text-center text-sm text-gray-500 py-2">
                                  +{uploadResult.data.menu.dishes.length - 10} ürün daha...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">💰 Maliyet Analizi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {uploadResult.data.offer?.breakdown && (
                          <div className="space-y-3">
                            {Object.entries(uploadResult.data.offer.breakdown).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 capitalize">
                                  {key === 'laborCost' ? 'İşçilik' :
                                   key === 'materialCost' ? 'Malzeme' :
                                   key === 'overhead' ? 'Genel Gider' :
                                   key === 'profit' ? 'Kar' :
                                   key === 'marketResearch' ? 'Araştırma' :
                                   key === 'qualityAssurance' ? 'Kalite' : key}
                                </span>
                                <span className="text-sm font-medium">₺{value?.toLocaleString() || 0}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}