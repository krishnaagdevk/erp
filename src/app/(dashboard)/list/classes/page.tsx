import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Teacher } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

type ClassList = Class & { supervisor: Teacher };

const ClassListPage = async ({
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
      header: "Class Name",
      accessor: "name",
    },
    {
      header: "Capacity",
      accessor: "capacity",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Supervisor",
      accessor: "supervisor",
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

  const renderRow = (item: ClassList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-bold text-gray-800">{item.name}</td>
      <td className="hidden md:table-cell">{item.capacity}</td>
      <td className="hidden md:table-cell">{item.name[0]}</td>
      <td className="hidden md:table-cell">
        {item.supervisor ? item.supervisor.name + " " + item.supervisor.surname : "Unassigned"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="class" type="update" data={item} />
              <FormContainer table="class" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: ClassList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-800">Class {item.name}</h3>
            <span className="text-xs font-medium text-gray-400">Grade {item.name[0]}</span>
          </div>
          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
            👥 {item.capacity} Seats
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <span>👨‍🏫 Supervisor:</span>
          <span className="font-medium text-gray-700">
            {item.supervisor ? `${item.supervisor.name} ${item.supervisor.surname}` : "Unassigned"}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-end border-t border-gray-100 pt-2.5">
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <FormContainer table="class" type="update" data={item} />
            <FormContainer table="class" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ClassWhereInput = {};

  if (role === "teacher" && currentUserId) {
    query.OR = [
      { supervisorId: currentUserId },
      { lessons: { some: { teacherId: currentUserId } } },
    ];
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            query.supervisorId = value;
            break;
          case "gradeId":
            query.gradeId = parseInt(value);
            break;
          case "search":
            query.name = { contains: value };
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Prisma.ClassOrderByWithRelationInput = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "name") {
      orderBy = { name: direction as Prisma.SortOrder };
    } else if (field === "capacity") {
      orderBy = { capacity: direction as Prisma.SortOrder };
    }
  }

  const [data, count, filterTeachers, filterGrades] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: {
        supervisor: true,
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.class.count({ where: query }),
    prisma.teacher.findMany({ select: { id: true, name: true, surname: true } }),
    prisma.grade.findMany({ select: { id: true, level: true } }),
  ]);

  const filterOptions = [
    {
      label: "Grade Level",
      field: "gradeId",
      options: filterGrades.map((g) => ({ label: `Grade ${g.level}`, value: String(g.id) })),
    },
    {
      label: "Supervisor Teacher",
      field: "supervisorId",
      options: filterTeachers.map((t) => ({ label: `${t.name} ${t.surname}`, value: t.id })),
    },
  ];

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Classes</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Class Name (A-Z)", field: "name:asc" },
                { label: "Class Name (Z-A)", field: "name:desc" },
                { label: "Highest Capacity", field: "capacity:desc" },
                { label: "Lowest Capacity", field: "capacity:asc" },
              ]}
              filterOptions={filterOptions}
            />
            {role === "admin" && <FormContainer table="class" type="create" />}
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

export default ClassListPage;
