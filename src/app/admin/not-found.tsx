import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] text-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-emerald-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Sayfa Bulunamadı</h2>
        <p className="text-gray-400 mb-8">Aradığınız admin sayfası mevcut değil.</p>
        <div className="space-y-2">
          <Link
            href="/admin/ai-settings"
            className="block bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 transition-colors"
          >
            🔧 AI Ayarları
          </Link>
          <Link
            href="/dashboard"
            className="block bg-gray-700 text-white px-6 py-3 rounded hover:bg-gray-600 transition-colors"
          >
            🏠 Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
