"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  TransactionFilters,
  TransactionSortField,
  SortDirection,
} from "@/features/transactions/types";

interface FilterState extends TransactionFilters {
  page: number;
  pageSize: number;
  sortField: TransactionSortField;
  sortDirection: SortDirection;
}

const DEFAULT_STATE: FilterState = {
  page: 1,
  pageSize: 20,
  sortField: "transactedAt",
  sortDirection: "desc",
};

export function useTransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* ---- Parse from URL ---- */
  const state = useMemo<FilterState>(() => {
    const params = new URLSearchParams(searchParams.toString());

    const parseArr = <T extends string>(key: string): T[] | undefined => {
      const val = params.get(key);
      if (!val) return undefined;
      const arr = val.split(",").filter(Boolean) as T[];
      return arr.length > 0 ? arr : undefined;
    };

    const parseNum = (key: string): number | undefined => {
      const val = params.get(key);
      if (!val) return undefined;
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    };

    const parseBool = (key: string): boolean | undefined => {
      const val = params.get(key);
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    };

    return {
      search: params.get("search") ?? undefined,
      status: parseArr("status"),
      channel: parseArr("channel"),
      riskLevel: parseArr("riskLevel"),
      isFraud: parseBool("isFraud"),
      dateFrom: params.get("dateFrom") ?? undefined,
      dateTo: params.get("dateTo") ?? undefined,
      amountMin: parseNum("amountMin"),
      amountMax: parseNum("amountMax"),
      merchant: params.get("merchant") ?? undefined,
      country: params.get("country") ?? undefined,

      page: parseNum("page") ?? DEFAULT_STATE.page,
      pageSize: parseNum("pageSize") ?? DEFAULT_STATE.pageSize,
      sortField:
        (params.get("sortField") as TransactionSortField) ??
        DEFAULT_STATE.sortField,
      sortDirection:
        (params.get("sortDirection") as SortDirection) ??
        DEFAULT_STATE.sortDirection,
    };
  }, [searchParams]);

  /* ---- Build URL ---- */
  const buildUrl = useCallback(
    (next: Partial<FilterState>): string => {
      const merged = { ...state, ...next };
      const params = new URLSearchParams();

      const setIf = (key: string, val: unknown) => {
        if (val === undefined || val === null || val === "") return;
        if (Array.isArray(val)) {
          if (val.length > 0) params.set(key, val.join(","));
          return;
        }
        if (typeof val === "boolean") {
          params.set(key, String(val));
          return;
        }
        params.set(key, String(val));
      };

      setIf("search", merged.search);
      setIf("status", merged.status);
      setIf("channel", merged.channel);
      setIf("riskLevel", merged.riskLevel);
      setIf("isFraud", merged.isFraud);
      setIf("dateFrom", merged.dateFrom);
      setIf("dateTo", merged.dateTo);
      setIf("amountMin", merged.amountMin);
      setIf("amountMax", merged.amountMax);
      setIf("merchant", merged.merchant);
      setIf("country", merged.country);
      setIf(
        "page",
        merged.page !== DEFAULT_STATE.page ? merged.page : undefined,
      );
      setIf(
        "pageSize",
        merged.pageSize !== DEFAULT_STATE.pageSize
          ? merged.pageSize
          : undefined,
      );
      setIf(
        "sortField",
        merged.sortField !== DEFAULT_STATE.sortField
          ? merged.sortField
          : undefined,
      );
      setIf(
        "sortDirection",
        merged.sortDirection !== DEFAULT_STATE.sortDirection
          ? merged.sortDirection
          : undefined,
      );

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [state, pathname],
  );

  /* ---- Setters ---- */
  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const next: Partial<FilterState> = { [key]: value } as Partial<FilterState>;

      if (
        key !== "page" &&
        key !== "pageSize" &&
        key !== "sortField" &&
        key !== "sortDirection"
      ) {
        next.page = 1;
      }

      router.push(buildUrl(next), { scroll: false });
    },
    [buildUrl, router],
  );

  const setFilters = useCallback(
    (patch: Partial<FilterState>) => {
      const next: Partial<FilterState> = { ...patch };
      if (!("page" in patch)) next.page = 1;
      router.push(buildUrl(next), { scroll: false });
    },
    [buildUrl, router],
  );

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const clearFilter = useCallback(
    (key: keyof FilterState) => {
      const next: Partial<FilterState> = { [key]: undefined, page: 1 };
      router.push(buildUrl(next), { scroll: false });
    },
    [buildUrl, router],
  );

  /* ---- Active Filter Count ---- */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.search) count++;
    if (state.status?.length) count++;
    if (state.channel?.length) count++;
    if (state.riskLevel?.length) count++;
    if (state.isFraud !== undefined) count++;
    if (state.dateFrom || state.dateTo) count++;
    if (state.amountMin !== undefined || state.amountMax !== undefined) count++;
    if (state.merchant) count++;
    if (state.country) count++;
    return count;
  }, [state]);

  /* ---- API Params (Ready for Fetch) ---- */
  const apiParams = useMemo(
    () => ({
      search: state.search,
      status: state.status,
      channel: state.channel,
      riskLevel: state.riskLevel,
      isFraud: state.isFraud,
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
      amountMin: state.amountMin,
      amountMax: state.amountMax,
      merchant: state.merchant,
      country: state.country,
      page: state.page,
      pageSize: state.pageSize,
      sort: {
        field: state.sortField,
        direction: state.sortDirection,
      },
    }),
    [state],
  );

  return {
    state,
    apiParams,
    activeFilterCount,
    setFilter,
    setFilters,
    resetFilters,
    clearFilter,
  };
}