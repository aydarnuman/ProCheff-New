"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { InsightCards } from "@/components/dashboard/InsightCards";

export default function Dashboard() {
  const [protein, setProtein] = useState(18);
  const [carb, setCarb] = useState(64);
  const [risk, setRisk] = useState(70);
  const [offer, setOffer] = useState(48.65);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);

  const fat = Math.max(0, 100 - (protein + carb));
  
  const data = [
    { name: "Protein", value: protein, fill: "#22c55e" },
    { name: "Yağ", value: fat, fill: "#f59e0b" },
    { name: "Karb.", value: carb, fill: "#3b82f6" }
  ];

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advisor/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuType: "15 Günlük",
          adjustments: {
            protein: protein,
            carb: carb
          }
        })
      });
      
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.panelData) {
          setRisk(json.panelData.simulation.reasoning.score);
          setOffer(json.panelData.simulation.newOffer.offerPrice);
          
          // Generate insights from reasoning data
          const reasoning = json.panelData.simulation.reasoning;
          const newInsights = [
            ...reasoning.risks.map((r: string) => ({ 
              title: "⚠️ Risk", 
              description: r, 
              type: "finance", 
              score: 80 
            })),
            ...reasoning.suggestions.map((s: string) => ({ 
              title: "💡 Öneri", 
              description: s, 
              type: "nutrition", 
              score: 85 
            })),
            ...reasoning.compliance.map((c: string) => ({ 
              title: "✅ Uyum", 
              description: c, 
              type: "compliance", 
              score: 90 
            }))
          ];
          setInsights(newInsights);
        }
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🧠 ProCheff Simulation Dashboard
          </h1>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Menü Dengesi */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Menü Dengesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, ""]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-semibold">{protein}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Yağ:</span>
                  <span className="font-semibold">{fat}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Karbonhidrat:</span>
                  <span className="font-semibold">{carb}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Skoru */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚠️ Risk Skoru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {risk}/100
                  </div>
                  <div className="text-sm text-gray-600">Risk Puanı</div>
                </div>
                <Progress 
                  value={risk} 
                  className={`h-6 ${getRiskColor(risk)}`} 
                />
                <div className="text-sm text-center">
                  {risk >= 80 ? "🟢 Düşük Risk" : 
                   risk >= 60 ? "🟡 Orta Risk" : "🔴 Yüksek Risk"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teklif Kontrolü */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Teklif Fiyatı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    {offer.toFixed(2)} ₺
                  </div>
                  <div className="text-sm text-gray-600">Hesaplanan Fiyat</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Protein: {protein}%
                    </label>
                    <Slider 
                      value={[protein]} 
                      min={10} 
                      max={30} 
                      step={1} 
                      onValueChange={(value) => setProtein(value[0])}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium">
                      Karbonhidrat: {carb}%
                    </label>
                    <Slider 
                      value={[carb]} 
                      min={40} 
                      max={80} 
                      step={1} 
                      onValueChange={(value) => setCarb(value[0])}
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleSimulate}
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "⏳ Simülasyon Çalışıyor..." : "🔄 Simülasyon Çalıştır"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Özet Kartları */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Beslenme Dengesi</div>
                <div className="text-sm text-gray-600">
                  {protein >= 15 && carb <= 70 ? "✅ İyi" : "⚠️ Optimize Edilebilir"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Fiyat Durumu</div>
                <div className="text-sm text-gray-600">
                  {offer < 50 ? "💚 Uygun" : "💛 Yüksek"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Risk Seviyesi</div>
                <div className="text-sm text-gray-600">
                  {risk >= 70 ? "🟢 Düşük" : risk >= 50 ? "🟡 Orta" : "🔴 Yüksek"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Genel Durum</div>
                <div className="text-sm text-gray-600">
                  {risk >= 70 && offer < 50 ? "🎯 Optimal" : "⚡ Ayarlama Gerekli"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Kartları */}
        <div className="mt-8">
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧠 AI Insight Kartları
                <span className="text-sm font-normal text-gray-500">
                  ({insights.length} insight)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InsightCards insights={insights} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}