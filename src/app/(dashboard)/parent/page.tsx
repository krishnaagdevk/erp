export const dynamic = "force-dynamic";

import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Student } from "@prisma/client";

const ParentPage = async () => {
  const { userId } = await auth();
  const currentUserId = userId;

  if (!currentUserId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
        <div className="w-full rounded-md bg-white p-4 text-gray-500">
          Please sign in to view parent schedule.
        </div>
      </div>
    );
  }

  const students = await prisma.student.findMany({
    where: {
      parentId: currentUserId,
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 xl:flex-row">
      {/* LEFT */}
      <div className="flex w-full flex-col gap-4 xl:w-2/3">
        {students.length > 0 ? (
          students.map((student: Student) => (
            <div className="w-full" key={student.id}>
              <div className="h-full rounded-md bg-white p-4">
                <h1 className="text-xl font-semibold">
                  Schedule ({student.name + " " + student.surname})
                </h1>
                <BigCalendarContainer type="classId" id={student.classId} />
              </div>
            </div>
          ))
        ) : (
          <div className="h-full rounded-md bg-white p-4 text-gray-500">
            No children registered yet.
          </div>
        )}
      </div>
      {/* RIGHT */}
      <div className="flex w-full flex-col gap-8 xl:w-1/3">
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
