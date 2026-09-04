"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type UserAvatarProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    surname?: string;
    role: string;
    email?: string | null;
    img?: string | null;
  } | null;
};

export const UserAvatar = ({ user }: UserAvatarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fullName = user
    ? user.name && user.surname
      ? `${user.name} ${user.surname}`
      : user.username
    : "User";

  const role = user?.role || "guest";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Logged out successfully");
        router.push("/sign-in");
        router.refresh();
      } else {
        toast.error("Failed to log out");
      }
    } catch {
      toast.error("Logout error");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-lamaSky"
        aria-label="User profile menu"
      >
        <Image
          src={user?.img || "/avatar.png"}
          alt="Avatar"
          width={36}
          height={36}
          className="rounded-full border border-gray-200 object-cover"
        />
      </button>

      {isOpen && (
        <div className="animate-in fade-in zoom-in absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-xl duration-150">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-800">{fullName}</p>
            <p className="truncate text-xs text-gray-500">@{user?.username}</p>
            <div className="mt-1.5 inline-block rounded-md bg-lamaSkyLight px-2 py-0.5 text-[10px] font-bold uppercase text-lamaSky">
              {role}
            </div>
          </div>

          <div className="py-1">
            <Link
              href={`/${role}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Image src="/home.png" alt="" width={16} height={16} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Image src="/profile.png" alt="" width={16} height={16} />
              <span>Profile</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Image src="/setting.png" alt="" width={16} height={16} />
              <span>Settings</span>
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Image src="/logout.png" alt="" width={16} height={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
