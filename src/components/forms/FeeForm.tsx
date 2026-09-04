"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { feeSchema, FeeSchema } from "@/lib/formValidationSchemas";
import { createFee, updateFee } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SearchableSelect from "../SearchableSelect";

const FeeForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FeeSchema>({
    resolver: zodResolver(feeSchema),
  });

  const [state, formAction] = useActionState(type === "create" ? createFee : updateFee, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Fee invoice has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { students = [] } = relatedData || {};

  const formattedDueDate = data?.dueDate
    ? new Date(data.dueDate).toISOString().split("T")[0]
    : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0];

  const studentOptions = students.map(
    (student: {
      id: string;
      name: string;
      surname: string;
      username: string;
      class?: { name: string };
    }) => ({
      value: student.id,
      label: `${student.name} ${student.surname}`,
      subLabel: `@${student.username}`,
      badge: student.class?.name ? `Class ${student.class.name}` : "No Class",
    })
  );

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Student Fee Invoice" : "Update Fee Invoice"}
      </h1>

      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="Fee Title / Purpose"
          name="title"
          defaultValue={data?.title || "Tuition Fee - Term 1"}
          register={register}
          error={errors.title}
        />

        <div className="flex w-full flex-col gap-2 md:w-1/4">
          <label className="text-xs font-semibold text-gray-600">Fee Category</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            {...register("feeType")}
            defaultValue={data?.feeType || "TUITION"}
          >
            <option value="TUITION">Tuition Fee</option>
            <option value="TRANSPORT">Transport Fee</option>
            <option value="EXAM">Exam & Assessment Fee</option>
            <option value="ADMISSION">Admission Fee</option>
            <option value="ANNUAL">Annual & Activity Fee</option>
            <option value="LAB_LIBRARY">Lab / Library Fee</option>
            <option value="HOSTEL">Hostel Fee</option>
            <option value="OTHER">Other / Miscellaneous</option>
          </select>
          {errors.feeType?.message && (
            <p className="text-xs text-red-400">{errors.feeType.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Fee Amount (₹)"
          name="amount"
          type="number"
          defaultValue={data?.amount?.toString() || "500"}
          register={register}
          error={errors.amount}
          inputProps={{ min: "1", step: "any" }}
        />

        <InputField
          label="Payment Due Date"
          name="dueDate"
          type="date"
          defaultValue={formattedDueDate}
          register={register}
          error={errors.dueDate}
        />

        <InputField
          label="Academic Year"
          name="academicYear"
          defaultValue={data?.academicYear || "2024-2025"}
          register={register}
          error={errors.academicYear}
        />

        <SearchableSelect
          label="Target Student"
          name="studentId"
          options={studentOptions}
          defaultValue={data?.studentId}
          placeholder="Search student by name, username or class..."
          error={errors.studentId}
          setValue={setValue}
        />

        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors.id}
            hidden
          />
        )}
      </div>

      {state.error && (
        <span className="text-sm font-medium text-red-500">
          {state.message || "Something went wrong!"}
        </span>
      )}

      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
      >
        {type === "create" ? "Issue Fee Invoice" : "Update Fee Invoice"}
      </button>
    </form>
  );
};

export default FeeForm;
