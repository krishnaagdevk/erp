"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface UserCardDropdownProps {
  type: "admin" | "teacher" | "student" | "parent" | "accountant";
  count: number;
}

export default function UserCardDropdown({ type, count }: UserCardDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const getTargetUrl = () => {
    switch (type) {
      case "teacher":
        return "/list/teachers";
      case "student":
        return "/list/students";
      case "parent":
        return "/list/parents";
      case "accountant":
        return "/list/accountants";
      case "admin":
        return "/settings";
      default:
        return "/";
    }
  };

  const getRelatedUrl = () => {
    switch (type) {
      case "teacher":
        return "/list/lessons";
      case "student":
        return "/list/attendance";
      case "parent":
        return "/list/fees";
      case "accountant":
        return "/accountant";
      case "admin":
        return "/profile";
      default:
        return "/";
    }
  };

  const getRelatedLabel = () => {
    switch (type) {
      case "teacher":
        return "View Assigned Lessons";
      case "student":
        return "Check Attendance Logs";
      case "parent":
        return "Fee & Billing Ledger";
      case "accountant":
        return "Accountant Workspace";
      case "admin":
        return "Admin Security Profile";
      default:
        return "Related Operations";
    }
  };

  const handleExportSummary = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      `Category,Total Active Records,Timestamp\n` +
      `${type.toUpperCase()}S,${count},"${new Date().toISOString()}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`${type} options`}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-black/10 focus:outline-none active:scale-95"
      >
        <Image src="/more.png" alt="Actions" width={20} height={20} className="cursor-pointer" />
      </button>

      {open && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-50 mt-1 w-56 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 duration-100">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {type} Management
            </p>
            <p className="text-xs font-bold text-gray-800">
              {count} Active {type.charAt(0).toUpperCase() + type.slice(1)}s
            </p>
          </div>

          <div className="py-1">
            <Link
              href={getTargetUrl()}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-lamaSkyLight hover:text-lamaSky"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span>View All {type.charAt(0).toUpperCase() + type.slice(1)}s</span>
            </Link>

            {type !== "admin" && (
              <Link
                href={getTargetUrl()}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-lamaPurpleLight hover:text-purple-700"
              >
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add New {type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </Link>
            )}

            <Link
              href={getRelatedUrl()}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-lamaYellowLight hover:text-amber-800"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>{getRelatedLabel()}</span>
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              type="button"
              onClick={handleExportSummary}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Export CSV Summary</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
