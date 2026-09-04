import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lamaSkyLight/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-lamaSky/20 bg-lamaSkyLight">
          <Image src="/logo.png" alt="SchooLama Logo" width={32} height={32} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">School Account Access</h1>
        <p className="mb-6 text-sm text-gray-600">
          Student, Teacher, and Parent accounts are created and managed by the School Administrator.
          Please sign in with your school-issued credentials.
        </p>
        <Link
          href="/sign-in"
          className="inline-block w-full rounded-xl bg-lamaPurple px-4 py-3 text-sm font-semibold text-white shadow-md shadow-lamaPurple/20 transition hover:opacity-90"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}
