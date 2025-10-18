"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] text-gray-100">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-red-400 mb-4">🚨 Admin Panel Hatası</h2>
        <p className="text-gray-300 mb-4">{error.message || "Admin panelinde bir hata oluştu"}</p>
        <div className="space-y-2">
          <button
            className="block w-full bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors"
            onClick={() => reset()}
          >
            🔄 Tekrar Dene
          </button>
          <a
            href="/dashboard"
            className="block w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            🏠 Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}
