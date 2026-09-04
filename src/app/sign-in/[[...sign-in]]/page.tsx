import SignInForm from "@/components/SignInForm";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lamaSkyLight/40 p-4 sm:p-6">
      <Suspense fallback={<div className="text-gray-500">Loading sign in...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
