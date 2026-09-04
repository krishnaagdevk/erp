"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { useActionState, Dispatch, SetStateAction, useEffect, useState } from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import SearchableSelect from "../SearchableSelect";

const StudentForm = ({
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
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
  });

  const [img, setImg] = useState<any>();

  const [state, formAction] = useActionState(type === "create" ? createStudent : updateStudent, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((formData) => {
    formAction({ ...formData, img: img?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Student has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { grades = [], classes = [], parents = [] } = relatedData || {};

  const gradeOptions = grades.map((g: { id: number; level: number }) => ({
    value: g.id,
    label: `Grade ${g.level}`,
    badge: `Lvl ${g.level}`,
  }));

  const classOptions = classes.map(
    (c: { id: number; name: string; capacity: number; _count?: { students: number } }) => ({
      value: c.id,
      label: `Class ${c.name}`,
      subLabel: `${c._count?.students || 0}/${c.capacity} students`,
      badge: (c._count?.students || 0) >= c.capacity ? "Full" : "Open",
    })
  );

  const parentOptions = parents.map(
    (p: { id: string; name: string; surname: string; username: string; phone?: string }) => ({
      value: p.id,
      label: `${p.name} ${p.surname}`,
      subLabel: `@${p.username}`,
      badge: p.phone || undefined,
    })
  );

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new student" : "Update the student"}
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
        Personal & Academic Information
      </span>
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

        {/* Filterable Select for Parent */}
        <SearchableSelect
          label="Assigned Parent"
          name="parentId"
          options={parentOptions}
          defaultValue={data?.parentId}
          placeholder="Search parents by name, username or phone..."
          error={errors.parentId}
          setValue={setValue}
        />

        {/* Filterable Select for Grade */}
        <SearchableSelect
          label="Academic Grade"
          name="gradeId"
          options={gradeOptions}
          defaultValue={data?.gradeId}
          placeholder="Select grade level..."
          error={errors.gradeId}
          setValue={setValue}
        />

        {/* Filterable Select for Class */}
        <SearchableSelect
          label="Class Section"
          name="classId"
          options={classOptions}
          defaultValue={data?.classId}
          placeholder="Select class section..."
          error={errors.classId}
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
      </div>

      {state.error && (
        <span className="text-sm font-medium text-red-500">Something went wrong!</span>
      )}
      <button
        type="submit"
        className="rounded-xl bg-blue-600 p-2.5 font-medium text-white shadow transition hover:bg-blue-700"
      >
        {type === "create" ? "Create Student" : "Update Student"}
      </button>
    </form>
  );
};

export default StudentForm;
