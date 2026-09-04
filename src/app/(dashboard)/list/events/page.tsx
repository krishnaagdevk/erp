import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Event, Prisma } from "@/generated/client";
import TableActions from "@/components/TableActions";
import { auth } from "@/lib/auth";

type EventList = Event & { class: Class };

const EventListPage = async ({
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
    {
      header: "Start Time",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time",
      accessor: "endTime",
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

  const renderRow = (item: EventList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-medium text-gray-800">{item.title}</td>
      <td>{item.class?.name || "All"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(item.startTime)}
      </td>
      <td className="hidden md:table-cell">
        {item.startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {item.endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const renderCard = (item: EventList) => (
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
            {item.class ? `Class ${item.class.name}` : "All School"}
          </span>
        </div>
        {item.description && (
          <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-3.5 flex flex-col gap-2.5 border-t border-gray-100 pt-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <span className="flex items-center gap-1 font-medium text-gray-500">
            <span>📅</span>
            <span>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(item.startTime)}
            </span>
          </span>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-amber-200">
            ⏰ {item.startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - {item.endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </span>
        </div>
        {role === "admin" && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-2">
            <FormContainer table="event" type="update" data={item} />
            <FormContainer table="event" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );

  const { page, sort, ...queryParams } = resolvedSearchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.EventWhereInput = {};

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

  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };

  query.OR = [
    { classId: null },
    {
      class: roleConditions[role as keyof typeof roleConditions] || {},
    },
  ];

  let orderBy: Prisma.EventOrderByWithRelationInput = { startTime: "asc" };
  if (sort) {
    const [field, direction] = sort.split(":");
    if (field === "title") {
      orderBy = { title: direction as Prisma.SortOrder };
    } else if (field === "startTime") {
      orderBy = { startTime: direction as Prisma.SortOrder };
    }
  }

  const [data, count, filterClasses] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: {
        class: true,
      },
      orderBy,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.event.count({ where: query }),
    prisma.class.findMany({ select: { id: true, name: true } }),
  ]);

  const filterOptions = [
    {
      label: "Class / Audience",
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
        <h1 className="text-base font-bold text-gray-800 md:text-lg">All Events</h1>
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <TableActions
              sortFields={[
                { label: "Event Date (Upcoming First)", field: "startTime:asc" },
                { label: "Event Date (Latest First)", field: "startTime:desc" },
                { label: "Event Title (A-Z)", field: "title:asc" },
                { label: "Event Title (Z-A)", field: "title:desc" },
              ]}
              filterOptions={filterOptions}
            />
            {role === "admin" && <FormContainer table="event" type="create" />}
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

export default EventListPage;
