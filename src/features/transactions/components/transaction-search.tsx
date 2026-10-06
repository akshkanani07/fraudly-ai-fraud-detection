"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TransactionSearchProps {
  value: string | undefined;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export function TransactionSearch({
  value,
  onChange,
  onClear,
  placeholder = "Search by merchant, ID, customer...",
  className,
}: TransactionSearchProps) {
  const [local, setLocal] = useState(value ?? "");
  const lastEmittedRef = useRef(value ?? "");

  useEffect(() => {
    const trimmed = local.trim();
    if (trimmed === lastEmittedRef.current) return;

    const t = setTimeout(() => {
      lastEmittedRef.current = trimmed;
      onChange(trimmed);
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const handleClear = () => {
    setLocal("");
    lastEmittedRef.current = "";
    onClear();
  };

  return (
    <div className={cn("relative w-full sm:max-w-md", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Search transactions"
      />

      {local && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}