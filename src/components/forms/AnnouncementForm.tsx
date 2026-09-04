"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SearchableSelect from "../SearchableSelect";

const AnnouncementForm = ({
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
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
  });

  const [state, formAction] = useActionState(
    type === "create" ? createAnnouncement : updateAnnouncement,
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
      toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { classes = [] } = relatedData || {};

  const formattedDate = data?.date
    ? new Date(data.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const classOptions = [
    { value: "", label: "All Classes (General Audience)", badge: "School-wide" },
    ...classes.map((cls: { id: number; name: string }) => ({
      value: cls.id,
      label: `Class ${cls.name}`,
      badge: "Targeted",
    })),
  ];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new announcement" : "Update the announcement"}
      </h1>

      <div className="flex flex-wrap justify-between gap-4">
        <InputField
          label="Announcement Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Date"
          name="date"
          defaultValue={formattedDate}
          register={register}
          error={errors?.date}
          type="date"
        />

        <SearchableSelect
          label="Target Audience / Class"
          name="classId"
          options={classOptions}
          defaultValue={data?.classId || ""}
          placeholder="Select audience..."
          error={errors.classId as any}
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

        <div className="flex w-full flex-col gap-2">
          <label className="text-xs font-semibold text-gray-600">Announcement Content</label>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-gray-200 p-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Write announcement details..."
            defaultValue={data?.description}
            {...register("description")}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
          )}
        </div>
      </div>

      {state.error && (
        <span className="text-sm font-medium text-red-500">Something went wrong!</span>
      )}
      <button className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow transition hover:bg-blue-700">
        {type === "create" ? "Create Announcement" : "Update Announcement"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
