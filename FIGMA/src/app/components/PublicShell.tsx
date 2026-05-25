import { ReactNode } from 'react';

interface PublicShellProps {
  children: ReactNode;
  narrow?: boolean;
}

export function PublicShell({ children, narrow = false }: PublicShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#0B0B0F] via-[#1a1a2e] to-[#0B0B0F] text-white">
      <div
        className={`mx-auto flex min-h-screen w-full items-center justify-center px-4 py-8 md:px-6 lg:px-8 ${
          narrow ? 'max-w-xl' : 'max-w-screen-xl'
        }`}
      >
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
