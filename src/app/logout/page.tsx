"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        router.push("/sign-in");
        router.refresh();
      }
    };

    doLogout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4 text-gray-700">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="border-3 h-8 w-8 animate-spin rounded-full border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-medium">Signing out of SchooLama...</p>
      </div>
    </div>
  );
}
