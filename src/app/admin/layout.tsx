"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "🏠 Ana Sayfa", icon: "🏠" },
    { href: "/upload", label: "📄 PDF Yükle", icon: "📄" },
    { href: "/menu", label: "🍽️ Menü Analizi", icon: "🍽️" },
    { href: "/offer", label: "💰 Teklif Paneli", icon: "💰" },
    { href: "/market", label: "🛒 Piyasa Analizi", icon: "🛒" },
    { href: "/reasoning", label: "🧠 Risk Analizi", icon: "🧠" },
    { href: "/advisor", label: "⚖️ Simülasyon", icon: "⚖️" },
    { href: "/admin/ai-settings", label: "🔧 AI Ayarları", icon: "🔧" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161a23] border-r border-gray-800 p-4 flex flex-col justify-between">
        <div>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-emerald-400">ProCheff</h1>
            <p className="text-xs text-gray-400 mt-1">AI-Powered Food Analysis</p>
          </div>

          <nav className="space-y-1 text-sm">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label.split(" ").slice(1).join(" ")}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Tüm Sistemler Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>API Bağlantıları OK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>AI Modelleri Hazır</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>v1.0.0 • ProCheff AI</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-[#161a23] border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">
                {menuItems.find(
                  (item) => pathname === item.href || pathname.startsWith(item.href + "/")
                )?.label || "ProCheff Dashboard"}
              </h2>
              <p className="text-sm text-gray-400">
                AI destekli menü analizi ve fiyatlandırma sistemi
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}
              </div>
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                P
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
