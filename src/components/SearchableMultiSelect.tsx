"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldError, UseFormSetValue } from "react-hook-form";

export interface MultiSelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface SearchableMultiSelectProps {
  label: string;
  name: string;
  options: MultiSelectOption[];
  defaultValues?: (string | number)[];
  placeholder?: string;
  error?: FieldError | { message?: string };
  setValue?: UseFormSetValue<any>;
  disabled?: boolean;
}

export default function SearchableMultiSelect({
  label,
  name,
  options = [],
  defaultValues = [],
  placeholder = "",
  error,
  setValue,
  disabled = false,
}: SearchableMultiSelectProps) {
  const [selected, setSelected] = useState<(string | number)[]>(() => defaultValues || []);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultValuesKey = JSON.stringify(defaultValues || []);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setSelected(defaultValues || []);
  }, [defaultValuesKey]);

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

  const toggleOption = (val: string | number) => {
    let next: (string | number)[];
    if (selected.some((s) => String(s) === String(val))) {
      next = selected.filter((s) => String(s) !== String(val));
    } else {
      next = [...selected, val];
    }
    setSelected(next);
    if (setValue) {
      setValue(name, next, { shouldValidate: true, shouldDirty: true });
    }
  };

  const removeOption = (e: React.MouseEvent, val: string | number) => {
    e.stopPropagation();
    const next = selected.filter((s) => String(s) !== String(val));
    setSelected(next);
    if (setValue) {
      setValue(name, next, { shouldValidate: true, shouldDirty: true });
    }
  };

  const selectAll = () => {
    const all = options.map((opt) => opt.value);
    setSelected(all);
    if (setValue) {
      setValue(name, all, { shouldValidate: true, shouldDirty: true });
    }
  };

  const clearAll = () => {
    setSelected([]);
    if (setValue) {
      setValue(name, [], { shouldValidate: true, shouldDirty: true });
    }
  };

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => selected.some((s) => String(s) === String(opt.value)));
  }, [options, selected]);

  return (
    <div className="relative flex w-full flex-col gap-1.5 md:w-1/4" ref={containerRef}>
      <label className="text-xs font-semibold text-gray-600">{label}</label>

      {/* Hidden input / serialized data */}
      {selected.map((val) => (
        <input key={String(val)} type="hidden" name={`${name}[]`} value={String(val)} />
      ))}

      {/* Trigger Area with Selected Chips */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex min-h-[42px] cursor-pointer flex-wrap items-center justify-between gap-1.5 rounded-xl border bg-white p-2 text-sm shadow-sm transition-all ${
          isOpen
            ? "border-purple-500 ring-2 ring-purple-100"
            : error
              ? "border-red-400 ring-1 ring-red-100"
              : "border-gray-200 hover:border-gray-300"
        } ${disabled ? "cursor-not-allowed bg-gray-50 opacity-60" : ""}`}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={String(opt.value)}
                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800"
              >
                <span>{opt.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeOption(e, opt.value)}
                    className="rounded p-0.5 hover:bg-purple-200 hover:text-purple-900"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-gray-400">
          {selected.length > 0 && (
            <span className="py-0.2 rounded-full bg-purple-100 px-1.5 text-[10px] font-bold text-purple-700">
              {selected.length}
            </span>
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
        <div className="animate-in fade-in zoom-in-95 absolute left-0 top-[102%] z-50 flex max-h-72 w-full min-w-[260px] flex-col rounded-xl border border-gray-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 duration-150">
          {/* Search Input */}
          <div className="relative mb-2">
            <input
              type="text"
              autoFocus
              placeholder={`Filter ${options.length} options...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/70 py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500"
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

          {/* Quick Actions */}
          <div className="mb-2 flex items-center justify-between border-b border-gray-100 px-1 pb-1.5 text-[11px]">
            <button
              type="button"
              onClick={selectAll}
              className="font-medium text-purple-600 hover:text-purple-800"
            >
              Select All ({options.length})
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="font-medium text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                <p>No matching items</p>
                <p className="mt-0.5 text-[10px] text-gray-400">Try searching another keyword</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredOptions.map((opt) => {
                  const isChecked = selected.some((s) => String(s) === String(opt.value));
                  return (
                    <div
                      key={String(opt.value)}
                      onClick={() => toggleOption(opt.value)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isChecked
                          ? "bg-purple-50 font-semibold text-purple-900"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{opt.label}</span>
                          {opt.subLabel && (
                            <span className="text-[10px] text-gray-400">{opt.subLabel}</span>
                          )}
                        </div>
                      </div>
                      {opt.badge && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer count indicator */}
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5 text-[10px] text-gray-400">
            <span>{selected.length} selected</span>
            <span>
              {filteredOptions.length} of {options.length} records
            </span>
          </div>
        </div>
      )}

      {error?.message && <p className="text-xs text-red-500">{error.message.toString()}</p>}
    </div>
  );
}
