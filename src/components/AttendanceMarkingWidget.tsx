"use client";

import { useState } from "react";
import { markClassAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

type StudentRecord = {
  id: string;
  name: string;
  surname: string;
  username: string;
  img?: string | null;
  present?: boolean;
};

type LessonOption = {
  id: number;
  name: string;
  subjectName: string;
  className: string;
  classId: number;
  students: StudentRecord[];
};

export default function AttendanceMarkingWidget({
  lessons,
  defaultLessonId,
}: {
  lessons: LessonOption[];
  defaultLessonId?: number;
}) {
  const router = useRouter();
  const [selectedLessonId, setSelectedLessonId] = useState<number>(
    defaultLessonId || (lessons[0]?.id ?? 0)
  );
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  // Map student ID to boolean presence
  const [presenceMap, setPresenceMap] = useState<{ [studentId: string]: boolean }>(() => {
    const initial: { [studentId: string]: boolean } = {};
    if (currentLesson?.students) {
      currentLesson.students.forEach((st) => {
        initial[st.id] = st.present ?? true;
      });
    }
    return initial;
  });

  const handleLessonChange = (newLessonId: number) => {
    setSelectedLessonId(newLessonId);
    const newLesson = lessons.find((l) => l.id === newLessonId);
    if (newLesson?.students) {
      const initial: { [studentId: string]: boolean } = {};
      newLesson.students.forEach((st) => {
        initial[st.id] = st.present ?? true;
      });
      setPresenceMap(initial);
    }
  };

  const togglePresence = (studentId: string) => {
    setPresenceMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAll = (present: boolean) => {
    if (!currentLesson?.students) return;
    const updated: { [studentId: string]: boolean } = {};
    currentLesson.students.forEach((st) => {
      updated[st.id] = present;
    });
    setPresenceMap(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLesson) return;

    setLoading(true);
    try {
      const records = currentLesson.students.map((st) => ({
        studentId: st.id,
        present: presenceMap[st.id] ?? true,
      }));

      const res = await markClassAttendance(
        { success: false, error: false },
        {
          lessonId: currentLesson.id,
          date: selectedDate,
          records,
        }
      );

      if (res.success) {
        toast.success(res.message || "Attendance recorded successfully!");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to save attendance.");
      }
    } catch {
      toast.error("An unexpected error occurred while saving attendance.");
    } finally {
      setLoading(false);
    }
  };

  if (!lessons || lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
          <Image
            src="/attendance.png"
            alt="Attendance"
            width={40}
            height={40}
            className="opacity-40"
          />
          <h3 className="mt-3 text-sm font-semibold text-gray-700">No Assigned Lessons Found</h3>
          <p className="mt-1 text-xs text-gray-500">
            You will be able to mark student attendance once lessons are assigned to your profile.
          </p>
        </div>
      </div>
    );
  }

  const presentCount = Object.values(presenceMap).filter(Boolean).length;
  const totalCount = currentLesson?.students?.length || 0;
  const absentCount = totalCount - presentCount;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-5">
      {/* HEADER */}
      <div className="mb-3 flex flex-col gap-2.5 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700">
              ✓
            </span>
            <h2 className="text-sm font-bold text-gray-800 sm:text-base">
              Class Attendance Roll-Call
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
            Mark daily presence for your assigned class roster.
          </p>
        </div>

        {/* SUMMARY STATS BADGES */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 sm:px-2.5 sm:py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Present: {presentCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 sm:px-2.5 sm:py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Absent: {absentCount}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
        {/* CONTROLS ROW */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* LESSON / CLASS SELECTOR */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Class & Subject
            </label>
            <select
              value={selectedLessonId}
              onChange={(e) => handleLessonChange(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.className} - {l.subjectName} ({l.students.length} students)
                </option>
              ))}
            </select>
          </div>

          {/* DATE SELECTOR */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
            />
          </div>
        </div>

        {/* STUDENT ROSTER LIST */}
        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-2 text-[11px] font-semibold text-gray-500">
            <span>STUDENT STRENGTH ({currentLesson?.students?.length || 0})</span>
          </div>

          <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
            {currentLesson?.students?.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No students enrolled in this class.
              </div>
            ) : (
              currentLesson?.students?.map((student, index) => {
                const isPresent = presenceMap[student.id] ?? true;
                const rollNumber = String(index + 1).padStart(2, "0");
                return (
                  <div
                    key={student.id}
                    onClick={() => togglePresence(student.id)}
                    className="flex cursor-pointer select-none items-center justify-between p-2 transition hover:bg-slate-50 sm:p-3"
                  >
                    {/* LEFT: ROLL NO + STUDENT DETAILS */}
                    <div className="flex min-w-0 items-center gap-2 pr-2 sm:gap-3">
                      {/* ROLL NO BADGE */}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 sm:h-8 sm:w-8 sm:text-xs">
                        {rollNumber}
                      </span>

                      {/* NAME & USERNAME */}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold leading-tight text-gray-800 sm:text-sm">
                          {student.name} {student.surname}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT: TOGGLE BUTTON */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePresence(student.id);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all duration-150 active:scale-95 ${
                          isPresent
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black text-white ${
                            isPresent ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        >
                          {isPresent ? "✓" : "✕"}
                        </span>
                        <span className="font-semibold">{isPresent ? "P" : "A"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAVE ACTION BUTTON */}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Submitting..." : "Save Class Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}
