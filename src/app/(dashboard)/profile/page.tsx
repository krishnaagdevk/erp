import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const ProfilePage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      {/* HEADER CARD */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-lamaSkyLight">
          <Image
            src={user.img || "/noAvatar.png"}
            alt="Profile Avatar"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">
              {user.name || "User"} {user.surname || ""}
            </h1>
            <span className="text-lamaPurpleDark rounded-full bg-lamaPurple px-2.5 py-1 text-xs font-semibold capitalize">
              {user.role}
            </span>
          </div>
          <p className="font-mono text-sm text-gray-500">@{user.username}</p>
          <p className="mt-2 text-xs text-gray-400">ID: {user.id}</p>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ACCOUNT INFO */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="border-b border-gray-100 pb-2 text-base font-semibold text-gray-800">
            Account Information
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 py-1">
              <span className="text-gray-500">Username</span>
              <span className="font-medium text-gray-800">{user.username}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 py-1">
              <span className="text-gray-500">System Role</span>
              <span className="text-lamaPurpleDark font-semibold capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 py-1">
              <span className="text-gray-500">Email Address</span>
              <span className="font-medium text-gray-800">{user.email || "Not specified"}</span>
            </div>
          </div>
        </div>

        {/* SECURITY & SHORTCUTS */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <h2 className="mb-4 border-b border-gray-100 pb-2 text-base font-semibold text-gray-800">
              Security & Controls
            </h2>
            <p className="text-xs leading-relaxed text-gray-500">
              Your session is secured using WebCrypto HMAC-SHA256 JWT tokens with role-based access
              control.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/settings"
              className="text-lamaSkyDark flex-1 rounded-xl bg-lamaSky px-4 py-2.5 text-center text-xs font-semibold transition-opacity hover:opacity-90"
            >
              Account Settings
            </Link>
            <Link
              href="/logout"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
