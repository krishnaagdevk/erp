import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Accountant, Prisma } from "@prisma/client";
import Image from "next/image";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

type AccountantList = Accountant;

const AccountantListPage = async ({
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
      header: "Username",
      accessor: "username",
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

  const renderRow = (item: AccountantList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaSkyLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/avatar.png"}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover md:hidden xl:block"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item?.email || "No email"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          @{item.username}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden md:table-cell">{item.address || "N/A"}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="accountant" type="update" data={item} />
              <FormContainer table="accountant" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.AccountantWhereInput = {};

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
              { email: { contains: value } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  let orderBy: Record<string, "asc" | "desc"> = { name: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    const dir = direction === "desc" ? "desc" : "asc";
    if (field === "name") {
      orderBy = { name: dir };
    } else if (field === "createdAt") {
      orderBy = { createdAt: dir };
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.accountant.findMany({
      where: query,
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.accountant.count({ where: query }),
  ]);

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden text-lg font-semibold md:block">All Accountants</h1>
        <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-row">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <TableActions
              sortFields={[
                { label: "Accountant Name (A-Z)", field: "name:asc" },
                { label: "Accountant Name (Z-A)", field: "name:desc" },
                { label: "Newest First", field: "createdAt:desc" },
                { label: "Oldest First", field: "createdAt:asc" },
              ]}
            />
            {role === "admin" && <FormContainer table="accountant" type="create" />}
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

export default AccountantListPage;
