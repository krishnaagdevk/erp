import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";
import { getClassOptions, getSubjectOptions, getTeacherOptions } from "@/lib/queries";

type LessonList = Lesson & { subject: Subject } & { class: Class } & {
  teacher: Teacher;
};

const LessonListPage = async ({
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
      header: "Subject Name",
      accessor: "name",
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
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: LessonList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-medium text-gray-800">{item.subject.name}</td>
      <td>{item.class.name}</td>
      <td className="hidden md:table-cell">{item.teacher.name + " " + item.teacher.surname}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="lesson" type="update" data={item} />
              <FormContainer table="lesson" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: LessonList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{item.name}</h3>
            <span className="text-xs font-semibold text-lamaPurple">{item.subject.name}</span>
          </div>
          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
            Class {item.class.name}
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <span>👨‍🏫 Teacher:</span>
          <span className="font-medium text-gray-700">
            {item.teacher.name} {item.teacher.surname}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
        <span className="text-xs font-medium text-gray-400">Day: {item.day}</span>
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <FormContainer table="lesson" type="update" data={item} />
            <FormContainer table="lesson" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.LessonWhereInput = {};

  if (role === "teacher" && currentUserId) {
    query.teacherId = currentUserId;
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "subjectId":
            query.subjectId = parseInt(value);
            break;
          case "search":
            query.OR = [
              { name: { contains: value } },
              { subject: { name: { contains: value } } },
              { teacher: { name: { contains: value } } },
              { teacher: { surname: { contains: value } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Prisma.LessonOrderByWithRelationInput = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "name") {
      orderBy = { name: direction as Prisma.SortOrder };
    } else if (field === "day") {
      orderBy = { day: direction as Prisma.SortOrder };
    }
  }

  const [data, count, filterClasses, filterTeachers, filterSubjects] = await Promise.all([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.lesson.count({ where: query }),
    getClassOptions(),
    getTeacherOptions(),
    getSubjectOptions(),
  ]);

  const filterOptions = [
    {
      label: "Class / Section",
      field: "classId",
      options: filterClasses.map((c: { id: number; name: string }) => ({
        label: `Class ${c.name}`,
        value: String(c.id),
      })),
    },
    {
      label: "Subject",
      field: "subjectId",
      options: filterSubjects.map((s: { id: number; name: string }) => ({
        label: s.name,
        value: String(s.id),
      })),
    },
    {
      label: "Teacher",
      field: "teacherId",
      options: filterTeachers.map((t: { id: string; name: string; surname: string }) => ({
        label: `${t.name} ${t.surname}`,
        value: t.id,
      })),
    },
  ];

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Lessons</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Lesson Name (A-Z)", field: "name:asc" },
                { label: "Lesson Name (Z-A)", field: "name:desc" },
                { label: "Day of Week", field: "day:asc" },
              ]}
              filterOptions={filterOptions}
            />
            {role === "admin" && <FormContainer table="lesson" type="create" />}
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

export default LessonListPage;
