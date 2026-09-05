import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Caste, Prisma } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

type CasteList = Caste & { _count?: { students: number } };

const CasteListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Caste Name",
      accessor: "name",
    },
    {
      header: "Category",
      accessor: "category",
      className: "hidden md:table-cell",
    },
    {
      header: "Description",
      accessor: "description",
      className: "hidden lg:table-cell",
    },
    {
      header: "Enrolled Students",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: CasteList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-bold text-gray-800">{item.name}</td>
      <td className="hidden md:table-cell">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
          {item.category || "General"}
        </span>
      </td>
      <td className="hidden text-xs text-gray-500 lg:table-cell">{item.description || "—"}</td>
      <td className="hidden text-xs font-medium text-gray-700 md:table-cell">
        {item._count?.students || 0} student(s)
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="caste" type="update" data={item} />
              <FormContainer table="caste" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: CasteList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-800">{item.name}</h3>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
            {item.category || "General"}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>{item.description || "No description provided."}</p>
          <p className="mt-1 font-medium text-gray-700">
            {item._count?.students || 0} enrolled student(s)
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-end border-t border-gray-100 pt-2.5">
        {role === "admin" && (
          <div className="flex items-center gap-2">
            <FormContainer table="caste" type="update" data={item} />
            <FormContainer table="caste" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.CasteWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [{ name: { contains: value } }, { category: { contains: value } }];
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Prisma.CasteOrderByWithRelationInput = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "name") {
      orderBy = { name: direction as Prisma.SortOrder };
    }
  }

  const [data, count] = await Promise.all([
    prisma.caste.findMany({
      where: query,
      include: {
        _count: { select: { students: true } },
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.caste.count({ where: query }),
  ]);

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">Caste & Category Master</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Caste Name (A-Z)", field: "name:asc" },
                { label: "Caste Name (Z-A)", field: "name:desc" },
              ]}
            />
            {role === "admin" && <FormContainer table="caste" type="create" />}
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

export default CasteListPage;
