import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

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
      <td className="flex items-center gap-4 p-4">{item.subject.name}</td>
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

  const [data, count, filterClasses, filterTeachers, filterSubjects] = await prisma.$transaction([
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
    prisma.class.findMany({ select: { id: true, name: true } }),
    prisma.teacher.findMany({ select: { id: true, name: true, surname: true } }),
    prisma.subject.findMany({ select: { id: true, name: true } }),
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
      <div className="flex items-center justify-between">
        <h1 className="hidden text-lg font-semibold md:block">All Lessons</h1>
        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
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
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
