import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma, Student } from "@/generated/client";
import TableActions from "@/components/TableActions";

import { auth } from "@/lib/auth";

type ParentList = Parent & { students: Student[] };

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student Names",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
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

  const renderRow = (item: ParentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-semibold text-gray-800">
        <div className="flex flex-col">
          <h3>{item.name} {item.surname}</h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.students.map((student: Student) => `${student.name} ${student.surname}`).join(", ") || "None"}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="parent" type="update" data={item} />
              <FormContainer table="parent" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: ParentList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{item.name} {item.surname}</h3>
            <p className="text-xs text-gray-500">{item.email || `@${item.username}`}</p>
          </div>
          <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200">
            {item.students.length} {item.students.length === 1 ? "Ward" : "Wards"}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
          <span className="text-gray-500 font-medium">Students:</span>
          {item.students.map((s: Student) => (
            <span
              key={s.id}
              className="rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-700 ring-1 ring-sky-200"
            >
              {s.name} {s.surname}
            </span>
          ))}
          {item.students.length === 0 && (
            <span className="text-gray-400">No linked students</span>
          )}
        </div>

        {item.phone && (
          <div className="mt-2 text-xs text-gray-500">
            <span>📞 {item.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
        <span className="text-xs text-gray-400 font-mono">@{item.username}</span>
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <FormContainer table="parent" type="update" data={item} />
            <FormContainer table="parent" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ParentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { name: { contains: value } },
              { surname: { contains: value } },
              { username: { contains: value } },
              { phone: { contains: value } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Prisma.ParentOrderByWithRelationInput = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "name") {
      orderBy = { name: direction as Prisma.SortOrder };
    } else if (field === "createdAt") {
      orderBy = { createdAt: direction as Prisma.SortOrder };
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: true,
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.parent.count({ where: query }),
  ]);

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Parents</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Parent Name (A-Z)", field: "name:asc" },
                { label: "Parent Name (Z-A)", field: "name:desc" },
                { label: "Newest First", field: "createdAt:desc" },
                { label: "Oldest First", field: "createdAt:asc" },
              ]}
            />
            {role === "admin" && <FormContainer table="parent" type="create" />}
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

export default ParentListPage;
