"use client";

import { useState, useTransition } from "react";
import { submitAssignment } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";

type SubmissionData = {
  id?: number;
  fileUrl?: string | null;
  notes?: string | null;
  status?: string;
  score?: number | null;
  feedback?: string | null;
  createdAt?: string | Date;
};

export default function AssignmentSubmissionModal({
  assignmentId,
  assignmentTitle,
  subjectName,
  className,
  dueDate,
  existingSubmission,
}: {
  assignmentId: number;
  assignmentTitle: string;
  subjectName: string;
  className: string;
  dueDate: string | Date;
  existingSubmission?: SubmissionData | null;
}) {
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState(existingSubmission?.fileUrl || "");
  const [notes, setNotes] = useState(existingSubmission?.notes || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isDuePassed = new Date() > new Date(dueDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl && !notes) {
      toast.error("Please provide either a submission file link or answer notes.");
      return;
    }

    startTransition(async () => {
      const res = await submitAssignment(
        { success: false, error: false },
        {
          assignmentId,
          fileUrl,
          notes,
        }
      );

      if (res.success) {
        toast.success(res.message || "Assignment submitted successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to submit assignment.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 ${
          existingSubmission
            ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : isDuePassed
              ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {existingSubmission ? (
          <>
            <span>✓</span>
            <span>
              {existingSubmission.status === "GRADED"
                ? `Graded (${existingSubmission.score ?? 0} pts)`
                : "Submitted"}
            </span>
          </>
        ) : (
          <>
            <span>📤</span>
            <span>{isDuePassed ? "Submit Late" : "Submit Homework"}</span>
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl duration-150 sm:p-6">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>

            {/* HEADER */}
            <div className="mb-4 border-b border-gray-100 pb-3">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {subjectName} · {className}
              </span>
              <h2 className="mt-1 text-base font-bold text-gray-900 sm:text-lg">
                {assignmentTitle}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Due:{" "}
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(dueDate))}
              </p>
            </div>

            {/* STATUS BANNER IF ALREADY SUBMITTED */}
            {existingSubmission && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
                <div className="flex items-center justify-between font-semibold">
                  <span>Status: {existingSubmission.status}</span>
                  {existingSubmission.score !== null && existingSubmission.score !== undefined && (
                    <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-900">
                      Score: {existingSubmission.score}/100
                    </span>
                  )}
                </div>
                {existingSubmission.feedback && (
                  <p className="mt-1 rounded-lg border border-emerald-100 bg-white/70 p-2 text-[11px] text-emerald-900">
                    <strong>Teacher Feedback:</strong> {existingSubmission.feedback}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* FILE URL / ATTACHMENT */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Submission File / Document URL:
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://... Link to Google Doc, PDF, Drive or Cloud File"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
                />
                <span className="mt-0.5 block text-[10px] text-gray-400">
                  Paste the shareable link of your homework, PDF document, or slide presentation.
                </span>
              </div>

              {/* NOTES / ANSWERS */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Submission Notes / Text Answer:
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type your notes, solution, or comments for the teacher..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending
                    ? "Submitting..."
                    : existingSubmission
                      ? "Update Submission"
                      : "Submit Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
