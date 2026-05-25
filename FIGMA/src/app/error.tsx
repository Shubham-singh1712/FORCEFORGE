"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B0F] p-6 text-white">
      <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <h1 className="mb-2 text-xl font-bold">Something slipped out of focus</h1>
        <p className="mb-4 text-sm text-gray-300">Retry the screen and we will rebuild the session state.</p>
        <button
          onClick={reset}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B0B0F]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
