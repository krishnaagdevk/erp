export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import AttendanceMarkingWidget from "@/components/AttendanceMarkingWidget";
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
  const [totalClassesCount, totalStudentsCount, totalExamsCount] = await prisma.$transaction([
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

  const lessonOptions = teacherLessons.map((l: any) => ({
    id: l.id,
    name: l.name,
    subjectName: l.subject.name,
    className: `Class ${l.class.name}`,
    classId: l.classId,
    students: l.class.students,
  }));

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 xl:flex-row">
      {/* LEFT / MAIN COLUMN */}
      <div className="flex w-full flex-col gap-6 xl:w-2/3">
        {/* HERO GREETING */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 text-white shadow-lg sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Teacher Faculty Workspace
            </span>
            <h1 className="mt-2 text-2xl font-bold">Welcome back, {user?.name || "Teacher"}!</h1>
            <p className="mt-1 max-w-md text-xs text-emerald-100 sm:text-sm">
              Manage your assigned classes, take attendance roll-calls, create exams and
              assignments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/list/attendance"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <span>Attendance History</span>
            </Link>
          </div>
        </div>

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
            <span className="text-xs font-medium uppercase text-purple-600">Exams Scheduled</span>
            <p className="mt-1 text-2xl font-bold text-purple-700">{totalExamsCount}</p>
            <span className="mt-1 block text-[11px] text-purple-600">Upcoming tests</span>
          </div>
        </div>

        {/* INTERACTIVE ATTENDANCE MARKING WIDGET */}
        <AttendanceMarkingWidget lessons={lessonOptions} />

        {/* TIMETABLE SCHEDULE */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800">Weekly Teaching Schedule</h2>
            <span className="text-xs text-gray-400">Periods & Lesson slots</span>
          </div>
          <div className="h-[600px]">
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
