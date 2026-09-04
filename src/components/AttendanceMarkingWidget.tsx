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
        toast.success(res.message || "Attendance saved successfully!");
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
            You will be able to mark student attendance once the Admin assigns lessons and classes
            to your profile.
          </p>
        </div>
      </div>
    );
  }

  const presentCount = Object.values(presenceMap).filter(Boolean).length;
  const totalCount = currentLesson?.students?.length || 0;
  const absentCount = totalCount - presentCount;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* HEADER */}
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-xs font-bold text-green-700">
              ✓
            </span>
            <h2 className="text-base font-bold text-gray-800">Class Attendance Roll-Call</h2>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Mark daily presence for students in your assigned classes.
          </p>
        </div>

        {/* SUMMARY STATS */}
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Present: {presentCount}
          </span>
          <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            Absent: {absentCount}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* CONTROLS ROW */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* LESSON / CLASS SELECTOR */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Select Class / Lesson:
            </label>
            <select
              value={selectedLessonId}
              onChange={(e) => handleLessonChange(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
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
              Attendance Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
            />
          </div>

          {/* BULK TOGGLE BUTTONS */}
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={() => markAll(true)}
              className="flex-1 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* STUDENT ROSTER LIST */}
        <div className="mt-2 overflow-hidden rounded-xl border border-gray-100">
          <div className="bg-gray-50/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Student Roster ({currentLesson?.students?.length || 0} enrolled)
          </div>

          <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto bg-white">
            {currentLesson?.students?.map((student) => {
              const isPresent = presenceMap[student.id] ?? true;
              return (
                <div
                  key={student.id}
                  onClick={() => togglePresence(student.id)}
                  className="flex cursor-pointer items-center justify-between p-3 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={student.img || "/avatar.png"}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-gray-100 object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {student.name} {student.surname}
                      </p>
                      <p className="text-[11px] text-gray-400">@{student.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        isPresent
                          ? "border border-green-200 bg-green-100 text-green-800"
                          : "border border-rose-200 bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isPresent ? "✓ Present" : "✕ Absent"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAVE ACTION BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">
            Tap a student to toggle between Present and Absent.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Save Class Attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}
