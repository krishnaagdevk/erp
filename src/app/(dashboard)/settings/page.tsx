import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings & Preferences</h1>
        <p className="mt-1 text-xs text-gray-500">
          Manage your portal account and security configurations
        </p>
      </div>

      {/* SETTINGS CARDS */}
      <div className="flex flex-col gap-4">
        {/* PROFILE SECTION */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Account Preferences</h2>
          <div className="mt-2 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <span className="mb-1 block text-xs text-gray-500">Logged In Account</span>
              <span className="font-semibold text-gray-800">@{user.username}</span>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <span className="mb-1 block text-xs text-gray-500">Active Role</span>
              <span className="text-lamaPurpleDark font-semibold capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        {/* SECURITY */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Security & Authentication</h2>
          <p className="text-xs text-gray-500">
            Authentication is powered by native JWT tokens stored in HTTP-only secure cookies with
            bcrypt-hashed passwords.
          </p>
          <div className="mt-1 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
              <span className="text-xs font-semibold text-green-800">
                Session Active & Protected
              </span>
            </div>
            <Link href="/logout" className="text-xs font-medium text-rose-600 hover:underline">
              Terminate Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
