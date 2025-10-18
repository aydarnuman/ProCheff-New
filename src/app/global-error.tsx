"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Bir şeyler ters gitti!</h2>
            <p className="text-gray-600 mb-4">{error.message || "Bilinmeyen bir hata oluştu"}</p>
            <button
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
              onClick={() => reset()}
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
