import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT SIDEBAR (Desktop only - mobile uses MobileDrawer) */}
      <div className="hidden flex-col overflow-y-auto border-r border-gray-100 bg-white p-4 lg:flex lg:w-[18%] xl:w-[15%]">
        <Link href="/" className="mb-2 flex items-center justify-start gap-2">
          <Image src="/logo.png" alt="logo" width={32} height={32} />
          <span className="text-lg font-bold text-gray-800">SchooLama</span>
        </Link>
        <Menu />
      </div>
      {/* RIGHT MAIN CONTENT */}
      <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-[#F7F8FA] lg:w-[82%] xl:w-[85%]">
        <Navbar />
        <main className="flex-1 p-2 sm:p-4">{children}</main>
      </div>
    </div>
  );
}
