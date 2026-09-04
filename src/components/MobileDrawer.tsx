"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type MenuItem = {
  icon: string;
  label: string;
  href: string;
  visible: string[];
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuItems: MenuSection[] = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student", "parent", "accountant"],
      },
      {
        icon: "/finance.png",
        label: "Accounts & Fees",
        href: "/list/fees",
        visible: ["admin", "accountant"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher", "accountant"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "accountant"],
      },
      {
        icon: "/finance.png",
        label: "Accountants",
        href: "/list/accountants",
        visible: ["admin"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent", "accountant"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent", "accountant"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "student", "parent", "accountant"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent", "accountant"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent", "accountant"],
      },
    ],
  },
];

export const MobileDrawer = ({ role }: { role: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[99999] flex h-screen w-screen transition-opacity duration-300 ease-in-out ${
        isOpen
          ? "pointer-events-auto bg-black/60 opacity-100 backdrop-blur-sm"
          : "pointer-events-none bg-black/0 opacity-0 backdrop-blur-none"
      }`}
      onClick={() => setIsOpen(false)}
      aria-hidden={!isOpen}
    >
      <div
        className={`flex h-full w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-white p-5 shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Image src="/logo.png" alt="logo" width={32} height={32} />
            <span className="text-lg font-bold text-gray-800">SchooLama</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 pb-8">
          {menuItems.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <span className="my-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </span>
              {section.items.map((item) => {
                if (item.visible.includes(role)) {
                  return (
                    <Link
                      href={item.href}
                      key={item.label}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lamaSkyLight hover:text-blue-600"
                    >
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white p-1 text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none lg:hidden"
        aria-label="Open navigation menu"
      >
        <svg
          className="h-6 w-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mounted && typeof document !== "undefined"
        ? createPortal(drawerContent, document.body)
        : null}
    </>
  );
};
