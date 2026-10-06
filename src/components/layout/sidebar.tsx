"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAVIGATION, type NavItem } from "@/config/navigation";

/* ============================================================
 * Sidebar
 * ============================================================ */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole?: string;
}

export function Sidebar({ collapsed, onToggle, userRole }: SidebarProps) {
  const pathname = usePathname();

  /* Filter by role */
  const sections = useMemo(() => {
    return NAVIGATION.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!userRole) return false;
        return item.roles.includes(userRole as "user" | "admin" | "analyst");
      }),
    })).filter((section) => section.items.length > 0);
  }, [userRole]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "group/sidebar relative flex h-screen flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {/* ---- Brand ---- */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border/60",
            collapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 transition-opacity hover:opacity-80",
              collapsed && "justify-center",
            )}
            aria-label="Fraudly"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-base font-semibold leading-tight tracking-tight">
                  Fraudly
                </span>
                <span className="text-[10px] uppercase leading-tight tracking-widest text-muted-foreground">
                  Enterprise
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ---- Navigation ---- */}
        <ScrollArea className="flex-1 overflow-hidden">
          <nav
            className={cn(
              "flex flex-col gap-6 py-4",
              collapsed ? "px-2" : "px-3",
            )}
          >
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                {!collapsed && (
                  <h3 className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {section.title}
                  </h3>
                )}
                {collapsed && (
                  <div className="mx-auto mb-1 h-px w-6 bg-border/60" />
                )}

                {section.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href))
                    }
                    collapsed={collapsed}
                  />
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* ---- Collapse Toggle (when collapsed) ---- */}
        {collapsed && (
          <div className="shrink-0 border-t border-border/60 p-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-10 w-full text-muted-foreground hover:text-foreground"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

/* ============================================================
 * Sidebar Link
 * ============================================================ */
interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

function SidebarLink({ item, active, collapsed }: SidebarLinkProps) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-all",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {/* Active Indicator Bar */}
      {active && (
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary",
            collapsed && "left-0 h-6 w-1",
          )}
        />
      )}

      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110",
          active && "text-primary",
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <Badge
              variant={item.badgeVariant ?? "secondary"}
              className="h-5 min-w-5 rounded-full px-1.5 text-[10px]"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  /* Tooltip only when collapsed */
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent side="right" className="ml-1">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}