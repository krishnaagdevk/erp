"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SearchableSelect from "../SearchableSelect";

const LessonForm = ({
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
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
  });

  const [state, formAction] = useActionState(type === "create" ? createLesson : updateLesson, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { subjects = [], classes = [], teachers = [] } = relatedData || {};

  const subjectOptions = subjects.map((sub: { id: number; name: string }) => ({
    value: sub.id,
    label: sub.name,
    badge: "Subject",
  }));

  const classOptions = classes.map((cls: { id: number; name: string }) => ({
    value: cls.id,
    label: `Class ${cls.name}`,
    badge: "Class",
  }));

  const teacherOptions = teachers.map((t: { id: string; name: string; surname: string }) => ({
    value: t.id,
    label: `${t.name} ${t.surname}`,
    badge: "Teacher",
  }));

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update the lesson"}
      </h1>

      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="Lesson Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />

        <div className="flex w-full flex-col gap-2 md:w-1/4">
          <label className="text-xs font-semibold text-gray-600">Day of the Week</label>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            {...register("day")}
            defaultValue={data?.day || "MONDAY"}
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
          </select>
          {errors.day?.message && (
            <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Start Time"
          name="startTime"
          defaultValue={data?.startTime}
          register={register}
          error={errors?.startTime}
          type="datetime-local"
        />

        <InputField
          label="End Time"
          name="endTime"
          defaultValue={data?.endTime}
          register={register}
          error={errors?.endTime}
          type="datetime-local"
        />

        <SearchableSelect
          label="Subject"
          name="subjectId"
          options={subjectOptions}
          defaultValue={data?.subjectId}
          placeholder="Select subject..."
          error={errors.subjectId}
          setValue={setValue}
        />

        <SearchableSelect
          label="Class Section"
          name="classId"
          options={classOptions}
          defaultValue={data?.classId}
          placeholder="Select class section..."
          error={errors.classId}
          setValue={setValue}
        />

        <SearchableSelect
          label="Assigned Teacher"
          name="teacherId"
          options={teacherOptions}
          defaultValue={data?.teacherId}
          placeholder="Select teacher..."
          error={errors.teacherId}
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
      <button className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow transition hover:bg-blue-700">
        {type === "create" ? "Create Lesson" : "Update Lesson"}
      </button>
    </form>
  );
};

export default LessonForm;
