import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth, getCurrentUser } from "@/lib/auth";
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

  // Retrieve school announcements & communications
  const where: any = {};
  if (search) {
    where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
  }

  const [announcements, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where,
      include: {
        class: { select: { name: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: "desc" },
    }),
    prisma.announcement.count({ where }),
  ]);

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6 rounded-md bg-white p-4 shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Messages & Bulletins</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Active communications and bulletins for {user?.name || user?.username} ({user?.role})
          </p>
        </div>
        <div className="flex w-full items-center gap-4 md:w-auto">
          <TableSearch />
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
