import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AISettings() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-100">🔧 AI Entegrasyonları</h1>
      <p className="text-gray-400 mb-8">Yapay zeka modellerini ve harici API&apos;leri yönetin</p>

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
              <p>🔑 GPT modellerine erişim için API key gerekli</p>
              <p>🎯 Menü analizi ve teklif optimizasyonu</p>
              <p>📊 Piyasa trend analizi desteği</p>
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
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
              <p>💎 Piyasa analizi ve fiyat tahminleri</p>
              <p>📈 Trend analizi ve risk değerlendirmesi</p>
              <p>🎯 Maliyet optimizasyonu önerileri</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              API Key: <span className="text-red-400">Yapılandırılmamış</span>
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Bağlan
            </button>
          </CardContent>
        </Card>

        {/* Market API */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
              <div className="flex-1">
                <div className="text-base">Market API</div>
                <div className="text-xs text-gray-400 font-normal">Fiyat Entegrasyonları</div>
              </div>
              <Badge variant="secondary">Development</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>🛒 Desteklenen Marketler:</p>
              <div className="flex flex-wrap gap-2">
                {["A101", "BİM", "ŞOK", "Migros", "Metro", "Tarım Kredi"].map((market) => (
                  <Badge key={market} variant="secondary">{market}</Badge>
                ))}
              </div>
              <p>📊 Real-time fiyat güncellemeleri</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              API Status: <span className="text-yellow-400">Geliştiriliyor</span>
            </div>
            <button className="w-full bg-gray-600 hover:bg-gray-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors" disabled>
              Yakında Gelecek
            </button>
          </CardContent>
        </Card>

        {/* Reasoning Engine */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                R
              </div>
              <div className="flex-1">
                <div className="text-base">Reasoning Engine</div>
                <div className="text-xs text-gray-400 font-normal">Cognitive AI</div>
              </div>
              <Badge variant="success">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>🧠 Akıllı risk değerlendirmesi</p>
              <p>⚖️ Maliyet-fayda analizi</p>
              <p>💡 Optimizasyon önerileri</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              Engine Status: <span className="text-green-400">Çalışıyor</span>
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Konfigüre Et
            </button>
          </CardContent>
        </Card>

        {/* Pipeline Status */}
        <Card className="bg-[#161a23] border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                P
              </div>
              <div className="flex-1">
                <div className="text-base">AI Pipeline</div>
                <div className="text-xs text-gray-400 font-normal">PDF-to-Offer</div>
              </div>
              <Badge variant="success">Operational</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-gray-300">
            <div className="space-y-2">
              <p>📄 PDF işleme ve analiz</p>
              <p>🔄 Otomatik pipeline çalışıyor</p>
              <p>⚡ End-to-end süreç optimizasyonu</p>
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              Son işlem: <span className="text-green-400">2 dakika önce</span>
            </div>
            <button className="w-full bg-teal-600 hover:bg-teal-700 rounded-lg py-2.5 text-white text-sm font-medium transition-colors">
              Pipeline Detayları
            </button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="mt-8 p-4 bg-[#161a23] border border-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-100">📊 Sistem Durumu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">API Çağrıları (24s):</span>
            <span className="text-green-400">1,247</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Başarı Oranı:</span>
            <span className="text-green-400">98.5%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Ortalama Yanıt Süresi:</span>
            <span className="text-blue-400">1.2s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
