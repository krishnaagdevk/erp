"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { createParent, updateParent } from "@/lib/actions";
import {
  useActionState,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  startTransition,
} from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ParentForm = ({
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
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
  });

  const [state, formAction] = useActionState(type === "create" ? createParent : updateParent, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Parent record has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const [aadharVal, setAadharVal] = useState<string>(() => {
    if (!data?.aadhar) return "";
    const clean = data.aadhar.replace(/\D/g, "").slice(0, 12);
    return clean.replace(/(\d{4})(?=\d)/g, "$1 ");
  });

  useEffect(() => {
    if (aadharVal) {
      setValue("aadhar", aadharVal);
    }
  }, [aadharVal, setValue]);

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 12);
    // Format as groups of 4 digits: "1234", "1234 5", "1234 5678", "1234 5678 9012"
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ");
    setAadharVal(formatted);
    setValue("aadhar", formatted, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add New Parent / Guardian" : "Update Parent Information"}
      </h1>

      {/* PRIMARY IDENTIFIER & CONTACT */}
      <div className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
        <p className="text-xs text-gray-500">
          The Parent&apos;s Mobile Phone Number serves as their primary login username and key
          account identifier.
        </p>
        <div className="flex flex-wrap justify-between gap-4 pt-1">
          <InputField
            label="Parent Mobile Number *"
            name="phone"
            defaultValue={data?.phone}
            register={register}
            error={errors?.phone}
            inputProps={{
              placeholder: "e.g. 9876543210",
              maxLength: 15,
            }}
          />

          {/* Real-time Formatted Aadhar Input */}
          <div className="flex w-full flex-col gap-2 md:w-1/4">
            <label className="text-xs text-gray-500">Aadhar Number (12 Digits)</label>
            <input
              type="text"
              name="aadhar"
              value={aadharVal}
              onChange={handleAadharChange}
              placeholder="e.g. 1234 5678 9012"
              maxLength={14}
              className="w-full rounded-md p-2 font-mono text-sm tracking-wider outline-none ring-[1.5px] ring-gray-300 transition focus:ring-2 focus:ring-blue-500"
            />
            {errors?.aadhar?.message && (
              <p className="text-xs text-red-400">{errors.aadhar.message.toString()}</p>
            )}
          </div>

          <InputField
            label="Password"
            name="password"
            type="password"
            defaultValue={data?.password}
            register={register}
            error={errors?.password}
            inputProps={{
              placeholder: type === "create" ? "Default is Mobile No." : "Leave blank to keep same",
            }}
          />
        </div>
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Parent Personal & Contact Details
      </span>
      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="First Name *"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Last Name *"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors?.surname}
        />
        <InputField
          label="Email Address"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
          inputProps={{
            placeholder: "parent@example.com (optional)",
          }}
        />
        <InputField
          label="Residential Address *"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors?.address}
        />

        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
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
        className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow transition hover:bg-blue-700"
      >
        {type === "create" ? "Create Parent" : "Update Parent"}
      </button>
    </form>
  );
};

export default ParentForm;
