"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldError, UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string | number;
  placeholder?: string;
  error?: FieldError | { message?: string };
  register?: UseFormRegisterReturn;
  setValue?: UseFormSetValue<any>;
  disabled?: boolean;
}

export default function SearchableSelect({
  label,
  name,
  options = [],
  defaultValue,
  placeholder = "Search and select...",
  error,
  setValue,
  disabled = false,
}: SearchableSelectProps) {
  const [selected, setSelected] = useState<string | number | undefined>(defaultValue);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(defaultValue);
    if (setValue && defaultValue !== undefined) {
      setValue(name, defaultValue);
    }
  }, [defaultValue, name, setValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => String(opt.value) === String(selected));

  const handleSelect = (val: string | number) => {
    setSelected(val);
    if (setValue) {
      setValue(name, val, { shouldValidate: true, shouldDirty: true });
    }
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected("");
    if (setValue) {
      setValue(name, "", { shouldValidate: true, shouldDirty: true });
    }
    setSearch("");
  };

  return (
    <div className="relative flex w-full flex-col gap-1.5 md:w-1/4" ref={containerRef}>
      <label className="text-xs font-semibold text-gray-600">{label}</label>

      {/* Hidden input to ensure form submission includes this field */}
      <input type="hidden" name={name} value={selected !== undefined ? selected : ""} />

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex min-h-[40px] cursor-pointer items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition-all ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100"
            : error
              ? "border-red-400 ring-1 ring-red-100"
              : "border-gray-200 hover:border-gray-300"
        } ${disabled ? "cursor-not-allowed bg-gray-50 opacity-60" : ""}`}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate font-medium text-gray-900">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="truncate text-xs text-gray-400">({selectedOption.subLabel})</span>
              )}
              {selectedOption.badge && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 pl-2 text-gray-400">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100 hover:text-gray-600"
              title="Clear selection"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Floating Searchable Menu */}
      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute left-0 top-[102%] z-50 flex max-h-64 w-full min-w-[240px] flex-col rounded-xl border border-gray-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 duration-150">
          {/* Search Input */}
          <div className="relative mb-2">
            <input
              type="text"
              autoFocus
              placeholder={`Search in ${options.length} items...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/70 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
            <svg
              className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <p>No matching options</p>
                <p className="mt-0.5 text-[10px] text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(selected);
                  return (
                    <div
                      key={String(opt.value)}
                      onClick={() => handleSelect(opt.value)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition ${
                        isSelected
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="text-[11px] text-gray-500">{opt.subLabel}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {opt.badge && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-blue-600"
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer count indicator */}
          <div className="mt-2 border-t border-gray-100 pt-1.5 text-right text-[10px] text-gray-400">
            Showing {filteredOptions.length} of {options.length} records
          </div>
        </div>
      )}

      {error?.message && <p className="text-xs text-red-500">{error.message.toString()}</p>}
    </div>
  );
}
