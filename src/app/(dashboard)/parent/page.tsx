export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const ParentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId } = await auth();
  const currentUserId = userId;

  if (!currentUserId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
        <div className="w-full rounded-2xl bg-white p-6 text-gray-500 shadow-sm">
          Please sign in to view your parent portal.
        </div>
      </div>
    );
  }

  // Fetch all children associated with this parent
  const children = await prisma.student.findMany({
    where: { parentId: currentUserId },
    include: {
      class: {
        include: {
          grade: true,
          lessons: {
            include: {
              subject: true,
              teacher: true,
            },
          },
        },
      },
      results: {
        include: {
          exam: { select: { title: true, startTime: true } },
          assignment: { select: { title: true } },
        },
        orderBy: { id: "desc" },
        take: 5,
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 30,
      },
      assignmentSubmissions: {
        include: {
          assignment: {
            include: {
              lesson: { select: { subject: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });

  if (children.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <Image src="/student.png" alt="" width={48} height={48} className="opacity-40" />
          <h2 className="mt-3 text-base font-semibold text-gray-800">No Enrolled Children Found</h2>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            No students are currently linked to your parent account. Please contact the school
            administrator to link your child profile.
          </p>
        </div>
      </div>
    );
  }

  // Selected child logic
  const selectedStudentId = resolvedSearchParams.studentId || children[0].id;
  const selectedChild = children.find((c) => c.id === selectedStudentId) || children[0];

  // Calculate statistics for selected child
  const totalAttendances = selectedChild.attendances.length;
  const presentCount = selectedChild.attendances.filter((a) => a.present).length;
  const attendanceRate =
    totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 100;

  const validScores = selectedChild.results.map((r) => r.score).filter((s) => s !== null) as number[];
  const averageScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

  // Extract unique teachers teaching this child's class
  const teachersMap = new Map();
  selectedChild.class.lessons.forEach((lesson) => {
    if (lesson.teacher && !teachersMap.has(lesson.teacher.id)) {
      teachersMap.set(lesson.teacher.id, {
        ...lesson.teacher,
        subjectName: lesson.subject.name,
      });
    }
  });
  const childTeachers = Array.from(teachersMap.values());

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 xl:flex-row">
      {/* LEFT / MAIN COLUMN */}
      <div className="flex w-full flex-col gap-5 xl:w-2/3">
        {/* MULTI-CHILD SELECTOR TABS */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Parent Workspace
              </span>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">
                Children ({children.length} Enrolled)
              </h1>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Active Academic Year
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {children.map((child) => {
              const isSelected = child.id === selectedChild.id;
              return (
                <Link
                  key={child.id}
                  href={`/parent?studentId=${child.id}`}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 sm:px-4 sm:py-3 transition-all duration-150 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                    {child.img ? (
                      <Image src={child.img} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-lamaSky text-xs font-bold text-gray-800">
                        {child.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                      {child.name} {child.surname}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500">
                      Class {child.class.name} · Grade {child.class.grade.level}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* SELECTED CHILD METRICS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-emerald-600">
              Attendance Rate
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{attendanceRate}%</p>
            <span className="mt-0.5 block text-[10px] text-emerald-600">
              {presentCount}/{totalAttendances} Days Present
            </span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-blue-600">
              Avg Exam Score
            </span>
            <p className="mt-1 text-2xl font-bold text-blue-700">
              {averageScore > 0 ? `${averageScore}%` : "N/A"}
            </p>
            <span className="mt-0.5 block text-[10px] text-blue-600">
              {selectedChild.results.length} Recorded Tests
            </span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-purple-600">
              Enrolled Class
            </span>
            <p className="mt-1 text-2xl font-bold text-purple-700">{selectedChild.class.name}</p>
            <span className="mt-0.5 block text-[10px] text-purple-600">
              Grade {selectedChild.class.grade.level}
            </span>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-amber-600">
              Faculty Teachers
            </span>
            <p className="mt-1 text-2xl font-bold text-amber-700">{childTeachers.length}</p>
            <span className="mt-0.5 block text-[10px] text-amber-600">Subject Specialists</span>
          </div>
        </div>

        {/* TIMETABLE SCHEDULE FOR SELECTED CHILD */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-5 shadow-sm">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-800">
                Weekly Timetable ({selectedChild.name} &bull; Class {selectedChild.class.name})
              </h2>
              <p className="text-[11px] text-gray-400">Class periods & scheduled lesson slots</p>
            </div>
            <span className="self-start sm:self-auto rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Mon – Fri (8:00 AM - 5:00 PM)
            </span>
          </div>
          <div className="h-[520px] sm:h-[600px] w-full">
            <BigCalendarContainer type="classId" id={selectedChild.classId} />
          </div>
        </div>

        {/* TEACHERS & FACULTY DIRECTORY FOR SELECTED CHILD */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-800">
                {selectedChild.name}&apos;s Teachers & Faculty
              </h2>
              <p className="text-xs text-gray-400">Direct contact and faculty communications</p>
            </div>
            <Link
              href="/list/messages"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Open Messaging Hub &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {childTeachers.map((teacher: any) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/70 p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
                    {teacher.img ? (
                      <Image src={teacher.img} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-lamaPurpleLight text-xs font-bold text-gray-700">
                        {teacher.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-800">
                      {teacher.name} {teacher.surname}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-blue-600">
                      {teacher.subjectName}
                    </p>
                    {teacher.email && (
                      <p className="truncate text-[10px] text-gray-400">{teacher.email}</p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <Link
                    href={`/list/messages`}
                    className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                  >
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACADEMIC EXAM RESULTS */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-800">
                Recent Exam Results & Scores
              </h2>
              <p className="text-xs text-gray-400">Evaluations for {selectedChild.name}</p>
            </div>
            <Link
              href="/list/results"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View Full Report Card &rarr;
            </Link>
          </div>

          {selectedChild.results.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">No recent exam scores recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {selectedChild.results.map((res) => (
                <div key={res.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <span className="font-bold text-gray-800">
                      {res.exam?.title || res.assignment?.title || "Class Assessment"}
                    </span>
                    <span className="ml-2 text-[10px] text-gray-400">
                      {res.exam?.startTime
                        ? new Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(
                            new Date(res.exam.startTime)
                          )
                        : "Term Assessment"}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      res.score >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : res.score >= 60
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {res.score} / 100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex w-full flex-col gap-6 xl:w-1/3">
        {/* QUICK SHORTCUTS */}
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800">Parent Quick Links</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/list/attendance"
              className="flex items-center gap-2 rounded-xl bg-lamaSkyLight p-3 font-semibold text-gray-700 transition hover:bg-lamaSky"
            >
              <Image src="/attendance.png" alt="" width={18} height={18} />
              <span>Attendance Logs</span>
            </Link>
            <Link
              href="/list/assignments"
              className="flex items-center gap-2 rounded-xl bg-lamaYellowLight p-3 font-semibold text-gray-700 transition hover:bg-lamaYellow"
            >
              <Image src="/assignment.png" alt="" width={18} height={18} />
              <span>Assignments</span>
            </Link>
            <Link
              href="/list/exams"
              className="flex items-center gap-2 rounded-xl bg-lamaPurpleLight p-3 font-semibold text-gray-700 transition hover:bg-lamaPurple"
            >
              <Image src="/exam.png" alt="" width={18} height={18} />
              <span>Exam Dates</span>
            </Link>
            <Link
              href="/list/results"
              className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-gray-700 transition hover:bg-emerald-100"
            >
              <Image src="/result.png" alt="" width={18} height={18} />
              <span>Report Cards</span>
            </Link>
          </div>
        </div>

        {/* ANNOUNCEMENTS & BULLETINS */}
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;

