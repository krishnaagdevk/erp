import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

const Announcements = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  let audienceWhere: any = { classId: null };
  if (role === "admin") {
    audienceWhere = {};
  } else if (role === "teacher" && userId) {
    audienceWhere = {
      OR: [
        { classId: null },
        { teacherId: userId },
        {
          class: {
            OR: [
              { supervisorId: userId },
              { lessons: { some: { teacherId: userId } } },
            ],
          },
        },
      ],
    };
  } else if (role === "student" && userId) {
    audienceWhere = {
      OR: [
        { classId: null },
        { class: { students: { some: { id: userId } } } },
      ],
    };
  } else if (role === "parent" && userId) {
    audienceWhere = {
      OR: [
        { classId: null },
        { class: { students: { some: { parentId: userId } } } },
      ],
    };
  }

  const data = await prisma.announcement.findMany({
    take: 3,
    orderBy: { date: "desc" },
    where: audienceWhere,
  });

  return (
    <div className="rounded-md bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <Link href="/list/announcements" className="text-xs text-gray-400 hover:underline">
          View All
        </Link>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {data[0] && (
          <div className="rounded-md bg-lamaSkyLight p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[0].title}</h2>
              <span className="rounded-md bg-white px-1 py-1 text-xs text-gray-400">
                {new Intl.DateTimeFormat("en-GB").format(data[0].date)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">{data[0].description}</p>
          </div>
        )}
        {data[1] && (
          <div className="rounded-md bg-lamaPurpleLight p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[1].title}</h2>
              <span className="rounded-md bg-white px-1 py-1 text-xs text-gray-400">
                {new Intl.DateTimeFormat("en-GB").format(data[1].date)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">{data[1].description}</p>
          </div>
        )}
        {data[2] && (
          <div className="rounded-md bg-lamaYellowLight p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[2].title}</h2>
              <span className="rounded-md bg-white px-1 py-1 text-xs text-gray-400">
                {new Intl.DateTimeFormat("en-GB").format(data[2].date)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">{data[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
