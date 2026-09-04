"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

type RoleOption = "admin" | "accountant" | "teacher" | "student" | "parent";

const demoCredentials: Record<RoleOption, { username: string; pass: string; title: string }> = {
  admin: { username: "admin1", pass: "admin123", title: "Admin Portal" },
  accountant: { username: "accountant1", pass: "accountant123", title: "Accountant Portal" },
  teacher: { username: "teacher1", pass: "teacher123", title: "Teacher Portal" },
  student: { username: "student1", pass: "student123", title: "Student Portal" },
  parent: { username: "parentId1", pass: "parent123", title: "Parent Portal" },
};

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleOption>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleQuickFill = (role: RoleOption) => {
    setSelectedRole(role);
    setUsername(demoCredentials[role].username);
    setPassword(demoCredentials[role].pass);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Welcome back, ${data.user.name || data.user.username}!`);
        const targetUrl = redirectUrl || data.redirectUrl || `/${data.user.role}`;
        router.push(targetUrl);
        router.refresh();
      } else {
        const errorText = data.error || "Invalid username or password. Please try again.";
        setErrorMessage(errorText);
        toast.error(errorText);
      }
    } catch (err) {
      console.error("Login Error:", err);
      const errText = "Unable to connect to server. Please try again.";
      setErrorMessage(errText);
      toast.error(errText);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-lamaSky/20 bg-lamaSkyLight shadow-sm">
          <Image src="/logo.png" alt="SchooLama Logo" width={32} height={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">SchooLama Portal</h1>
        <p className="mt-1 text-xs text-gray-500">School ERP & Management System Authentication</p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Select Your Portal
        </label>
        <div className="grid grid-cols-5 gap-1 rounded-xl bg-gray-100 p-1 text-center">
          {(["admin", "accountant", "teacher", "student", "parent"] as RoleOption[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleQuickFill(role)}
              className={`truncate rounded-lg px-1 py-1.5 text-[11px] font-semibold capitalize transition-all ${
                selectedRole === role
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {role === "accountant" ? "Accounts" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Demo Fill Pills */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-blue-800">
            Demo Credentials ({selectedRole.toUpperCase()}):
          </span>
          <button
            type="button"
            onClick={() => handleQuickFill(selectedRole)}
            className="text-[11px] font-medium text-blue-600 hover:underline"
          >
            Auto-fill
          </button>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-blue-200/50 bg-white/80 px-2.5 py-1.5 font-mono text-xs text-blue-900">
          <span>
            User: <strong>{demoCredentials[selectedRole].username}</strong>
          </span>
          <span>
            Pass: <strong>{demoCredentials[selectedRole].pass}</strong>
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="animate-shake mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Username</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`e.g. ${demoCredentials[selectedRole].username}`}
              required
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky/50"
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-lamaPurple py-3 text-sm font-semibold text-gray-900 shadow-md transition-all hover:bg-lamaPurple/90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-gray-800" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to {selectedRole.toUpperCase()}</span>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 border-t border-gray-100 pt-4 text-center">
        <p className="text-xs text-gray-400">
          Powered by SchooLama ERP &bull; Role-Based Access Control
        </p>
      </div>
    </div>
  );
}
