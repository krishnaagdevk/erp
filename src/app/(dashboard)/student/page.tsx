export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const StudentPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:flex-row">
        <div className="w-full rounded-md bg-white p-4 text-gray-500">
          Please sign in to view student schedule.
        </div>
      </div>
    );
  }

  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: userId } },
    },
  });

  const studentClass = classItem[0];

  return (
    <div className="flex flex-col gap-4 p-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full rounded-md bg-white p-4">
          <h1 className="text-xl font-semibold">
            Schedule {studentClass ? `(${studentClass.name})` : ""}
          </h1>
          {studentClass ? (
            <BigCalendarContainer type="classId" id={studentClass.id} />
          ) : (
            <div className="p-4 text-gray-500">No class assigned yet.</div>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="flex w-full flex-col gap-8 xl:w-1/3">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
