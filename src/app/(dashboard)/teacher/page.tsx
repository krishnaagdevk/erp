import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth, getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

const TeacherPage = async () => {
  const { userId } = await auth();
  const user = await getCurrentUser();

  if (!userId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
        <div className="w-full rounded-md bg-white p-4 text-gray-500">
          Please sign in to view teacher dashboard.
        </div>
      </div>
    );
  }

  // Fetch teacher assigned lessons and their enrolled students
  const teacherLessons = await prisma.lesson.findMany({
    where: { teacherId: userId },
    include: {
      subject: { select: { name: true } },
      class: {
        include: {
          students: {
            select: {
              id: true,
              name: true,
              surname: true,
              username: true,
              img: true,
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch count statistics for teacher
  const [totalClassesCount, totalStudentsCount, totalExamsCount] = await Promise.all([
    prisma.class.count({
      where: {
        OR: [{ supervisorId: userId }, { lessons: { some: { teacherId: userId } } }],
      },
    }),
    prisma.student.count({
      where: {
        class: {
          OR: [{ supervisorId: userId }, { lessons: { some: { teacherId: userId } } }],
        },
      },
    }),
    prisma.exam.count({
      where: { lesson: { teacherId: userId } },
    }),
  ]);

  // Fetch today's attendance stats for teacher's lessons
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  const [todayAttendanceCount, todayPresentCount] = await Promise.all([
    prisma.attendance.count({
      where: {
        lesson: { teacherId: userId },
        date: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.attendance.count({
      where: {
        lesson: { teacherId: userId },
        date: { gte: startOfDay, lte: endOfDay },
        present: true,
      },
    }),
  ]);

  const todayAttendanceRate =
    todayAttendanceCount > 0 ? Math.round((todayPresentCount / todayAttendanceCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 xl:flex-row">
      {/* LEFT / MAIN COLUMN */}
      <div className="flex w-full flex-col gap-6 xl:w-2/3">
        {/* HERO GREETING */}

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-gray-400">Assigned Classes</span>
            <p className="mt-1 text-2xl font-bold text-gray-800">{totalClassesCount}</p>
            <span className="mt-1 block text-[11px] text-gray-400">Classes & Sections</span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-emerald-600">Students</span>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{totalStudentsCount}</p>
            <span className="mt-1 block text-[11px] text-emerald-600">Enrolled Students</span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-amber-600">Active Lessons</span>
            <p className="mt-1 text-2xl font-bold text-amber-700">{teacherLessons.length}</p>
            <span className="mt-1 block text-[11px] text-amber-600">Weekly periods</span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-purple-600">
              Today&apos;s Attendance
            </span>
            <p className="mt-1 text-2xl font-bold text-purple-700">
              {todayAttendanceCount > 0 ? `${todayAttendanceRate}%` : "Pending"}
            </p>
            <span className="mt-1 block text-[11px] text-purple-600">
              {todayAttendanceCount > 0
                ? `${todayPresentCount}/${todayAttendanceCount} present`
                : "No roll-call taken today"}
            </span>
          </div>
        </div>

        {/* TIMETABLE SCHEDULE */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800 sm:text-base">
                Weekly Teaching Schedule
              </h2>
              <p className="text-[11px] text-gray-400">Class periods & scheduled lesson slots</p>
            </div>
            <span className="self-start rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:self-auto">
              Mon – Fri (8:00 AM - 5:00 PM)
            </span>
          </div>
          <div className="h-[520px] w-full sm:h-[600px]">
            <BigCalendarContainer type="teacherId" id={userId} />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex w-full flex-col gap-6 xl:w-1/3">
        {/* QUICK DIRECTORY SHORTCUTS */}
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800">Faculty Shortcuts</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/list/classes"
              className="flex items-center gap-2 rounded-xl bg-lamaSkyLight p-3 font-semibold text-gray-700 transition hover:bg-lamaSky"
            >
              <Image src="/class.png" alt="" width={18} height={18} />
              <span>My Classes</span>
            </Link>
            <Link
              href="/list/students"
              className="flex items-center gap-2 rounded-xl bg-lamaYellowLight p-3 font-semibold text-gray-700 transition hover:bg-lamaYellow"
            >
              <Image src="/student.png" alt="" width={18} height={18} />
              <span>My Students</span>
            </Link>
            <Link
              href="/list/exams"
              className="flex items-center gap-2 rounded-xl bg-lamaPurpleLight p-3 font-semibold text-gray-700 transition hover:bg-lamaPurple"
            >
              <Image src="/exam.png" alt="" width={18} height={18} />
              <span>Exams</span>
            </Link>
            <Link
              href="/list/assignments"
              className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-gray-700 transition hover:bg-emerald-100"
            >
              <Image src="/assignment.png" alt="" width={18} height={18} />
              <span>Assignments</span>
            </Link>
          </div>
        </div>

        {/* ANNOUNCEMENTS */}
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;
