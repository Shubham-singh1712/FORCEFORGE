export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0B0B0F] p-6 text-white">
      <div className="mx-auto grid max-w-screen-xl gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    </main>
  );
}
