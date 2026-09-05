"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { casteSchema, CasteSchema } from "@/lib/formValidationSchemas";
import { createCaste, updateCaste } from "@/lib/actions";
import { useActionState, Dispatch, SetStateAction, useEffect, startTransition } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const CasteForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CasteSchema>({
    resolver: zodResolver(casteSchema),
    defaultValues: {
      name: data?.name || "",
      category: data?.category || "General",
      description: data?.description || "",
    },
  });

  const [state, formAction] = useActionState(type === "create" ? createCaste : updateCaste, {
    success: false,
    error: false,
    message: "",
  });

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Caste category has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-6 pb-2" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          {type === "create" ? "Add New Caste Category" : "Edit Caste Category"}
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Define caste names and categories (e.g., General, OBC, SC, ST, EWS) for student
          admissions.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <InputField
          label="Caste Name *"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          inputProps={{
            placeholder: "e.g. Brahmin, Rajput, Yadav, Verma, Khan, etc.",
          }}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Category Tag</label>
          <select
            {...register("category")}
            defaultValue={data?.category || "General"}
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="General">General (GEN)</option>
            <option value="OBC">Other Backward Class (OBC)</option>
            <option value="SC">Scheduled Caste (SC)</option>
            <option value="ST">Scheduled Tribe (ST)</option>
            <option value="EWS">Economically Weaker Section (EWS)</option>
            <option value="Minority">Minority</option>
            <option value="Other">Other</option>
          </select>
          {errors.category?.message && (
            <p className="text-xs text-red-400">{errors.category.message.toString()}</p>
          )}
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Description (Optional)</label>
          <input
            type="text"
            {...register("description")}
            defaultValue={data?.description}
            placeholder="e.g. State recognized reserved quota category"
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {errors?.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
          )}
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
          {state.message || "Failed to save caste details."}
        </div>
      )}

      <button
        type="submit"
        className="rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.99]"
      >
        {type === "create" ? "Add Caste Category" : "Save Changes"}
      </button>
    </form>
  );
};

export default CasteForm;
