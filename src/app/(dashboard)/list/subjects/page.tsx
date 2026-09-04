import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Subject, Teacher } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

type SubjectList = Subject & { teachers: Teacher[] };

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Teachers",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: SubjectList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-bold text-gray-800">{item.name}</td>
      <td className="hidden md:table-cell">
        {item.teachers.map((teacher: Teacher) => `${teacher.name} ${teacher.surname}`).join(", ") || "None"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="subject" type="update" data={item} />
              <FormContainer table="subject" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: SubjectList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-800">{item.name}</h3>
          <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200">
            {item.teachers.length} Faculty
          </span>
        </div>
        <div className="mt-2.5 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Teachers: </span>
          <span>
            {item.teachers.map((t: Teacher) => `${t.name} ${t.surname}`).join(", ") || "No teachers assigned"}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-end border-t border-gray-100 pt-2.5">
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <FormContainer table="subject" type="update" data={item} />
            <FormContainer table="subject" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.SubjectWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value };
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Prisma.SubjectOrderByWithRelationInput = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "name") {
      orderBy = { name: direction as Prisma.SortOrder };
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: {
        teachers: true,
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subject.count({ where: query }),
  ]);

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Subjects</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Subject Name (A-Z)", field: "name:asc" },
                { label: "Subject Name (Z-A)", field: "name:desc" },
              ]}
            />
            {role === "admin" && <FormContainer table="subject" type="create" />}
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

export default SubjectListPage;
