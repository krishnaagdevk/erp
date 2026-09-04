"use client";

import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface SortField {
  label: string;
  field: string;
}

interface TableActionsProps {
  sortFields?: SortField[];
  filterOptions?: {
    label: string;
    field: string;
    options: { label: string; value: string }[];
  }[];
}

export default function TableActions({
  sortFields = [
    { label: "Name / Title (A-Z)", field: "name:asc" },
    { label: "Name / Title (Z-A)", field: "name:desc" },
    { label: "Newest First", field: "createdAt:desc" },
    { label: "Oldest First", field: "createdAt:asc" },
  ],
  filterOptions,
}: TableActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") || "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateParam = (key: string, val: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === null || val === "" || val === undefined) {
      params.delete(key);
    } else {
      params.set(key, val);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (field: string) => {
    if (currentSort === field) {
      updateParam("sort", null);
    } else {
      updateParam("sort", field);
    }
    setSortOpen(false);
  };

  const clearAllFilters = () => {
    router.push(pathname);
    setFilterOpen(false);
  };

  const hasActiveFilters = Array.from(searchParams.entries()).some(
    ([k]) => k !== "page" && k !== "search"
  );

  return (
    <div className="relative flex items-center gap-2" ref={containerRef}>
      {/* FILTER BUTTON */}
      <button
        type="button"
        title="Filter data"
        onClick={() => {
          setFilterOpen((prev) => !prev);
          setSortOpen(false);
        }}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition ${
          hasActiveFilters || filterOpen
            ? "bg-amber-400 text-gray-900 shadow-md ring-2 ring-amber-200"
            : "bg-lamaYellow hover:bg-amber-300"
        }`}
      >
        <Image src="/filter.png" alt="filter" width={14} height={14} />
        {hasActiveFilters && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-blue-600" />
        )}
      </button>

      {/* SORT BUTTON */}
      <button
        type="button"
        title="Sort data"
        onClick={() => {
          setSortOpen((prev) => !prev);
          setFilterOpen(false);
        }}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition ${
          currentSort || sortOpen
            ? "bg-amber-400 text-gray-900 shadow-md ring-2 ring-amber-200"
            : "bg-lamaYellow hover:bg-amber-300"
        }`}
      >
        <Image src="/sort.png" alt="sort" width={14} height={14} />
        {currentSort && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white bg-purple-600" />
        )}
      </button>

      {/* FILTER POPUP */}
      {filterOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 top-10 z-50 flex w-72 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Filter Options
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Reset All
              </button>
            )}
          </div>

          <div className="my-3 flex flex-col gap-3">
            {filterOptions && filterOptions.length > 0 ? (
              filterOptions.map((f) => {
                const currentVal = searchParams.get(f.field) || "";
                return (
                  <div key={f.field} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                    <select
                      value={currentVal}
                      onChange={(e) => updateParam(f.field, e.target.value)}
                      className="rounded-xl border border-gray-200 bg-gray-50/70 p-2 text-xs outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="">All / Any</option>
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-center text-xs text-gray-500">
                <p>Use the search box to filter results in real time.</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-2 text-right">
            <button
              onClick={() => setFilterOpen(false)}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SORT POPUP */}
      {sortOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 top-10 z-50 flex w-56 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Sort By
            </span>
            {currentSort && (
              <button
                onClick={() => handleSort("")}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800"
              >
                Clear
              </button>
            )}
          </div>

          <div className="my-2 flex flex-col gap-1">
            {sortFields.map((s) => {
              const isSelected = currentSort === s.field;
              return (
                <button
                  key={s.field}
                  type="button"
                  onClick={() => handleSort(s.field)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                    isSelected
                      ? "bg-purple-50 font-semibold text-purple-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{s.label}</span>
                  {isSelected && (
                    <svg
                      className="h-3.5 w-3.5 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
