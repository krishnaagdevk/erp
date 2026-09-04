import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import RecordPaymentButton from "@/components/RecordPaymentButton";
import FeeReceiptModal from "@/components/FeeReceiptModal";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serializePlain } from "@/lib/utils";

type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

const parsePage = (v?: string): number => {
  const num = Number(v);
  return Number.isFinite(num) && num > 0 ? Math.trunc(num) : 1;
};

const validStatuses = new Set<FeeStatus>(["PENDING", "PARTIAL", "PAID", "OVERDUE"]);

const FeesListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const role = user.role;
  const { page, search, status, classId } = resolvedSearchParams;
  const p = parsePage(page);

  // Build Prisma Query (Fully MySQL-compatible)
  const query: any = {};

  // If role is student or parent, restrict query to student's own records
  if (role === "student") {
    query.studentId = user.id;
  } else if (role === "parent") {
    query.student = { parentId: user.id };
  }

  if (status && validStatuses.has(status as FeeStatus)) {
    query.status = status as FeeStatus;
  }

  if (classId) {
    const cid = parseInt(classId);
    if (!isNaN(cid)) {
      query.student = {
        ...(query.student || {}),
        classId: cid,
      };
    }
  }

  if (search) {
    query.OR = [
      { title: { contains: search } },
      { student: { name: { contains: search } } },
      { student: { surname: { contains: search } } },
      { student: { username: { contains: search } } },
      { student: { phone: { contains: search } } },
    ];
  }

  const [feesRaw, count] = await prisma.$transaction([
    prisma.fee.findMany({
      where: query,
      select: {
        id: true,
        title: true,
        feeType: true,
        amount: true,
        paidAmount: true,
        dueDate: true,
        status: true,
        academicYear: true,
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
            phone: true,
            class: { select: { name: true } },
            parent: { select: { name: true, surname: true, phone: true } },
          },
        },
        payments: {
          take: 1,
          orderBy: { paymentDate: "desc" },
          select: {
            id: true,
            receiptNo: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            transactionId: true,
            remarks: true,
            recordedBy: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.fee.count({ where: query }),
  ]);

  const fees = serializePlain(feesRaw);

  const columns = [
    { header: "Student", accessor: "student" },
    { header: "Fee Title", accessor: "title" },
    { header: "Amount", accessor: "amount" },
    { header: "Paid", accessor: "paidAmount", className: "hidden md:table-cell" },
    { header: "Balance", accessor: "balance" },
    { header: "Due Date", accessor: "dueDate", className: "hidden lg:table-cell" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "action" },
  ];

  const renderRow = (item: any) => {
    const amountNum = Number(item.amount);
    const paidAmountNum = Number(item.paidAmount);
    const balance = Math.max(0, amountNum - paidAmountNum);
    const latestPayment = item.payments?.[0];

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 text-xs even:bg-slate-50 hover:bg-lamaSkyLight sm:text-sm"
      >
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {item.student.name} {item.student.surname}
            </span>
            <span className="text-[11px] text-gray-500">
              ID: {item.student.username} | Class {item.student.class?.name || "N/A"}
            </span>
          </div>
        </td>
        <td>
          <span className="font-medium text-gray-800">{item.title}</span>
          <span className="block text-[10px] text-gray-400">{item.feeType}</span>
        </td>
        <td className="font-semibold text-gray-800">₹{amountNum.toFixed(2)}</td>
        <td className="hidden font-medium text-green-700 md:table-cell">
          ₹{paidAmountNum.toFixed(2)}
        </td>
        <td className="font-bold text-amber-700">₹{balance.toFixed(2)}</td>
        <td className="hidden text-gray-500 lg:table-cell">
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(item.dueDate))}
        </td>
        <td>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              item.status === "PAID"
                ? "border border-green-200 bg-green-100 text-green-800"
                : item.status === "PARTIAL"
                  ? "border border-amber-200 bg-amber-100 text-amber-800"
                  : item.status === "OVERDUE"
                    ? "border border-rose-200 bg-rose-100 text-rose-800"
                    : "border border-gray-200 bg-gray-100 text-gray-800"
            }`}
          >
            {item.status}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            {(role === "admin" || role === "accountant") && (
              <RecordPaymentButton
                fee={{
                  id: item.id,
                  title: item.title,
                  amount: amountNum,
                  paidAmount: paidAmountNum,
                  student: {
                    id: item.student.id,
                    name: item.student.name,
                    surname: item.student.surname,
                    username: item.student.username,
                  },
                }}
                accountantName={user.name || user.username}
              />
            )}
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
                    title: item.title,
                    feeType: item.feeType,
                    amount: amountNum,
                    paidAmount: paidAmountNum,
                    status: item.status,
                    academicYear: item.academicYear,
                    student: {
                      name: item.student.name,
                      surname: item.student.surname,
                      username: item.student.username,
                      phone: item.student.phone,
                      class: item.student.class,
                      parent: item.student.parent,
                    },
                  },
                }}
              />
            )}
            {(role === "admin" || role === "accountant") && (
              <>
                <FormContainer table="fee" type="update" data={{ ...item, amount: amountNum }} />
                <FormContainer table="fee" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="m-4 mt-0 flex flex-1 flex-col gap-6 rounded-2xl bg-white p-4 shadow-sm">
      {/* TOP */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Fee Ledger & Invoices</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage student fee billing, collect payments, and track outstanding balances.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-2 self-end">
            {(role === "admin" || role === "accountant") && (
              <FormContainer table="fee" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* QUICK STATUS FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link
          href="/list/fees"
          className={`rounded-xl px-3 py-1.5 font-medium transition ${
            !status
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({count})
        </Link>
        <Link
          href="/list/fees?status=PENDING"
          className={`rounded-xl px-3 py-1.5 font-medium transition ${
            status === "PENDING"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pending
        </Link>
        <Link
          href="/list/fees?status=PARTIAL"
          className={`rounded-xl px-3 py-1.5 font-medium transition ${
            status === "PARTIAL"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Partial Paid
        </Link>
        <Link
          href="/list/fees?status=PAID"
          className={`rounded-xl px-3 py-1.5 font-medium transition ${
            status === "PAID"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Paid in Full
        </Link>
        <Link
          href="/list/fees?status=OVERDUE"
          className={`rounded-xl px-3 py-1.5 font-medium transition ${
            status === "OVERDUE"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Overdue
        </Link>
      </div>

      {/* TABLE */}
      <Table columns={columns} renderRow={renderRow} data={fees} />

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default FeesListPage;
