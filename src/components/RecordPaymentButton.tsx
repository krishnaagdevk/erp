"use client";

import { useState } from "react";
import Image from "next/image";
import FeePaymentForm from "./forms/FeePaymentForm";

type RecordPaymentButtonProps = {
  fee: {
    id: number;
    title: string;
    amount: number;
    paidAmount: number;
    student: {
      id: string;
      name: string;
      surname: string;
      username: string;
    };
  };
  accountantName?: string;
  size?: "sm" | "md";
};

const RecordPaymentButton = ({ fee, accountantName, size = "sm" }: RecordPaymentButtonProps) => {
  const [open, setOpen] = useState(false);
  const isPaid = fee.paidAmount >= fee.amount;

  if (isPaid) {
    return (
      <span className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
        Paid in Full
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"
        } flex items-center gap-1.5 rounded-lg bg-emerald-600 font-medium text-white shadow-sm transition hover:bg-emerald-700`}
      >
        <span>Collect Fee</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6">
          <div className="relative my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div
              className="absolute right-4 top-4 cursor-pointer rounded-full p-2 transition hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="close" width={14} height={14} />
            </div>
            <FeePaymentForm fee={fee} setOpen={setOpen} accountantName={accountantName} />
          </div>
        </div>
      )}
    </>
  );
};

export default RecordPaymentButton;
