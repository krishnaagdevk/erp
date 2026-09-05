"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import {
  useActionState,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
  startTransition,
  useCallback,
  useRef,
} from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { createStudent, updateStudent, searchParentByPhone } from "@/lib/actions";
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
    defaultValues: {
      sex: data?.sex || "MALE",
      gradeId: data?.gradeId || undefined,
      classId: data?.classId || undefined,
      parentId: data?.parentId || undefined,
      casteId: data?.casteId || undefined,
      category: data?.category || undefined,
      religion: data?.religion || undefined,
      bloodType: data?.bloodType || "O+",
    },
  });

  const [img, setImg] = useState<any>();

  const [state, formAction] = useActionState(type === "create" ? createStudent : updateStudent, {
    success: false,
    error: false,
    message: "",
  });

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction({ ...formData, img: img?.secure_url || data?.img });
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Student record has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { grades = [], classes = [], parents = [], castes = [] } = relatedData || {};

  // Track active Parent selection for live info preview card
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(data?.parentId);
  const [parentRecord, setParentRecord] = useState<any>(() => {
    if (!data?.parentId) return null;
    return parents.find((p: any) => String(p.id) === String(data.parentId)) || null;
  });

  // Track active Caste selection
  const [selectedCasteId, setSelectedCasteId] = useState<number | undefined>(data?.casteId);

  // Phone search input state for direct lookup (ideal when 2000+ parents exist)
  const [phoneQuery, setPhoneQuery] = useState<string>(() => {
    if (!data?.parentId) return "";
    const p = parents.find((p: any) => String(p.id) === String(data.parentId));
    return p?.phone || p?.username || "";
  });
  const [isSearchingParent, setIsSearchingParent] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{
    status: "idle" | "found" | "not_found";
    message?: string;
  }>({
    status: data?.parentId ? "found" : "idle",
  });

  // Track active Grade selection to filter Classes
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(data?.gradeId);
  const [selectedClass, setSelectedClass] = useState<number | undefined>(data?.classId);

  // Aadhar Number Real-Time Formatter
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
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ");
    setAadharVal(formatted);
    setValue("aadhar", formatted, { shouldValidate: true, shouldDirty: true });
  };

  const casteOptions = useMemo(() => {
    return castes.map((c: { id: number; name: string; category?: string }) => ({
      value: c.id,
      label: c.name,
      badge: c.category || undefined,
    }));
  }, [castes]);

  const handleCasteChange = useCallback(
    (name: string, val: any) => {
      const parsedVal = val ? Number(val) : undefined;
      setSelectedCasteId(parsedVal);
      setValue("casteId", parsedVal as any, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  const gradeOptions = useMemo(() => {
    return grades.map((g: { id: number; level: number }) => ({
      value: g.id,
      label: `Grade ${g.level}`,
      badge: `Lvl ${g.level}`,
    }));
  }, [grades]);

  // Filter Classes strictly by selected Grade if a Grade is selected
  const availableClasses = useMemo(() => {
    if (!selectedGrade) return classes;
    return classes.filter((c: any) => Number(c.gradeId) === Number(selectedGrade));
  }, [classes, selectedGrade]);

  const classOptions = useMemo(() => {
    return availableClasses.map(
      (c: {
        id: number;
        name: string;
        capacity: number;
        gradeId: number;
        _count?: { students: number };
      }) => {
        const studentCount = c._count?.students || 0;
        const isFull = studentCount >= c.capacity;
        return {
          value: c.id,
          label: `Class ${c.name}`,
          subLabel: `${studentCount}/${c.capacity} enrolled`,
          badge: isFull ? "Full" : "Available",
        };
      }
    );
  }, [availableClasses]);

  // Fast direct phone lookup handler for scalability (2000+ parents)
  const lookupParent = useCallback(
    async (phone: string) => {
      const clean = phone.trim();
      if (!clean || clean.length < 3) {
        if (!clean) {
          setSelectedParentId(undefined);
          setParentRecord(null);
          setValue("parentId", "" as any, { shouldValidate: true, shouldDirty: true });
          setSearchFeedback({ status: "idle" });
        }
        return;
      }

      // 1. Check in loaded relatedData.parents first for fast instant match
      const localMatch = parents.find(
        (p: any) =>
          p.phone === clean ||
          p.username === clean ||
          (p.phone && p.phone.includes(clean)) ||
          (p.username && p.username.includes(clean))
      );

      if (localMatch && (localMatch.phone === clean || localMatch.username === clean)) {
        setSelectedParentId(localMatch.id);
        setParentRecord(localMatch);
        setValue("parentId", localMatch.id, { shouldValidate: true, shouldDirty: true });
        setSearchFeedback({ status: "found" });
        return;
      }

      // 2. Server lookup for high scalability (even when 2,000+ records are in DB)
      setIsSearchingParent(true);
      try {
        const res = await searchParentByPhone(clean);
        if (res.success && res.parent) {
          setSelectedParentId(res.parent.id);
          setParentRecord(res.parent);
          setValue("parentId", res.parent.id, { shouldValidate: true, shouldDirty: true });
          setSearchFeedback({ status: "found" });
        } else {
          // If partial query has a local match, show it
          if (localMatch) {
            setSelectedParentId(localMatch.id);
            setParentRecord(localMatch);
            setValue("parentId", localMatch.id, { shouldValidate: true, shouldDirty: true });
            setSearchFeedback({ status: "found" });
          } else {
            setSelectedParentId(undefined);
            setParentRecord(null);
            setValue("parentId", "" as any, { shouldValidate: true, shouldDirty: true });
            setSearchFeedback({
              status: "not_found",
              message:
                clean.length >= 10
                  ? "No registered parent found with this phone number."
                  : undefined,
            });
          }
        }
      } catch (err) {
        console.error("Parent search error:", err);
      } finally {
        setIsSearchingParent(false);
      }
    },
    [parents, setValue]
  );

  // Debounced phone search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      lookupParent(val);
    }, 300);
  };

  const handleGradeChange = useCallback(
    (name: string, val: any) => {
      setSelectedGrade(val ? Number(val) : undefined);
      setValue("gradeId", val, { shouldValidate: true, shouldDirty: true });

      // If selected class doesn't belong to newly selected grade, reset class selection
      if (selectedClass) {
        const cls = classes.find((c: any) => Number(c.id) === Number(selectedClass));
        if (cls && Number(cls.gradeId) !== Number(val)) {
          setSelectedClass(undefined);
          setValue("classId", 0 as any, { shouldValidate: true });
        }
      }
    },
    [classes, selectedClass, setValue]
  );

  const handleClassChange = useCallback(
    (name: string, val: any) => {
      setSelectedClass(val ? Number(val) : undefined);
      setValue("classId", val, { shouldValidate: true, shouldDirty: true });

      // Auto-select parent Grade if not already chosen
      if (val) {
        const cls = classes.find((c: any) => Number(c.id) === Number(val));
        if (cls && cls.gradeId) {
          setSelectedGrade(Number(cls.gradeId));
          setValue("gradeId", Number(cls.gradeId), { shouldValidate: true, shouldDirty: true });
        }
      }
    },
    [classes, setValue]
  );

  return (
    <form className="flex flex-col gap-6 pb-6" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Student Admission & Registration" : "Update Student Profile"}
        </h1>
        <p className="mt-0.5 text-xs text-gray-500">
          Register new student with autogenerated Student ID and verified class allocation.
        </p>
      </div>

      {/* STEP 1: PARENT ASSOCIATION WITH LIVE PHONE SEARCH & PREVIEW */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Parent Phone Number Lookup */}
        <div className="flex w-full flex-col gap-1.5 md:w-1/2">
          <label className="text-xs font-semibold text-gray-700">Parent Mobile Number *</label>
          <div className="relative">
            <input
              type="text"
              value={phoneQuery}
              onChange={handlePhoneInputChange}
              placeholder="Type full phone number (e.g. 9876543210)..."
              className={`w-full rounded-xl border bg-white p-2.5 pr-10 font-mono text-sm shadow-sm outline-none transition focus:ring-2 ${
                searchFeedback.status === "found"
                  ? "border-green-400 focus:border-green-500 focus:ring-green-100"
                  : searchFeedback.status === "not_found" && phoneQuery.length >= 10
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
              }`}
            />
            {/* Loading / Status Icon */}
            <div className="absolute right-3 top-2.5 flex items-center gap-1">
              {isSearchingParent ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : searchFeedback.status === "found" ? (
                <span className="text-xs font-bold text-green-600" title="Parent Verified">
                  ✓
                </span>
              ) : null}
            </div>
          </div>

          {/* Hidden input to ensure parentId is bound in React Hook Form */}
          <input type="hidden" {...register("parentId")} value={selectedParentId || ""} />

          {/* Status feedback & validation messages */}
          {errors.parentId && (
            <p className="text-xs font-medium text-red-500">
              {errors.parentId.message?.toString()}
            </p>
          )}

          {searchFeedback.message && searchFeedback.status === "not_found" && (
            <p className="text-xs font-medium text-amber-600">{searchFeedback.message}</p>
          )}
        </div>

        {/* Right Side: Parent Information Card */}
        <div className="w-full md:w-1/2">
          {parentRecord ? (
            <div className="animate-in fade-in flex flex-col gap-2 rounded-xl border border-green-200 bg-emerald-50/40 p-3.5 shadow-sm transition-all">
              <div className="flex items-center justify-between border-b border-green-100 pb-1.5">
                <span className="flex items-center gap-1 text-xs font-bold text-green-800">
                  <svg
                    className="h-3.5 w-3.5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Guardian
                </span>
                <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-green-700">
                  {parentRecord.phone || parentRecord.username}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="block text-[10px] uppercase text-gray-400">Parent Name</span>
                  <span className="font-semibold text-gray-800">
                    {parentRecord.name} {parentRecord.surname}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-gray-400">Mobile Phone</span>
                  <span className="font-mono font-medium text-gray-800">
                    {parentRecord.phone || parentRecord.username || "N/A"}
                  </span>
                </div>
                {parentRecord.aadhar && (
                  <div>
                    <span className="block text-[10px] uppercase text-gray-400">Aadhar No.</span>
                    <span className="font-mono text-gray-700">{parentRecord.aadhar}</span>
                  </div>
                )}
                {parentRecord.email && (
                  <div>
                    <span className="block text-[10px] uppercase text-gray-400">Email</span>
                    <span className="truncate text-gray-700">{parentRecord.email}</span>
                  </div>
                )}
              </div>
              {parentRecord.address && (
                <div className="border-t border-green-100 pt-1 text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">Address: </span>
                  {parentRecord.address}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[92px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/70 p-3 text-center text-xs text-gray-400">
              <span>
                Type a registered parent&apos;s mobile number to automatically preview their
                verified details here.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: AUTHENTICATION & SYSTEM ID */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex w-full flex-col gap-1.5 md:w-1/4">
          <label className="text-xs font-semibold text-gray-600">
            Student ID {type === "create" && "(Autogenerated)"}
          </label>
          <input
            type="text"
            {...register("username")}
            defaultValue={data?.username}
            placeholder={type === "create" ? "Autogenerated (e.g. STU20260001)" : "Student ID"}
            className="w-full rounded-xl border border-gray-200 bg-white p-2.5 font-mono text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {errors?.username?.message && (
            <p className="text-xs text-red-400">{errors.username.message.toString()}</p>
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
            placeholder: type === "create" ? "Default: student123" : "Leave blank to keep same",
          }}
        />

        <InputField
          label="Student Email (Optional)"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
          inputProps={{
            placeholder: "student@school.edu",
          }}
        />
      </div>

      {/* STEP 3: PERSONAL INFORMATION & AADHAR */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
          Personal Information & Identification
        </span>

        {/* Cloudinary Photo Upload */}
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
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-3.5 text-xs text-gray-600 transition hover:bg-gray-100/70"
                onClick={() => open()}
              >
                <Image src="/upload.png" alt="" width={24} height={24} />
                <div>
                  <span className="font-semibold text-gray-800">
                    {img?.secure_url || data?.img
                      ? "Photo uploaded successfully (Click to change)"
                      : "Upload Student Passport Photo"}
                  </span>
                  <p className="text-[11px] text-gray-400">PNG, JPG or WebP up to 5MB</p>
                </div>
              </div>
            );
          }}
        </CldUploadWidget>

        <div className="flex flex-wrap justify-between gap-4 pt-1">
          <InputField
            label="First Name *"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors.name}
          />
          <InputField
            label="Last Name *"
            name="surname"
            defaultValue={data?.surname}
            register={register}
            error={errors.surname}
          />

          {/* Real-time Formatted Aadhar Input */}
          <div className="flex w-full flex-col gap-1.5 md:w-1/4">
            <label className="text-xs font-semibold text-gray-600">Student Aadhar Number</label>
            <input
              type="text"
              name="aadhar"
              value={aadharVal}
              onChange={handleAadharChange}
              placeholder="e.g. 1234 5678 9012"
              maxLength={14}
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 font-mono text-sm tracking-wider shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors?.aadhar?.message && (
              <p className="text-xs text-red-400">{errors.aadhar.message.toString()}</p>
            )}
          </div>

          <InputField
            label="Phone Number"
            name="phone"
            defaultValue={data?.phone}
            register={register}
            error={errors.phone}
            inputProps={{
              placeholder: "e.g. 9876543210",
            }}
          />

          <InputField
            label="Residential Address *"
            name="address"
            defaultValue={data?.address}
            register={register}
            error={errors.address}
          />

          <InputField
            label="Blood Group *"
            name="bloodType"
            defaultValue={data?.bloodType || "O+"}
            register={register}
            error={errors.bloodType}
            inputProps={{
              placeholder: "e.g. A+, B+, O+, AB+",
            }}
          />

          <InputField
            label="Date of Birth *"
            name="birthday"
            defaultValue={
              data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : undefined
            }
            register={register}
            error={errors.birthday}
            type="date"
          />

          {/* Social Category Enum Select */}
          <div className="flex w-full flex-col gap-1.5 md:w-1/4">
            <label className="text-xs font-semibold text-gray-600">Category (Quota/Reservation)</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("category")}
              defaultValue={data?.category || ""}
            >
              <option value="">Select Category...</option>
              <option value="GENERAL">General (GEN)</option>
              <option value="OBC">Other Backward Class (OBC)</option>
              <option value="SC">Scheduled Caste (SC)</option>
              <option value="ST">Scheduled Tribe (ST)</option>
              <option value="EWS">Economically Weaker Section (EWS)</option>
              <option value="MINORITY">Minority</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.category?.message && (
              <p className="text-xs text-red-400">{errors.category.message.toString()}</p>
            )}
          </div>

          {/* Religion Enum Select */}
          <div className="flex w-full flex-col gap-1.5 md:w-1/4">
            <label className="text-xs font-semibold text-gray-600">Religion</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              {...register("religion")}
              defaultValue={data?.religion || ""}
            >
              <option value="">Select Religion...</option>
              <option value="HINDU">Hindu</option>
              <option value="MUSLIM">Muslim</option>
              <option value="CHRISTIAN">Christian</option>
              <option value="SIKH">Sikh</option>
              <option value="BUDDHIST">Buddhist</option>
              <option value="JAIN">Jain</option>
              <option value="PARSI">Parsi</option>
              <option value="JEWISH">Jewish</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.religion?.message && (
              <p className="text-xs text-red-400">{errors.religion.message.toString()}</p>
            )}
          </div>

          {/* Caste Master Select */}
          <SearchableSelect
            label="Caste"
            name="casteId"
            options={casteOptions}
            defaultValue={selectedCasteId}
            error={errors.casteId}
            setValue={handleCasteChange}
            className="w-full md:w-1/4"
          />

          <div className="flex w-full flex-col gap-1.5 md:w-1/4">
            <label className="text-xs font-semibold text-gray-600">Gender *</label>
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
        </div>
      </div>

      {/* STEP 4: ACADEMIC ALLOCATION (Grade & Section) */}
      <div className="flex flex-wrap justify-between gap-4 pt-1">
        {/* Filterable Select for Grade */}
        <SearchableSelect
          label="Academic Grade Level *"
          name="gradeId"
          options={gradeOptions}
          defaultValue={selectedGrade}
          placeholder=""
          error={errors.gradeId}
          setValue={handleGradeChange}
          className="w-full md:w-[48%]"
        />

        {/* Filterable Select for Class */}
        <SearchableSelect
          label="Class Section *"
          name="classId"
          options={classOptions}
          defaultValue={selectedClass}
          placeholder={
            selectedGrade ? `Select from ${classOptions.length} sections in Grade...` : ""
          }
          error={errors.classId}
          setValue={handleClassChange}
          className="w-full md:w-[48%]"
        />
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

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
          {state.message || "Failed to process student record. Please verify all details."}
        </div>
      )}

      <button
        type="submit"
        className="rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.99]"
      >
        {type === "create" ? "Confirm & Admit Student" : "Save Changes"}
      </button>
    </form>
  );
};

export default StudentForm;
