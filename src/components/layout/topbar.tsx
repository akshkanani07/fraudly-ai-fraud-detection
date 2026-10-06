"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";

/* ============================================================
 * Types
 * ============================================================ */
interface TopbarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
  };
  unreadCount?: number;
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

/* ============================================================
 * Topbar
 * ============================================================ */
export function Topbar({
  user,
  unreadCount = 0,
  onOpenMobileSidebar,
  onOpenCommandPalette,
}: TopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      {/* ---- Mobile Menu ---- */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobileSidebar}
        className="h-9 w-9 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* ---- Breadcrumbs ---- */}
      <Breadcrumbs pathname={pathname} />

      {/* ---- Spacer ---- */}
      <div className="flex-1" />

      {/* ---- Command Palette Trigger ---- */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCommandPalette}
        className="hidden h-9 gap-2 text-muted-foreground sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search...</span>
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* ---- Quick Icon (Mobile) ---- */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenCommandPalette}
        className="h-9 w-9 sm:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* ---- Theme Toggle ---- */}
      <ThemeToggle />

      {/* ---- Notifications ---- */}
      <NotificationsButton unreadCount={unreadCount} />

      {/* ---- User Menu ---- */}
      <UserMenu user={user} />
    </header>
  );
}

/* ============================================================
 * Breadcrumbs
 * ============================================================ */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden items-center gap-1.5 text-sm md:flex"
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = segment
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");

        return (
          <div key={href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ============================================================
 * Theme Toggle
 * ============================================================ */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/* ============================================================
 * Notifications
 * ============================================================ */
function NotificationsButton({ unreadCount }: { unreadCount: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label="Notifications"
      onClick={() => {
        window.location.href = "/notifications";
      }}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[9px] leading-none"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

/* ============================================================
 * User Menu
 * ============================================================ */
interface UserMenuProps {
  user: TopbarProps["user"];
}

function UserMenu({ user }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-full p-0.5 transition-colors",
              "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8 border border-border/60">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-10 w-10 border border-border/60">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                {user.role && (
                  <Badge
                    variant="secondary"
                    className="mt-1 w-fit text-[10px] capitalize"
                  >
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            window.location.href = "/settings";
          }}
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            window.location.href = "/settings";
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}