"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
  unreadCount?: number;
}

/* ============================================================
 * Sidebar Collapsed State — Lazy Initializer
 * ============================================================ */
function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("fraudly:sidebar-collapsed") === "true";
  } catch {
    return false;
  }
}

export function DashboardShell({
  children,
  user,
  unreadCount = 0,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState<boolean>(getInitialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fraudly:sidebar-collapsed", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ---- Desktop Sidebar ---- */}
      <div className="hidden lg:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={handleToggle}
          userRole={user.role}
        />
      </div>

      {/* ---- Mobile Sidebar (Sheet) ---- */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-65 p-0">
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            userRole={user.role}
          />
        </SheetContent>
      </Sheet>

      {/* ---- Main ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          unreadCount={unreadCount}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        {/* ---- Content ---- */}
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-background",
            "bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_70%)]",
          )}
        >
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}