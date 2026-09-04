"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
import { createExam, updateExam } from "@/lib/actions";
import { Dispatch, SetStateAction, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SearchableSelect from "../SearchableSelect";

const ExamForm = ({
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
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
  });

  const [state, formAction] = useActionState(type === "create" ? createExam : updateExam, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Exam has been ${type === "create" ? "created" : "updated"}!`);
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

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update the exam"}
      </h1>

      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="Exam title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Date"
          name="startTime"
          defaultValue={data?.startTime}
          register={register}
          error={errors?.startTime}
          type="datetime-local"
        />
        <InputField
          label="End Date"
          name="endTime"
          defaultValue={data?.endTime}
          register={register}
          error={errors?.endTime}
          type="datetime-local"
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

        <SearchableSelect
          label="Lesson"
          name="lessonId"
          options={lessonOptions}
          defaultValue={data?.lessonId}
          placeholder="Search lessons by title/subject/class..."
          error={errors.lessonId}
          setValue={setValue}
        />
      </div>
      {state.error && <span className="text-red-500">Something went wrong!</span>}
      <button className="rounded-md bg-blue-500 p-2 font-medium text-white transition hover:bg-blue-600">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;
