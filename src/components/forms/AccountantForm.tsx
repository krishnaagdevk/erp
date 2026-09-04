"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { accountantSchema, AccountantSchema } from "@/lib/formValidationSchemas";
import { createAccountant, updateAccountant } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";

const AccountantForm = ({
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
  } = useForm<AccountantSchema>({
    resolver: zodResolver(accountantSchema),
  });

  const [img, setImg] = useState<any>(data?.img);

  const [state, formAction] = useActionState(
    type === "create" ? createAccountant : updateAccountant,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction({ ...formData, img: img?.secure_url || data?.img || undefined });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Accountant has been ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a New Accountant" : "Update Accountant Details"}
      </h1>

      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Authentication & Access Details
      </span>
      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Personal & Contact Information
      </span>
      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors?.surname}
        />
        <InputField
          label="Phone Number"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors?.phone}
        />
        <InputField
          label="Residential Address"
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

        <div className="flex w-full flex-col justify-center gap-2 md:w-1/4">
          <label className="text-xs text-gray-500">Profile Photo</label>
          <CldUploadWidget
            uploadPreset="school"
            onSuccess={(result, { widget }) => {
              setImg(result.info);
              widget.close();
            }}
          >
            {({ open }) => {
              return (
                <div
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-500 transition hover:bg-gray-100"
                  onClick={() => open()}
                >
                  <Image src="/upload.png" alt="" width={24} height={24} />
                  <span>{img?.secure_url || data?.img ? "Change Photo" : "Upload a photo"}</span>
                </div>
              );
            }}
          </CldUploadWidget>
        </div>
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
        {type === "create" ? "Create Accountant" : "Update Accountant"}
      </button>
    </form>
  );
};

export default AccountantForm;
