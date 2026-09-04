"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { useActionState, Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import SearchableMultiSelect from "../SearchableMultiSelect";

const TeacherForm = ({
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
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [img, setImg] = useState<any>();

  const [state, formAction] = useActionState(type === "create" ? createTeacher : updateTeacher, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((formData) => {
    formAction({ ...formData, img: img?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { subjects = [] } = relatedData || {};

  const subjectOptions = subjects.map((sub: { id: number; name: string }) => ({
    value: String(sub.id),
    label: sub.name,
    badge: "Subject",
  }));

  const initialSubjects = data?.subjects?.map((s: any) =>
    typeof s === "object" ? String(s.id) : String(s)
  );

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>

      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Authentication Information
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
        Personal & Teaching Information
      </span>
      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <InputField
          label="Birthday"
          name="birthday"
          defaultValue={
            data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : undefined
          }
          register={register}
          error={errors.birthday}
          type="date"
        />

        <div className="flex w-full flex-col gap-2 md:w-1/4">
          <label className="text-xs font-semibold text-gray-600">Gender</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            {...register("sex")}
            defaultValue={data?.sex || "MALE"}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>
          )}
        </div>

        {/* Filterable Multi-Select for Subjects */}
        <SearchableMultiSelect
          label="Assigned Subjects"
          name="subjects"
          options={subjectOptions}
          defaultValues={initialSubjects}
          placeholder="Filter and select subjects taught..."
          error={errors.subjects as any}
          setValue={setValue}
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

        <div className="w-full">
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
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 p-3 text-xs text-gray-600 transition hover:bg-gray-50"
                  onClick={() => open()}
                >
                  <Image src="/upload.png" alt="" width={24} height={24} />
                  <span className="font-medium">
                    {img?.secure_url
                      ? "Photo uploaded successfully (Click to replace)"
                      : "Upload a photo"}
                  </span>
                </div>
              );
            }}
          </CldUploadWidget>
        </div>
      </div>

      {state.error && (
        <span className="text-sm font-medium text-red-500">Something went wrong!</span>
      )}
      <button
        type="submit"
        className="rounded-xl bg-blue-600 p-2.5 font-medium text-white shadow transition hover:bg-blue-700"
      >
        {type === "create" ? "Create Teacher" : "Update Teacher"}
      </button>
    </form>
  );
};

export default TeacherForm;
