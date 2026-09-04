import Image from "next/image";
import Link from "next/link";
import { MobileDrawer } from "./MobileDrawer";
import { getCurrentUser } from "@/lib/auth";
import { UserAvatar } from "./UserAvatar";
import prisma from "@/lib/prisma";

const Navbar = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const role = user.role;
  const fullName = user.name && user.surname ? `${user.name} ${user.surname}` : user.username;

  // Fetch role-targeted unread / recent announcements count
  let audienceWhere: any = { classId: null };
  if (role === "admin") {
    audienceWhere = {};
  } else if (role === "teacher" && user.id) {
    audienceWhere = {
      OR: [
        { classId: null },
        { teacherId: user.id },
        {
          class: {
            OR: [
              { supervisorId: user.id },
              { lessons: { some: { teacherId: user.id } } },
            ],
          },
        },
      ],
    };
  } else if (role === "student" && user.id) {
    audienceWhere = {
      OR: [
        { classId: null },
        { class: { students: { some: { id: user.id } } } },
      ],
    };
  } else if (role === "parent" && user.id) {
    audienceWhere = {
      OR: [
        { classId: null },
        { class: { students: { some: { parentId: user.id } } } },
      ],
    };
  }

  const announcementCount = await prisma.announcement.count({
    where: audienceWhere,
  });

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/70 p-3 backdrop-blur-sm sm:p-4">
      {/* LEFT: HAMBURGER ON MOBILE & SEARCH BAR */}
      <div className="flex items-center gap-3">
        <MobileDrawer role={role} />
        <div className="hidden items-center gap-2 rounded-full px-2 py-0.5 text-xs ring-[1.5px] ring-gray-300 md:flex">
          <Image src="/search.png" alt="" width={14} height={14} />
          <input
            type="text"
            placeholder="Search..."
            className="w-[180px] bg-transparent p-1.5 text-xs outline-none lg:w-[200px]"
          />
        </div>
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center justify-end gap-3 sm:gap-6">
        {/* MESSAGES & CHAT ICON */}
        <Link
          href="/list/messages"
          title="Messages & Communications"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-gray-100"
        >
          <Image src="/message.png" alt="Messages" width={20} height={20} />
        </Link>

        {/* ANNOUNCEMENTS & BULLETINS ICON */}
        <Link
          href="/list/announcements"
          title="Announcements"
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-gray-100"
        >
          <Image src="/announcement.png" alt="Announcements" width={20} height={20} />
          {announcementCount > 0 && (
            <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white shadow">
              {announcementCount > 9 ? "9+" : announcementCount}
            </div>
          )}
        </Link>
        <div className="hidden flex-col sm:flex">
          <span className="max-w-[120px] truncate text-xs font-medium leading-3">{fullName}</span>
          <span className="text-right text-[10px] capitalize text-gray-500">{role}</span>
        </div>
        <UserAvatar user={user} />
      </div>
    </div>
  );
};

export default Navbar;
