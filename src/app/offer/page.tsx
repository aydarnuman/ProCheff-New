"use client";
import { usePanelData } from "@/app/(site)/store/panelData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export default function OfferPage() {
  const { panelData, updateOffer } = usePanelData();
  const [materialCost, setMaterialCost] = useState(100);
  const [laborCost, setLaborCost] = useState(80);
  const [profitMargin, setProfitMargin] = useState(20);

  const calculateOffer = () => {
    const overheadRate = 0.15;
    const overhead = materialCost * overheadRate;
    const totalCost = materialCost + laborCost + overhead;
    const profit = totalCost * (profitMargin / 100);
    const finalPrice = totalCost + profit;

    const offer = {
      finalPrice,
      currency: "TL",
      perUnit: "portion",
      detail: {
        material: materialCost,
        labor: laborCost,
        overhead,
        profit,
      },
    };

    updateOffer(offer);
    return offer;
  };

  const currentOffer = panelData.offer || calculateOffer();
  const kThreshold = 0.93;
  const belowThreshold = currentOffer.finalPrice < (materialCost + laborCost) * 1.1;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-4">💰 Teklif Paneli</h1>
          <p className="text-gray-400">
            Maliyet analizi ve teklif hesaplama sistemi
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Maliyet Girişleri */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">📊 Maliyet Girişleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Malzeme Maliyeti: {materialCost} ₺
                </label>
                <Slider
                  value={[materialCost]}
                  onValueChange={(value) => setMaterialCost(value[0])}
                  max={500}
                  min={50}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  İşçilik Maliyeti: {laborCost} ₺
                </label>
                <Slider
                  value={[laborCost]}
                  onValueChange={(value) => setLaborCost(value[0])}
                  max={300}
                  min={30}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kar Marjı: %{profitMargin}
                </label>
                <Slider
                  value={[profitMargin]}
                  onValueChange={(value) => setProfitMargin(value[0])}
                  max={50}
                  min={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <button
                onClick={calculateOffer}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                🔄 Teklifi Hesapla
              </button>
            </CardContent>
          </Card>

          {/* Teklif Detayları */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                💎 Teklif Detayları
                <Badge variant={belowThreshold ? "destructive" : "success"}>
                  {belowThreshold ? "Risk" : "Güvenli"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center border-b border-gray-700 pb-4">
                <div className="text-3xl font-bold text-emerald-400">
                  {currentOffer.finalPrice.toFixed(2)} ₺
                </div>
                <div className="text-sm text-gray-400">Birim Fiyat</div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Malzeme:</span>
                  <span className="text-gray-100">{currentOffer.detail.material.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">İşçilik:</span>
                  <span className="text-gray-100">{currentOffer.detail.labor.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Genel Gider:</span>
                  <span className="text-gray-100">{currentOffer.detail.overhead.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Kar:</span>
                  <span className="text-gray-100">{currentOffer.detail.profit.toFixed(2)} ₺</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-300">Toplam:</span>
                  <span className="text-emerald-400">{currentOffer.finalPrice.toFixed(2)} ₺</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Analizi */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">⚠️ Risk Analizi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${belowThreshold ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-300">
                    K={kThreshold} Uygunluk
                  </span>
                </div>

                <div className="text-xs text-gray-400">
                  {belowThreshold 
                    ? "⚠️ Teklif fiyatı KİK K=0.93 sınırının altında olabilir"
                    : "✅ Teklif fiyatı KİK standartlarına uygun"
                  }
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Malzeme Oranı:</span>
                    <span className="text-gray-300">
                      %{((currentOffer.detail.material / currentOffer.finalPrice) * 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kar Oranı:</span>
                    <span className="text-gray-300">
                      %{((currentOffer.detail.profit / currentOffer.finalPrice) * 100).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Öneriler</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {currentOffer.detail.material / currentOffer.finalPrice > 0.7 && (
                    <li>• Malzeme maliyetini düşürmeyi düşünün</li>
                  )}
                  {currentOffer.detail.profit / currentOffer.finalPrice < 0.05 && (
                    <li>• Kar marjı çok düşük, artırmayı değerlendirin</li>
                  )}
                  {!belowThreshold && (
                    <li>• Teklif rekabetçi ve güvenli</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alt Panel */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Piyasa Karşılaştırması */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">📈 Piyasa Karşılaştırması</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sizin Teklifiniz:</span>
                  <span className="text-emerald-400 font-semibold">{currentOffer.finalPrice.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Piyasa Ortalaması:</span>
                  <span className="text-gray-300">{(currentOffer.finalPrice * 1.15).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rekabet Durumu:</span>
                  <Badge variant="success">Avantajlı</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geçmiş Teklifler */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">📊 Geçmiş Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bu Ay Teklifler:</span>
                  <span className="text-gray-300">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Kazanma Oranı:</span>
                  <span className="text-green-400">75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ortalama Kar:</span>
                  <span className="text-gray-300">%18.5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
