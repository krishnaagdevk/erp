import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Assignment, Class, Prisma, Subject, Teacher } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";
import { getClassOptions } from "@/lib/queries";
import AssignmentSubmissionModal from "@/components/AssignmentSubmissionModal";
import AssignmentSubmissionsDrawer from "@/components/AssignmentSubmissionsDrawer";

type AssignmentList = Assignment & {
  lesson: {
    name: string;
    subject: Subject;
    class: Class & { _count?: { students: number } };
    teacher: Teacher;
  };
  submissions: any[];
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    {
      header: "Assignment & Subject",
      accessor: "title",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Resources",
      accessor: "resources",
      className: "hidden sm:table-cell",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
    {
      header: "Submission / Status",
      accessor: "status",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: AssignmentList) => {
    // Check current student submission if student
    const studentSubmission =
      role === "student" && currentUserId
        ? item.submissions.find((s) => s.studentId === currentUserId)
        : null;

    const totalStudents = item.lesson.class._count?.students || 0;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 text-sm transition-colors even:bg-slate-50 hover:bg-lamaPurpleLight"
      >
        <td className="p-3 sm:p-4">
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{item.title}</span>
            <span className="text-xs font-medium text-gray-500">
              {item.lesson.subject.name} · {item.lesson.name}
            </span>
            {item.description && (
              <p className="mt-1 line-clamp-2 max-w-sm text-xs text-gray-600">{item.description}</p>
            )}
          </div>
        </td>
        <td className="font-semibold text-gray-700">{item.lesson.class.name}</td>
        <td className="hidden text-gray-600 md:table-cell">
          {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
        </td>
        <td className="hidden sm:table-cell">
          {item.fileUrl ? (
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <span>📄 Worksheet / Doc</span>
            </a>
          ) : (
            <span className="text-xs text-gray-400">None attached</span>
          )}
        </td>
        <td className="hidden text-xs text-gray-600 md:table-cell">
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.dueDate)}
        </td>
        <td>
          {role === "student" ? (
            <AssignmentSubmissionModal
              assignmentId={item.id}
              assignmentTitle={item.title}
              subjectName={item.lesson.subject.name}
              className={`Class ${item.lesson.class.name}`}
              dueDate={item.dueDate}
              existingSubmission={studentSubmission}
            />
          ) : role === "parent" ? (
            <div className="flex flex-col gap-1">
              {item.submissions.map((sub: any) => (
                <span
                  key={sub.id}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                    sub.status === "GRADED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {sub.student.name}: {sub.status === "GRADED" ? `${sub.score} pts` : "Submitted"}
                </span>
              ))}
              {item.submissions.length === 0 && (
                <span className="text-xs font-medium text-amber-600">Pending Submission</span>
              )}
            </div>
          ) : (
            <AssignmentSubmissionsDrawer
              assignmentId={item.id}
              assignmentTitle={item.title}
              submissions={item.submissions}
              totalStudents={totalStudents}
            />
          )}
        </td>
        {(role === "admin" || role === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <FormContainer table="assignment" type="update" data={item} />
              <FormContainer table="assignment" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const renderCard = (item: AssignmentList) => {
    const studentSubmission =
      role === "student" && currentUserId
        ? item.submissions.find((s) => s.studentId === currentUserId)
        : null;

    const totalStudents = item.lesson.class._count?.students || 0;

    return (
      <div
        key={item.id}
        className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <span className="text-xs font-medium text-gray-500">
                {item.lesson.subject.name} · {item.lesson.name}
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
              Class {item.lesson.class.name}
            </span>
          </div>

          {item.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600">
              {item.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.fileUrl && (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
              >
                <span>📄 Worksheet / Doc</span>
              </a>
            )}
            <span className="text-xs text-gray-400">
              Teacher: {item.lesson.teacher.name} {item.lesson.teacher.surname}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5 border-t border-gray-100 pt-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-gray-500">
              <span>📅 Due:</span>
              <span>
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.dueDate)}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {role === "student" ? (
                <AssignmentSubmissionModal
                  assignmentId={item.id}
                  assignmentTitle={item.title}
                  subjectName={item.lesson.subject.name}
                  className={`Class ${item.lesson.class.name}`}
                  dueDate={item.dueDate}
                  existingSubmission={studentSubmission}
                />
              ) : role === "parent" ? (
                <div className="flex flex-col gap-1">
                  {item.submissions.map((sub: any) => (
                    <span
                      key={sub.id}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                        sub.status === "GRADED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {sub.student.name}:{" "}
                      {sub.status === "GRADED" ? `${sub.score} pts` : "Submitted"}
                    </span>
                  ))}
                  {item.submissions.length === 0 && (
                    <span className="text-xs font-medium text-amber-600">Pending Submission</span>
                  )}
                </div>
              ) : (
                <AssignmentSubmissionsDrawer
                  assignmentId={item.id}
                  assignmentTitle={item.title}
                  submissions={item.submissions}
                  totalStudents={totalStudents}
                />
              )}
            </div>
            {(role === "admin" || role === "teacher") && (
              <div className="flex items-center gap-2">
                <FormContainer table="assignment" type="update" data={item} />
                <FormContainer table="assignment" type="delete" id={item.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.AssignmentWhereInput = {};

  query.lesson = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = parseInt(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
            break;
          case "search":
            query.OR = [
              { title: { contains: value } },
              { lesson: { subject: { name: { contains: value } } } },
              { description: { contains: value } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.lesson.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;
    default:
      break;
  }

  let orderBy: Prisma.AssignmentOrderByWithRelationInput = { dueDate: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "title") {
      orderBy = { title: direction as Prisma.SortOrder };
    } else if (field === "dueDate") {
      orderBy = { dueDate: direction as Prisma.SortOrder };
    }
  }

  const [data, count, filterClasses] = await Promise.all([
    prisma.assignment.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            name: true,
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
            class: {
              select: {
                id: true,
                name: true,
                _count: { select: { students: true } },
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                surname: true,
                username: true,
                img: true,
              },
            },
          },
        },
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
    getClassOptions(),
  ]);

  const filterOptions = [
    {
      label: "Class / Section",
      field: "classId",
      options: filterClasses.map((c) => ({ label: `Class ${c.name}`, value: String(c.id) })),
    },
  ];

  return (
    <div className="m-1 mt-0 flex-1 rounded-xl bg-white p-3 shadow-sm sm:m-4 sm:p-5">
      {/* TOP */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800 sm:text-xl">Assignments & Homework</h1>
          <p className="text-xs text-gray-500">
            {role === "student"
              ? "View homework, download worksheets, and submit assignments."
              : role === "teacher"
                ? "Assign worksheets, track student submissions, and grade classwork."
                : "Manage class assignments and homework deadlines."}
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <TableSearch />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Due Date (Earliest First)", field: "dueDate:asc" },
                { label: "Due Date (Latest First)", field: "dueDate:desc" },
                { label: "Assignment Title (A-Z)", field: "title:asc" },
                { label: "Assignment Title (Z-A)", field: "title:desc" },
              ]}
              filterOptions={filterOptions}
            />
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} renderCard={renderCard} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;
