"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { feePaymentSchema, FeePaymentSchema } from "@/lib/formValidationSchemas";
import { recordFeePayment } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const FeePaymentForm = ({
  fee,
  setOpen,
  accountantName,
}: {
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
  setOpen: Dispatch<SetStateAction<boolean>>;
  accountantName?: string;
}) => {
  const balanceDue = Math.max(0, fee.amount - fee.paidAmount);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeePaymentSchema>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      feeId: fee.id,
      amount: balanceDue,
      paymentMethod: "CASH",
      recordedBy: accountantName || "Accountant",
    },
  });

  const [state, formAction] = useActionState(recordFeePayment, {
    success: false,
    error: false,
    message: "",
  });

  const onSubmit = handleSubmit((formData) => {
    formAction(formData as any);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(state.message || "Payment recorded successfully!");
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen]);

  return (
    <form className="flex flex-col gap-6 text-gray-800" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Collect & Record Fee Payment</h1>
        <p className="mt-1 text-xs text-gray-500">
          Recording fee for student:{" "}
          <span className="font-semibold text-gray-800">
            {fee.student.name} {fee.student.surname} ({fee.student.username})
          </span>
        </p>
      </div>

      {/* FEE SUMMARY BOX */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-xs">
        <div>
          <span className="block text-gray-500">Total Invoiced</span>
          <span className="text-sm font-bold text-gray-800">₹{fee.amount.toFixed(2)}</span>
        </div>
        <div>
          <span className="block text-gray-500">Paid So Far</span>
          <span className="text-sm font-bold text-green-700">₹{fee.paidAmount.toFixed(2)}</span>
        </div>
        <div>
          <span className="block text-gray-500">Balance Remaining</span>
          <span className="text-sm font-bold text-amber-700">₹{balanceDue.toFixed(2)}</span>
        </div>
      </div>

      <input type="hidden" value={fee.id} {...register("feeId")} />
      <input type="hidden" value={accountantName || "Accountant"} {...register("recordedBy")} />

      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label={`Amount to Pay (₹ max ${balanceDue})`}
          name="amount"
          type="number"
          defaultValue={balanceDue.toString()}
          register={register}
          error={errors.amount}
          inputProps={{ min: "1", max: balanceDue.toString(), step: "any" }}
        />

        <div className="flex w-full flex-col gap-2 md:w-1/4">
          <label className="text-xs text-gray-500">Payment Mode</label>
          <select
            className="w-full rounded-md p-2 text-sm outline-none ring-[1.5px] ring-gray-300 focus:ring-blue-400"
            {...register("paymentMethod")}
          >
            <option value="CASH">Cash</option>
            <option value="UPI_ONLINE">UPI / Online</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
            <option value="CHEQUE">Cheque / Demand Draft</option>
          </select>
          {errors.paymentMethod?.message && (
            <p className="text-xs text-red-400">{errors.paymentMethod.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Transaction / Reference / Cheque No."
          name="transactionId"
          register={register}
          error={errors.transactionId}
        />

        <div className="flex w-full flex-col gap-2">
          <label className="text-xs text-gray-500">Remarks / Notes</label>
          <textarea
            className="min-h-[70px] w-full rounded-md p-2 text-sm outline-none ring-[1.5px] ring-gray-300 focus:ring-blue-400"
            placeholder="Optional receipt note or payment particulars..."
            {...register("remarks")}
          />
          {errors.remarks?.message && (
            <p className="text-xs text-red-400">{errors.remarks.message.toString()}</p>
          )}
        </div>
      </div>

      {state.error && (
        <span className="text-sm font-medium text-red-500">
          {state.message || "Something went wrong! Please verify payment values."}
        </span>
      )}

      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
      >
        Submit & Issue Receipt
      </button>
    </form>
  );
};

export default FeePaymentForm;
