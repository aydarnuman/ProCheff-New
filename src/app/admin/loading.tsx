export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] text-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-300">AI Ayarları yükleniyor...</p>
      </div>
    </div>
  );
}
