import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AISettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2 text-gray-100">🔧 AI Entegrasyonları</h1>
        <p className="text-gray-400">Yapay zeka modellerini ve harici API'leri yönetin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Anthropic Claude */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div className="flex-1">
                <div className="text-base">Anthropic Claude</div>
                <div className="text-xs text-gray-400 font-normal">Claude-3.5 Sonnet</div>
              </div>
              <Badge variant="success">Connected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>✅ Claude AI modelleri aktif</p>
              <p>✅ Reasoning & Analysis çalışıyor</p>
              <p>✅ Menu parsing optimizasyonu</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              Son senkronizasyon: 5 dakika önce
            </div>
            <button className="w-full bg-red-600 hover:bg-red-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Bağlantıyı Kes
            </button>
          </CardContent>
        </Card>

        {/* OpenAI GPT */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                O
              </div>
              <div className="flex-1">
                <div className="text-base">OpenAI GPT</div>
                <div className="text-xs text-gray-400 font-normal">GPT-4 Turbo</div>
              </div>
              <Badge variant="outline">Available</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>⚠️ API anahtarı gerekli</p>
              <p>🔄 Alternatif model desteği</p>
              <p>📊 Advanced analytics için optimal</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              API Key: <span className="text-red-400">Yapılandırılmamış</span>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Bağlan
            </button>
          </CardContent>
        </Card>

        {/* Google Gemini */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                G
              </div>
              <div className="flex-1">
                <div className="text-base">Google Gemini Pro</div>
                <div className="text-xs text-gray-400 font-normal">Gemini-1.5-Pro</div>
              </div>
              <Badge variant="outline">Available</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>🎯 Piyasa analizi için optimize</p>
              <p>📈 Fiyat tahmin modelleri</p>
              <p>🧮 Multimodal processing</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              API Key: <span className="text-red-400">Yapılandırılmamış</span>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Bağlan
            </button>
          </CardContent>
        </Card>

        {/* Market API - Geniş kart */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                🛒
              </div>
              <div className="flex-1">
                <div className="text-base">Market API Entegrasyonları</div>
                <div className="text-xs text-gray-400 font-normal">
                  Gerçek zamanlı fiyat verileri
                </div>
              </div>
              <Badge variant="secondary">Development</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4 text-gray-300">
            <div>
              <p className="mb-3">🏪 Desteklenen Marketler:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: "A101", status: "active" },
                  { name: "BİM", status: "active" },
                  { name: "ŞOK", status: "development" },
                  { name: "Migros", status: "planned" },
                  { name: "Metro", status: "planned" },
                  { name: "Tarım Kredi", status: "planned" },
                ].map((market) => (
                  <div
                    key={market.name}
                    className={`p-2 rounded-lg border text-center text-xs ${
                      market.status === "active"
                        ? "border-emerald-600 bg-emerald-600/10 text-emerald-400"
                        : market.status === "development"
                          ? "border-amber-600 bg-amber-600/10 text-amber-400"
                          : "border-gray-600 bg-gray-600/10 text-gray-400"
                    }`}
                  >
                    <div className="font-medium">{market.name}</div>
                    <div className="mt-1">
                      {market.status === "active" && "✅"}
                      {market.status === "development" && "🔄"}
                      {market.status === "planned" && "⏳"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-700 pt-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Aktif Bağlantılar</div>
                <div className="text-lg font-semibold text-emerald-400">2/6</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Son Güncelleme</div>
                <div className="text-sm">15 dakika önce</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">API Durumu</div>
                <div className="text-sm text-emerald-400">✅ Stabil</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
                Yeni Market Ekle
              </button>
              <button className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
                API Ayarları
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Reasoning Engine */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                🧠
              </div>
              <div className="flex-1">
                <div className="text-base">Reasoning Engine</div>
                <div className="text-xs text-gray-400 font-normal">ProCheff AI Core</div>
              </div>
              <Badge variant="success">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>✅ Risk analizi çalışıyor</p>
              <p>✅ Maliyet optimizasyonu</p>
              <p>✅ Beslenme değerlendirmesi</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              Engine Version: v2.1.0
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Konfigüre Et
            </button>
          </CardContent>
        </Card>

        {/* PDF Parser */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                📄
              </div>
              <div className="flex-1">
                <div className="text-base">PDF Parser</div>
                <div className="text-xs text-gray-400 font-normal">Document AI</div>
              </div>
              <Badge variant="success">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>✅ OCR & Text extraction</p>
              <p>✅ Menu structure analysis</p>
              <p>✅ Multi-format support</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              Processed: 1,247 documents
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Test Parse
            </button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-[#161a23] border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">⚡ Sistem Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">98.5%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">4.2s</div>
              <div className="text-gray-400">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">1,247</div>
              <div className="text-gray-400">Processed PDFs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">156</div>
              <div className="text-gray-400">API Calls/min</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
