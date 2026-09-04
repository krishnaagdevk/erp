"use client";

import { useState } from "react";
import Image from "next/image";

type FeePaymentData = {
  id: number;
  receiptNo: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  transactionId?: string | null;
  remarks?: string | null;
  recordedBy?: string | null;
  fee: {
    title: string;
    feeType: string;
    amount: number;
    paidAmount: number;
    status: string;
    academicYear?: string | null;
    student: {
      name: string;
      surname: string;
      username: string;
      phone?: string | null;
      class?: { name: string } | null;
      parent?: { name: string; surname: string; phone: string } | null;
    };
  };
};

const FeeReceiptModal = ({ payment }: { payment: FeePaymentData }) => {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const balance = Math.max(0, payment.fee.amount - payment.fee.paidAmount);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md bg-lamaSky px-2.5 py-1 text-xs font-medium text-blue-800 transition hover:bg-blue-200"
        title="View Receipt"
      >
        <span>Receipt</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6">
          <div className="relative my-auto w-full max-w-xl rounded-2xl bg-white p-6 text-gray-800 shadow-2xl sm:p-8 print:w-full print:max-w-full print:shadow-none">
            {/* CLOSE BUTTON */}
            <div
              className="absolute right-4 top-4 cursor-pointer rounded-full p-2 transition hover:bg-gray-100 print:hidden"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="close" width={14} height={14} />
            </div>

            {/* RECEIPT HEADER */}
            <div className="mb-6 border-b border-gray-200 pb-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-2">
                <Image src="/logo.png" alt="School Logo" width={28} height={28} />
                <h1 className="text-xl font-bold tracking-tight text-gray-900">LAMA ACADEMY</h1>
              </div>
              <p className="text-xs text-gray-500">
                Official Fee Payment Receipt & Transaction Acknowledgment
              </p>
              <div className="mt-2 inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                Receipt #{payment.receiptNo}
              </div>
            </div>

            {/* STUDENT & TRANSACTION DETAILS */}
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-xs">
              <div>
                <span className="mb-0.5 block text-gray-400">Student Name</span>
                <span className="font-semibold text-gray-900">
                  {payment.fee.student.name} {payment.fee.student.surname}
                </span>
                <span className="block text-gray-500">ID: {payment.fee.student.username}</span>
              </div>
              <div>
                <span className="mb-0.5 block text-gray-400">Class / Grade</span>
                <span className="font-semibold text-gray-900">
                  Class {payment.fee.student.class?.name || "N/A"}
                </span>
                <span className="block text-gray-500">
                  Parent: {payment.fee.student.parent?.name} {payment.fee.student.parent?.surname} (
                  {payment.fee.student.parent?.phone})
                </span>
              </div>
              <div>
                <span className="mb-0.5 block text-gray-400">Payment Date & Time</span>
                <span className="font-medium text-gray-800">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(payment.paymentDate))}
                </span>
              </div>
              <div>
                <span className="mb-0.5 block text-gray-400">Payment Method</span>
                <span className="font-medium text-gray-800">
                  {payment.paymentMethod.replace("_", " ")}
                  {payment.transactionId ? ` (${payment.transactionId})` : ""}
                </span>
              </div>
            </div>

            {/* FEE BREAKDOWN TABLE */}
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 font-semibold text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Fee Particulars</th>
                    <th className="p-3 text-left">Academic Term</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3">
                      <span className="block font-medium text-gray-800">{payment.fee.title}</span>
                      <span className="text-[10px] text-gray-400">
                        Category: {payment.fee.feeType}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {payment.fee.academicYear || "Current Session"}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-800">
                      ₹{payment.fee.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TOTALS & BALANCES */}
            <div className="space-y-2 border-t border-gray-200 pt-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total Fee Billed:</span>
                <span>₹{payment.fee.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-green-50 p-2 text-sm font-bold text-green-700">
                <span>Amount Paid in this Receipt:</span>
                <span>₹{payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Paid to Date:</span>
                <span className="font-medium text-gray-800">
                  ₹{payment.fee.paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Remaining Balance Due:</span>
                <span
                  className={`font-semibold ${balance === 0 ? "text-green-600" : "text-amber-600"}`}
                >
                  ₹{balance.toFixed(2)} {balance === 0 && "(FULLY PAID)"}
                </span>
              </div>
              {payment.remarks && (
                <div className="mt-3 rounded bg-gray-50 p-2 text-[11px] italic text-gray-500">
                  Remarks: {payment.remarks}
                </div>
              )}
            </div>

            {/* FOOTER & SIGNATURE */}
            <div className="mt-8 flex items-end justify-between border-t border-gray-200 pt-6 text-[11px] text-gray-400">
              <div>
                <span>Cashier / Authorized Signatory: </span>
                <span className="font-medium text-gray-700">
                  {payment.recordedBy || "Account Department"}
                </span>
              </div>
              <div className="text-center">
                <div className="mb-1 w-32 border-b border-gray-300 pb-1"></div>
                <span>School Seal & Stamp</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700"
              >
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeeReceiptModal;
