"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { assignmentSchema, AssignmentSchema } from "@/lib/formValidationSchemas";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SearchableSelect from "../SearchableSelect";

const AssignmentForm = ({
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
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createAssignment : updateAssignment,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Assignment has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { lessons = [] } = relatedData || {};

  const lessonOptions = lessons.map(
    (lesson: {
      id: number;
      name: string;
      subject?: { name: string };
      class?: { name: string };
      teacher?: { name: string; surname: string };
    }) => ({
      value: lesson.id,
      label: lesson.name,
      subLabel: lesson.subject?.name
        ? `${lesson.subject.name} • Class ${lesson.class?.name || "N/A"}`
        : undefined,
      badge: lesson.teacher ? `${lesson.teacher.name} ${lesson.teacher.surname}` : undefined,
    })
  );

  const formattedStartDate = data?.startDate
    ? new Date(data.startDate).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  const formattedDueDate = data?.dueDate
    ? new Date(data.dueDate).toISOString().slice(0, 16)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new assignment" : "Update the assignment"}
      </h1>

      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="Assignment Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />

        <InputField
          label="Start Date"
          name="startDate"
          defaultValue={formattedStartDate}
          register={register}
          error={errors?.startDate}
          type="datetime-local"
        />

        <InputField
          label="Due Date"
          name="dueDate"
          defaultValue={formattedDueDate}
          register={register}
          error={errors?.dueDate}
          type="datetime-local"
        />

        <SearchableSelect
          label="Lesson"
          name="lessonId"
          options={lessonOptions}
          defaultValue={data?.lessonId}
          placeholder=""
          error={errors.lessonId}
          setValue={setValue}
        />

        <div className="flex w-full flex-col gap-2">
          <label className="text-xs text-gray-500">Instructions / Description</label>
          <textarea
            {...register("description")}
            defaultValue={data?.description}
            rows={3}
            placeholder="Provide assignment guidelines, chapter references, or instructions for students..."
            className="w-full rounded-md p-2 text-sm ring-[1.5px] ring-gray-300 focus:outline-none focus:ring-2 focus:ring-lamaSky"
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <label className="text-xs text-gray-500">
            Assignment File Attachment / Resource URL (Optional)
          </label>
          <input
            {...register("fileUrl")}
            defaultValue={data?.fileUrl}
            placeholder="https://... or link to assignment worksheet / PDF"
            className="w-full rounded-md p-2 text-sm ring-[1.5px] ring-gray-300 focus:outline-none focus:ring-2 focus:ring-lamaSky"
          />
          <span className="text-[11px] text-gray-400">
            Paste a link to a question paper, PDF, worksheet, or drive document for students to
            download.
          </span>
        </div>

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
        {type === "create" ? "Create Assignment" : "Update Assignment"}
      </button>
    </form>
  );
};

export default AssignmentForm;
