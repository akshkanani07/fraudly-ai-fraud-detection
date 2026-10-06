import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Background Gradient / Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.03]" />
      </div>

      {/* Header — Fixed Top */}
      <header className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="Fraudly Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Fraudly</span>
        </Link>
      </header>

      {/* Content — Scrollable only if content overflows */}
      <main className="flex h-full w-full items-center justify-center px-4 pt-16 pb-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-md overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}