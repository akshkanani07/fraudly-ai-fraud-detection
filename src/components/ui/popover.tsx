"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

/* ============================================================
 * Root
 * ============================================================ */
function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/* ============================================================
 * Trigger
 * ============================================================ */
function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/* ============================================================
 * Content — with Blur + Backdrop
 * ============================================================ */
interface PopoverContentProps
  extends React.ComponentProps<typeof PopoverPrimitive.Popup> {
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
}

function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  collisionPadding = 8,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            /* Base Layout */
            "z-50 w-72 origin-(--transform-origin) rounded-xl border border-border/60 p-4 shadow-2xl outline-hidden",
            /* ✅ Glassmorphism — Semi-Transparent + Blur */
            "bg-background/80 backdrop-blur-2xl backdrop-saturate-150",
            "text-popover-foreground",
            /* Subtle Inner Glow */
            "ring-1 ring-white/5 dark:ring-white/10",
            /* Animation */
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

/* ============================================================
 * Anchor
 * ============================================================ */
function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };