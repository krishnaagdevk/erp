import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Announcement, Class, Prisma } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

type AnnouncementList = Announcement & { class: Class | null };
const AnnouncementListPage = async ({
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
      header: "Title",
      accessor: "title",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
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

  const renderRow = (item: AnnouncementList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-medium text-gray-800">{item.title}</td>
      <td>{item.class?.name || "All"}</td>
      <td className="hidden md:table-cell">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.date)}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: AnnouncementList) => (
    <div
      key={item.id}
      className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              item.class
                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                : "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
            }`}
          >
            {item.class ? `Class ${item.class.name}` : "School-wide"}
          </span>
        </div>
        {item.description && (
          <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <span>📅</span>
          <span>
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(item.date)}
          </span>
        </span>
        {(role === "admin" || role === "teacher") && (
          <div className="flex items-center gap-2">
            <FormContainer table="announcement" type="update" data={item} />
            <FormContainer table="announcement" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );
  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.AnnouncementWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "search":
            query.OR = [{ title: { contains: value } }, { description: { contains: value } }];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  if (role === "teacher" && currentUserId) {
    query.OR = [
      { classId: null },
      { teacherId: currentUserId },
      {
        class: {
          OR: [
            { supervisorId: currentUserId },
            { lessons: { some: { teacherId: currentUserId } } },
          ],
        },
      },
    ];
  } else if (role === "student" && currentUserId) {
    query.OR = [
      { classId: null },
      {
        class: {
          students: { some: { id: currentUserId } },
        },
      },
    ];
  } else if (role === "parent" && currentUserId) {
    query.OR = [
      { classId: null },
      {
        class: {
          students: { some: { parentId: currentUserId } },
        },
      },
    ];
  }

  let orderBy: Prisma.AnnouncementOrderByWithRelationInput = { date: "desc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "title") {
      orderBy = { title: direction as Prisma.SortOrder };
    } else if (field === "date") {
      orderBy = { date: direction as Prisma.SortOrder };
    }
  }

  const [data, count, filterClasses] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: {
        class: true,
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.announcement.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true } }),
  ]);

  const filterOptions = [
    {
      label: "Target Class / Audience",
      field: "classId",
      options: [
        { label: "All Classes (School-wide)", value: "" },
        ...filterClasses.map((c: { id: number; name: string }) => ({
          label: `Class ${c.name}`,
          value: String(c.id),
        })),
      ],
    },
  ];

  return (
    <div className="m-4 mt-0 flex-1 rounded-md bg-white p-4">
      {/* TOP */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Announcements</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Announcement Date (Newest First)", field: "date:desc" },
                { label: "Announcement Date (Oldest First)", field: "date:asc" },
                { label: "Title (A-Z)", field: "title:asc" },
                { label: "Title (Z-A)", field: "title:desc" },
              ]}
              filterOptions={filterOptions}
            />
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="announcement" type="create" />
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

export default AnnouncementListPage;
