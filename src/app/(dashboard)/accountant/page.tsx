import prisma from "@/lib/prisma";
import { auth, getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import FormContainer from "@/components/FormContainer";
import RecordPaymentButton from "@/components/RecordPaymentButton";
import FeeReceiptModal from "@/components/FeeReceiptModal";
import Announcements from "@/components/Announcements";
import { serializePlain } from "@/lib/utils";

const AccountantPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const search = resolvedSearchParams?.search?.trim() || "";

  // 1. Fetch Key Metrics
  const [totalFees, totalPayments, studentsCount, overdueCount] = await Promise.all([
    prisma.fee.aggregate({
      _sum: { amount: true, paidAmount: true },
      _count: { id: true },
    }),
    prisma.feePayment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.student.count(),
    prisma.fee.count({
      where: {
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  const totalInvoiced = Number(totalFees._sum.amount || 0);
  const totalCollected = Number(totalPayments._sum.amount || 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);

  // 2. Multi-Criteria Universal Search (Student ID, Parent ID, Phone, Name)
  let matchedStudents: any[] = [];
  if (search) {
    const matchedStudentsRaw = await prisma.student.findMany({
      where: {
        OR: [
          { id: { equals: search } },
          { username: { contains: search } },
          { name: { contains: search } },
          { surname: { contains: search } },
          { phone: { contains: search } },
          { parent: { id: { equals: search } } },
          { parent: { username: { contains: search } } },
          { parent: { phone: { contains: search } } },
          { parent: { aadhar: { contains: search } } },
          { parent: { name: { contains: search } } },
          { parent: { surname: { contains: search } } },
        ],
      },
      include: {
        class: true,
        grade: true,
        parent: true,
        fees: {
          include: {
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      take: 5,
    });
    matchedStudents = serializePlain(matchedStudentsRaw);
  }

  // 3. Recent 5 Transactions
  const recentPaymentsRaw = await prisma.feePayment.findMany({
    take: 5,
    orderBy: { paymentDate: "desc" },
    include: {
      fee: {
        include: {
          student: {
            include: {
              class: true,
              parent: true,
            },
          },
        },
      },
    },
  });

  const recentPayments = serializePlain(recentPaymentsRaw);

  return (
    <div className="flex flex-col gap-6 p-4 xl:flex-row">
      {/* LEFT COLUMN: MAIN WORKSPACE */}
      <div className="flex w-full flex-col gap-6 xl:w-2/3">
        {/* WELCOME & HERO */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Accounts & Fee Administration
            </span>
            <h1 className="mt-2 text-2xl font-bold">Welcome back, {user?.name || "Accountant"}</h1>
            <p className="mt-1 max-w-md text-xs text-blue-100 sm:text-sm">
              Lookup student or parent records by ID or Mobile Number, record fee collections, and
              issue instant receipts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FormContainer table="fee" type="create" />
            <Link
              href="/list/fees"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <span>Fee Ledger</span>
            </Link>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-gray-400">Total Invoiced</span>
            <span className="mt-1 text-xl font-bold text-gray-800">
              ₹{totalInvoiced.toLocaleString()}
            </span>
            <span className="mt-2 text-[11px] text-gray-400">
              {totalFees._count.id} invoices generated
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-emerald-600">Total Collected</span>
            <span className="mt-1 text-xl font-bold text-emerald-700">
              ₹{totalCollected.toLocaleString()}
            </span>
            <span className="mt-2 text-[11px] text-emerald-600">
              {totalPayments._count.id} receipts issued
            </span>
          </div>

          <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-amber-600">Pending Balance</span>
            <span className="mt-1 text-xl font-bold text-amber-700">
              ₹{totalOutstanding.toLocaleString()}
            </span>
            <span className="mt-2 text-[11px] text-amber-600">Unpaid fee balances</span>
          </div>

          <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium uppercase text-rose-600">Overdue Invoices</span>
            <span className="mt-1 text-xl font-bold text-rose-700">{overdueCount}</span>
            <span className="mt-2 text-[11px] text-rose-600">Past due date</span>
          </div>
        </div>

        {/* UNIVERSAL SEARCH HUB */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col items-start justify-between gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <span>🔍</span> Universal Student & Parent Search Hub
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Search across Student ID, Parent ID, Student Phone, Parent Mobile, or Student Name.
              </p>
            </div>
            {search && (
              <Link
                href="/accountant"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Clear Search
              </Link>
            )}
          </div>

          {/* SEARCH FORM */}
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Enter Student ID (e.g. student1), Parent ID (e.g. parentId1), Mobile Number, or Name..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3.5 top-3.5 text-gray-400">
                <Image src="/search.png" alt="" width={16} height={16} />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          {/* SEARCH RESULTS / 360 PROFILE CARDS */}
          {search && (
            <div className="mt-6 flex flex-col gap-6">
              {matchedStudents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
                  <p className="text-sm font-medium">
                    No student or parent found for &quot;{search}&quot;
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Try searching by student username (e.g. student1), parent phone, or student
                    phone number.
                  </p>
                </div>
              ) : (
                matchedStudents.map((student: any) => {
                  const studentTotalInvoiced = student.fees.reduce(
                    (acc: number, f: any) => acc + Number(f.amount),
                    0
                  );
                  const studentTotalPaid = student.fees.reduce(
                    (acc: number, f: any) => acc + Number(f.paidAmount),
                    0
                  );
                  const studentBalance = Math.max(0, studentTotalInvoiced - studentTotalPaid);
                  const overallStatus =
                    student.fees.length === 0
                      ? "NO_FEES"
                      : studentBalance === 0
                        ? "PAID"
                        : studentTotalPaid > 0
                          ? "PARTIAL"
                          : "PENDING";

                  return (
                    <div
                      key={student.id}
                      className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/40 to-white p-5 shadow-sm"
                    >
                      {/* HEADER INFO */}
                      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-4">
                          <Image
                            src={student.img || "/avatar.png"}
                            alt={student.name}
                            width={54}
                            height={54}
                            className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {student.name} {student.surname}
                              </h3>
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                ID: {student.username}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Class:{" "}
                              <span className="font-semibold text-gray-700">
                                {student.class?.name || "N/A"}
                              </span>{" "}
                              | Grade Level: {student.grade?.level || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* STATUS BADGE & QUICK FEE SUMMARY */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase text-gray-400">
                              Outstanding Balance
                            </span>
                            <span
                              className={`text-lg font-extrabold ${
                                studentBalance === 0 ? "text-green-600" : "text-amber-600"
                              }`}
                            >
                              ₹{studentBalance.toFixed(2)}
                            </span>
                          </div>
                          <span
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                              overallStatus === "PAID"
                                ? "border border-green-200 bg-green-100 text-green-800"
                                : overallStatus === "PARTIAL"
                                  ? "border border-amber-200 bg-amber-100 text-amber-800"
                                  : overallStatus === "NO_FEES"
                                    ? "bg-gray-100 text-gray-600"
                                    : "border border-rose-200 bg-rose-100 text-rose-800"
                            }`}
                          >
                            {overallStatus.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* 360-DEGREE DETAILS GRID */}
                      <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                        {/* STUDENT PARTICULARS */}
                        <div className="space-y-1.5 rounded-xl border border-gray-100 bg-white p-3.5">
                          <span className="block border-b border-gray-50 pb-1 font-bold text-gray-700">
                            Student Details
                          </span>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mobile Phone:</span>
                            <span className="font-medium text-gray-800">
                              {student.phone || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Email:</span>
                            <span className="font-medium text-gray-800">
                              {student.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Blood Type / Gender:</span>
                            <span className="font-medium text-gray-800">
                              {student.bloodType} ({student.sex})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Address:</span>
                            <span className="max-w-[200px] truncate font-medium text-gray-800">
                              {student.address}
                            </span>
                          </div>
                        </div>

                        {/* PARENT / GUARDIAN DETAILS */}
                        <div className="space-y-1.5 rounded-xl border border-gray-100 bg-white p-3.5">
                          <span className="block border-b border-gray-50 pb-1 font-bold text-gray-700">
                            Parent / Guardian Details
                          </span>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Parent Name:</span>
                            <span className="font-semibold text-gray-900">
                              {student.parent?.name} {student.parent?.surname}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Parent ID / Username:</span>
                            <span className="font-medium text-blue-700">
                              {student.parent?.username}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Parent Mobile:</span>
                            <span className="font-bold text-gray-800">{student.parent?.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Parent Email:</span>
                            <span className="font-medium text-gray-800">
                              {student.parent?.email || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* STUDENT FEE INVOICES & PAYMENTS */}
                      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                          <span className="text-xs font-bold text-gray-700">
                            Fee Invoices & Payment History ({student.fees.length})
                          </span>
                        </div>

                        {student.fees.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">
                            No fee invoices currently assigned to this student.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-500">
                                <tr>
                                  <th className="p-3 text-left">Fee Invoice</th>
                                  <th className="p-3 text-right">Total</th>
                                  <th className="p-3 text-right">Paid</th>
                                  <th className="p-3 text-right">Balance</th>
                                  <th className="p-3 text-center">Status</th>
                                  <th className="p-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {student.fees.map((f: any) => {
                                  const fAmount = Number(f.amount);
                                  const fPaidAmount = Number(f.paidAmount);
                                  const feeBal = Math.max(0, fAmount - fPaidAmount);
                                  const latestPayment = f.payments[0];

                                  return (
                                    <tr key={f.id} className="hover:bg-slate-50">
                                      <td className="p-3">
                                        <span className="block font-semibold text-gray-800">
                                          {f.title}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          Due:{" "}
                                          {new Intl.DateTimeFormat("en-US").format(
                                            new Date(f.dueDate)
                                          )}{" "}
                                          ({f.feeType})
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-medium">
                                        ₹{fAmount.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-right font-medium text-green-700">
                                        ₹{fPaidAmount.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-right font-bold text-amber-700">
                                        ₹{feeBal.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-center">
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            f.status === "PAID"
                                              ? "bg-green-100 text-green-800"
                                              : f.status === "PARTIAL"
                                                ? "bg-amber-100 text-amber-800"
                                                : f.status === "OVERDUE"
                                                  ? "bg-rose-100 text-rose-800"
                                                  : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {f.status}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <RecordPaymentButton
                                            fee={{
                                              id: f.id,
                                              title: f.title,
                                              amount: fAmount,
                                              paidAmount: fPaidAmount,
                                              student: {
                                                id: student.id,
                                                name: student.name,
                                                surname: student.surname,
                                                username: student.username,
                                              },
                                            }}
                                            accountantName={user?.name || "Accountant"}
                                          />
                                          {latestPayment && (
                                            <FeeReceiptModal
                                              payment={{
                                                id: latestPayment.id,
                                                receiptNo: latestPayment.receiptNo,
                                                amount: Number(latestPayment.amount),
                                                paymentDate: latestPayment.paymentDate,
                                                paymentMethod: latestPayment.paymentMethod,
                                                transactionId: latestPayment.transactionId,
                                                remarks: latestPayment.remarks,
                                                recordedBy: latestPayment.recordedBy,
                                                fee: {
                                                  title: f.title,
                                                  feeType: f.feeType,
                                                  amount: fAmount,
                                                  paidAmount: fPaidAmount,
                                                  status: f.status,
                                                  academicYear: f.academicYear,
                                                  student: {
                                                    name: student.name,
                                                    surname: student.surname,
                                                    username: student.username,
                                                    phone: student.phone,
                                                    class: student.class,
                                                    parent: student.parent,
                                                  },
                                                },
                                              }}
                                            />
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RECENT PAYMENT TRANSACTIONS LEDGER */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800">
              <span>🧾</span> Recent Payment Transactions & Receipts
            </h2>
            <Link href="/list/fees" className="text-xs font-semibold text-blue-600 hover:underline">
              View Full Fee Ledger →
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 font-semibold text-gray-500">
                  <tr>
                    <th className="p-2.5 text-left">Receipt #</th>
                    <th className="p-2.5 text-left">Student</th>
                    <th className="p-2.5 text-left">Fee Particulars</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-left">Mode</th>
                    <th className="p-2.5 text-left">Date</th>
                    <th className="p-2.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-blue-700">{payment.receiptNo}</td>
                      <td className="p-2.5 font-medium text-gray-800">
                        {payment.fee.student.name} {payment.fee.student.surname} (
                        {payment.fee.student.class?.name || "N/A"})
                      </td>
                      <td className="p-2.5 text-gray-600">{payment.fee.title}</td>
                      <td className="p-2.5 text-right font-bold text-green-700">
                        ₹{Number(payment.amount).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-gray-600">
                        {payment.paymentMethod.replace("_", " ")}
                      </td>
                      <td className="p-2.5 text-gray-400">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                        }).format(new Date(payment.paymentDate))}
                      </td>
                      <td className="p-2.5 text-center">
                        <FeeReceiptModal payment={payment as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: QUICK SHORTCUTS & ANNOUNCEMENTS */}
      <div className="flex w-full flex-col gap-6 xl:w-1/3">
        {/* QUICK LOOKUP SHORTCUT CARD */}
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800">Quick Directory Access</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/list/students"
              className="flex items-center gap-2 rounded-xl bg-lamaSkyLight p-3 font-semibold text-gray-700 transition hover:bg-lamaSky"
            >
              <Image src="/student.png" alt="" width={18} height={18} />
              <span>All Students</span>
            </Link>
            <Link
              href="/list/parents"
              className="flex items-center gap-2 rounded-xl bg-lamaYellowLight p-3 font-semibold text-gray-700 transition hover:bg-lamaYellow"
            >
              <Image src="/parent.png" alt="" width={18} height={18} />
              <span>All Parents</span>
            </Link>
          </div>
        </div>

        {/* ANNOUNCEMENTS */}
        <Announcements />
      </div>
    </div>
  );
};

export default AccountantPage;
