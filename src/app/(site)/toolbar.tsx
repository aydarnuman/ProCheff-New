"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Toolbar() {
  const path = usePathname();
  
  const link = (href: string, label: string, icon: string) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        path === href 
          ? "bg-emerald-600 text-white shadow-lg" 
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  );

  return (
    <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-emerald-400">
              🧠 ProCheff
            </Link>
            <div className="text-xs text-gray-400 hidden sm:block">
              v2.3.0 | AI-Powered Menu Intelligence
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-3">
            {link("/menu", "Menü Analizi", "🍽️")}
            {link("/offer", "Teklif Paneli", "💰")}
            {link("/dashboard", "Dashboard", "📊")}
            {link("/admin/ai-settings", "AI Ayarları", "⚙️")}
          </nav>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-400 hidden sm:block">Tüm Sistemler Aktif</span>
          </div>
        </div>
      </div>
    </header>
  );
}
