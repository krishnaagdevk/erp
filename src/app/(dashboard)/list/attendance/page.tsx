import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import AttendanceClassFilter from "@/components/AttendanceClassFilter";
import AttendanceMarkingWidget from "@/components/AttendanceMarkingWidget";

type AttendanceItem = {
  id: number;
  date: Date;
  present: boolean;
  student: {
    name: string;
    surname: string;
    username: string;
  };
  lesson: {
    name: string;
    subject: {
      name: string;
    };
    class: {
      name: string;
    };
    teacher: {
      name: string;
      surname: string;
    };
  };
};

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, search, classId, date, status, tab } = resolvedSearchParams;
  const p = page ? parseInt(page) : 1;

  // Determine active tab: for teacher, default to 'mark' unless filtering or explicitly on 'history'
  const isHistoryFiltered = !!(search || classId || date || status || page);
  const activeTab = tab ? tab : role === "teacher" && !isHistoryFiltered ? "mark" : "history";

  // Fetch available classes for filtering
  const classes = await prisma.class.findMany({
    where: {
      ...(role === "teacher" && currentUserId
        ? {
            OR: [
              { supervisorId: currentUserId },
              { lessons: { some: { teacherId: currentUserId } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      grade: {
        select: {
          level: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const columns = [
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Subject / Lesson",
      accessor: "lesson",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      accessor: "present",
    },
  ];

  const renderRow = (item: AttendanceItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm transition-colors even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-3 p-4">
        <div className="text-lamaSkyDark flex h-8 w-8 items-center justify-center rounded-full bg-lamaSky text-xs font-bold">
          {item.student.name[0]}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">
            {item.student.name} {item.student.surname}
          </h3>
          <p className="text-xs text-gray-500">@{item.student.username}</p>
        </div>
      </td>
      <td>
        <span className="font-medium text-gray-800">
          {item.lesson.subject?.name || item.lesson.name}
        </span>
      </td>
      <td className="hidden font-medium text-gray-600 md:table-cell">{item.lesson.class.name}</td>
      <td className="hidden text-gray-600 md:table-cell">
        {item.lesson.teacher.name} {item.lesson.teacher.surname}
      </td>
      <td className="hidden text-gray-600 md:table-cell">
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(item.date))}
      </td>
      <td>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            item.present
              ? "border border-green-200 bg-green-100 text-green-800"
              : "border border-rose-200 bg-rose-100 text-rose-800"
          }`}
        >
          {item.present ? "Present" : "Absent"}
        </span>
      </td>
    </tr>
  );

  // For Admin or non-restricted roles: require selecting a class first or when selected, filter by that class
  const isAdminOrAccountant = role === "admin" || role === "accountant";
  const selectedClass = classId ? parseInt(classId) : undefined;
  const isClassSelected = !!selectedClass;

  // Role conditions
  const where: any = {};

  if (search) {
    where.OR = [
      { student: { name: { contains: search } } },
      { student: { surname: { contains: search } } },
      { lesson: { name: { contains: search } } },
      { lesson: { subject: { name: { contains: search } } } },
    ];
  }

  // Filter by selected class (either via student's class or lesson's class)
  if (selectedClass) {
    where.student = {
      ...(where.student || {}),
      classId: selectedClass,
    };
  }

  // Filter by date if provided
  if (date) {
    const filterDate = new Date(date);
    const startOfDay = new Date(
      filterDate.getFullYear(),
      filterDate.getMonth(),
      filterDate.getDate()
    );
    const endOfDay = new Date(
      filterDate.getFullYear(),
      filterDate.getMonth(),
      filterDate.getDate(),
      23,
      59,
      59,
      999
    );
    where.date = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  // Filter by presence status
  if (status === "present") {
    where.present = true;
  } else if (status === "absent") {
    where.present = false;
  }

  if (role === "teacher" && currentUserId) {
    where.lesson = { ...(where.lesson || {}), teacherId: currentUserId };
  } else if (role === "student" && currentUserId) {
    where.studentId = currentUserId;
  } else if (role === "parent" && currentUserId) {
    where.student = { ...(where.student || {}), parentId: currentUserId };
  }

  // If admin/accountant hasn't selected a class yet, guide them to select a class first
  const showPromptToSelectClass = isAdminOrAccountant && !isClassSelected && !search;

  let data: AttendanceItem[] = [];
  let count = 0;

  if (activeTab === "history" && !showPromptToSelectClass) {
    const [fetchedData, fetchedCount] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { name: true, surname: true, username: true } },
          lesson: {
            select: {
              name: true,
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);
    data = fetchedData as AttendanceItem[];
    count = fetchedCount;
  }

  // Fetch teacher assigned lessons if current user is a teacher
  let teacherLessons: any[] = [];
  if (role === "teacher" && currentUserId) {
    const fetchedLessons = await prisma.lesson.findMany({
      where: { teacherId: currentUserId },
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

    teacherLessons = fetchedLessons.map((l: any) => ({
      id: l.id,
      name: l.name,
      subjectName: l.subject.name,
      className: `Class ${l.class.name}`,
      classId: l.classId,
      students: l.class.students,
    }));
  }

  return (
    <div className="m-1 mt-0 flex flex-1 flex-col gap-4 rounded-xl bg-white p-2.5 shadow-sm sm:m-4 sm:gap-6 sm:rounded-2xl sm:p-5">
      {/* TOP HEADER */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-100 pb-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800 sm:text-xl">Attendance Center</h1>
          <p className="text-xs text-gray-500">
            Take roll-calls, record daily presence, and audit historical student attendance.
          </p>
        </div>

        {/* TAB SWITCHER */}
        {role === "teacher" ? (
          <div className="flex w-full items-center gap-1.5 rounded-xl bg-gray-100/90 p-1 sm:w-auto">
            <Link
              href="/list/attendance?tab=mark"
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition sm:flex-initial ${
                activeTab === "mark"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>✓ Roll-Call</span>
            </Link>
            <Link
              href="/list/attendance?tab=history"
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition sm:flex-initial ${
                activeTab === "history"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>📋 History & Records</span>
            </Link>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
            <TableSearch />
          </div>
        )}
      </div>

      {/* TAB 1: TEACHER ATTENDANCE MARKING ROLL CALL HUB */}
      {role === "teacher" && activeTab === "mark" && (
        <div className="w-full">
          <AttendanceMarkingWidget lessons={teacherLessons} />
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY & RECORDS */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          {/* SEARCH & FILTERS ROW */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-bold text-gray-700">Attendance History & Records</h2>
              {role === "teacher" && (
                <div className="w-full sm:w-auto">
                  <TableSearch />
                </div>
              )}
            </div>

            <AttendanceClassFilter
              classes={classes}
              selectedClassId={classId}
              selectedDate={date}
              selectedStatus={status}
            />
          </div>

          {/* PROMPT STATE WHEN NO CLASS IS SELECTED FOR ADMIN */}
          {showPromptToSelectClass ? (
            <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-slate-50 p-8 text-center sm:p-12">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-lamaSkyLight sm:h-16 sm:w-16">
                <Image src="/class.png" alt="Select Class" width={32} height={32} />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
                Select a Class / Section to View Attendance
              </h3>
              <p className="mb-4 mt-1 max-w-md text-xs text-gray-500">
                Please choose a class from the dropdown above or click on one of the quick class
                buttons below.
              </p>
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {classes.map((cls: any) => (
                  <Link
                    key={cls.id}
                    href={`/list/attendance?tab=history&classId=${cls.id}`}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-lamaPurple hover:bg-lamaPurpleLight"
                  >
                    Class {cls.name} ({cls._count?.students || 0} students)
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* LIST */}
              <Table columns={columns} renderRow={renderRow} data={data} />
              {/* PAGINATION */}
              <Pagination page={p} count={count} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage;
