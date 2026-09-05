import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth, getCurrentUser } from "@/lib/auth";
import FormContainer from "@/components/FormContainer";
import Image from "next/image";

const MessagesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const { page, search } = resolvedSearchParams;
  const p = page ? parseInt(page) : 1;

  const role = user?.role;
  const currentUserId = user?.id;

  // Retrieve school announcements & communications targeted to user role
  const where: any = {};
  if (search) {
    where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
  }

  let audienceFilter = {};
  if (role === "teacher" && currentUserId) {
    audienceFilter = {
      OR: [
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
      ],
    };
  } else if (role === "student" && currentUserId) {
    audienceFilter = {
      OR: [
        { classId: null },
        {
          class: {
            students: { some: { id: currentUserId } },
          },
        },
      ],
    };
  } else if (role === "parent" && currentUserId) {
    audienceFilter = {
      OR: [
        { classId: null },
        {
          class: {
            students: { some: { parentId: currentUserId } },
          },
        },
      ],
    };
  }

  const finalWhere = { ...where, ...audienceFilter };

  const [announcements, count] = await Promise.all([
    prisma.announcement.findMany({
      where: finalWhere,
      include: {
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: "desc" },
    }),
    prisma.announcement.count({ where: finalWhere }),
  ]);

  return (
    <div className="m-1 mt-0 flex flex-1 flex-col gap-4 rounded-xl bg-white p-3 shadow-sm sm:m-4 sm:gap-6 sm:rounded-2xl sm:p-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800 sm:text-xl">Messages & Class Bulletins</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Active communications and bulletins for {user?.name || user?.username} ({user?.role})
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <TableSearch />
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="announcement" type="create" />
          )}
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex flex-col gap-4">
        {announcements.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">No messages or bulletins found.</p>
          </div>
        ) : (
          announcements.map((item: any) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50/50 to-white p-4 transition-colors hover:border-lamaPurple"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-lamaPurple"></span>
                  <h3 className="text-sm font-semibold text-gray-800 md:text-base">{item.title}</h3>
                  {item.class && (
                    <span className="text-lamaSkyDark rounded-full bg-lamaSkyLight px-2 py-0.5 text-[10px] font-medium">
                      Class {item.class.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(item.date))}
                </span>
              </div>
              <p className="border-l-2 border-lamaSkyLight pl-4 text-xs leading-relaxed text-gray-600 md:text-sm">
                {item.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default MessagesPage;
