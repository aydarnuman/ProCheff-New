"use client";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0f1117] text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161a23] border-r border-gray-800 p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-lg font-bold mb-6 text-emerald-400">ProCheff</h1>
          <nav className="space-y-2 text-sm">
            <Link href="/" className="block px-3 py-2 rounded hover:bg-gray-800">🏠 Ana Sayfa</Link>
            <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-800">📊 Dashboard</Link>
            <Link href="/offer" className="block px-3 py-2 rounded hover:bg-gray-800">💰 Teklif Paneli</Link>
            <Link href="/menu" className="block px-3 py-2 rounded hover:bg-gray-800">📄 Şartname Analizi</Link>
            <Link href="/simulation" className="block px-3 py-2 rounded hover:bg-gray-800">⚖️ Maliyet Simülasyonu</Link>
            <Link href="/ai-settings" className="block px-3 py-2 rounded bg-emerald-600 text-white">🧠 AI Ayarları</Link>
          </nav>
        </div>

        <div className="text-xs text-gray-400 mt-6">
          <p>● Tüm Sistemler Aktif</p>
          <p className="mt-1 opacity-70">v2.3.0</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
