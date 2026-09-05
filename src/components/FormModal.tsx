"use client";

import {
  deleteAccountant,
  deleteAnnouncement,
  deleteAssignment,
  deleteCaste,
  deleteClass,
  deleteEvent,
  deleteExam,
  deleteFee,
  deleteLesson,
  deleteParent,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { Dispatch, SetStateAction, useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const deleteActionMap: Partial<Record<FormContainerProps["table"], any>> = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  parent: deleteParent,
  accountant: deleteAccountant,
  lesson: deleteLesson,
  assignment: deleteAssignment,
  exam: deleteExam,
  event: deleteEvent,
  announcement: deleteAnnouncement,
  fee: deleteFee,
  caste: deleteCaste,
};

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AccountantForm = dynamic(() => import("./forms/AccountantForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});
const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});
const FeeForm = dynamic(() => import("./forms/FeeForm"), {
  loading: () => <h1>Loading...</h1>,
});
const CasteForm = dynamic(() => import("./forms/CasteForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => React.JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  accountant: (setOpen, type, data, relatedData) => (
    <AccountantForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  fee: (setOpen, type, data, relatedData) => (
    <FeeForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  caste: (setOpen, type, data, relatedData) => (
    <CasteForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create" ? "bg-lamaYellow" : type === "update" ? "bg-lamaSky" : "bg-lamaPurple";

  const [open, setOpen] = useState(false);

  const Form = () => {
    const action = deleteActionMap[table];

    const [state, formAction] = useActionState(
      action ||
        (async () => ({
          success: false,
          error: true,
          message: "Action not supported.",
        })),
      {
        success: false,
        error: false,
        message: "",
      }
    );

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      } else if (state.error && state.message) {
        toast.error(state.message);
      }
    }, [state, router]);

    if (type === "delete") {
      if (!action) {
        return (
          <div className="p-4 text-center font-medium text-red-600">
            Delete is not supported for {table}.
          </div>
        );
      }

      return (
        <form action={formAction} className="flex flex-col gap-4 p-4">
          <input type="text" name="id" value={String(id)} hidden readOnly />
          <span className="text-center font-medium">
            All data will be lost. Are you sure you want to delete this {table}?
          </span>
          <button className="w-max self-center rounded-md border-none bg-red-700 px-4 py-2 text-white">
            Delete
          </button>
        </form>
      );
    }

    return (type === "create" || type === "update") && forms[table] ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      <div className="p-4 text-center font-medium">Form not found!</div>
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6">
          <div className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-2xl lg:max-w-3xl">
            <Form />
            <div
              className="absolute right-4 top-4 cursor-pointer rounded-full p-1 transition-colors hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="close" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
