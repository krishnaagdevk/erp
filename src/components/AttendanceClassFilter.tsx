"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type ClassItem = {
  id: number;
  name: string;
  grade?: {
    level: number;
  };
  _count?: {
    students: number;
  };
};

export default function AttendanceClassFilter({
  classes,
  selectedClassId,
  selectedDate,
  selectedStatus,
}: {
  classes: ClassItem[];
  selectedClassId?: string;
  selectedDate?: string;
  selectedStatus?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleClassChange = (classId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (classId) {
      params.set("classId", classId);
    } else {
      params.delete("classId");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-slate-50 p-3">
      {/* Class Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="class-select" className="text-xs font-semibold text-gray-600">
          Class / Section:
        </label>
        <select
          id="class-select"
          value={selectedClassId || ""}
          onChange={(e) => handleClassChange(e.target.value)}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lamaSky"
        >
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              Class {cls.name} {cls._count ? `(${cls._count.students} students)` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="date-select" className="text-xs font-semibold text-gray-600">
          Date:
        </label>
        <input
          id="date-select"
          type="date"
          value={selectedDate || ""}
          onChange={(e) => handleDateChange(e.target.value)}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lamaSky"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-select" className="text-xs font-semibold text-gray-600">
          Status:
        </label>
        <select
          id="status-select"
          value={selectedStatus || ""}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-lamaSky"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {(selectedClassId || selectedDate || selectedStatus) && (
        <button
          onClick={clearFilters}
          className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
