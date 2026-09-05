import { getCurrentAcademicYear } from "@/lib/utils";
import UserCardDropdown from "./UserCardDropdown";
import { getUserCardsCounts } from "@/lib/queries";

const UserCards = async () => {
  const academicYear = getCurrentAcademicYear();
  const { adminCount, teacherCount, studentCount, parentCount, accountantCount } =
    await getUserCardsCounts();

  const cards = [
    { type: "admin" as const, count: adminCount, color: "bg-lamaPurple" },
    { type: "teacher" as const, count: teacherCount, color: "bg-lamaYellow" },
    { type: "student" as const, count: studentCount, color: "bg-lamaPurple" },
    { type: "parent" as const, count: parentCount, color: "bg-lamaYellow" },
    { type: "accountant" as const, count: accountantCount, color: "bg-lamaSky" },
  ];

  return (
    <div className="grid w-full grid-cols-2 flex-wrap justify-between gap-3 sm:grid-cols-2 sm:gap-4 lg:flex">
      {cards.map((c) => (
        <div key={c.type} className={`rounded-2xl ${c.color} min-w-[130px] flex-1 p-4`}>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-green-600">
              {academicYear}
            </span>
            <UserCardDropdown type={c.type} count={c.count} />
          </div>
          <h1 className="my-4 text-2xl font-semibold">{c.count}</h1>
          <h2 className="text-sm font-medium capitalize text-gray-500">{c.type}s</h2>
        </div>
      ))}
    </div>
  );
};

export default UserCards;
