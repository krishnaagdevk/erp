"use client";

import { useState, useTransition } from "react";
import { gradeAssignmentSubmission } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";

type StudentInfo = {
  id: string;
  name: string;
  surname: string;
  username: string;
  img?: string | null;
};

type SubmissionItem = {
  id: number;
  assignmentId: number;
  studentId: string;
  fileUrl?: string | null;
  notes?: string | null;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "LATE";
  feedback?: string | null;
  score?: number | null;
  createdAt: string | Date;
  student: StudentInfo;
};

export default function AssignmentSubmissionsDrawer({
  assignmentId,
  assignmentTitle,
  submissions,
  totalStudents,
}: {
  assignmentId: number;
  assignmentTitle: string;
  submissions: SubmissionItem[];
  totalStudents: number;
}) {
  const [open, setOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleOpenGrade = (sub: SubmissionItem) => {
    setSelectedSubmission(sub);
    setScore(sub.score !== null && sub.score !== undefined ? String(sub.score) : "");
    setFeedback(sub.feedback || "");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    startTransition(async () => {
      const parsedScore = score.trim() !== "" ? Number(score) : undefined;
      const res = await gradeAssignmentSubmission(
        { success: false, error: false },
        {
          submissionId: selectedSubmission.id,
          score: parsedScore,
          feedback,
          status: "GRADED",
        }
      );

      if (res.success) {
        toast.success(res.message || "Grade recorded successfully!");
        setSelectedSubmission(null);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to save grade.");
      }
    });
  };

  const submittedCount = submissions.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95"
      >
        <span>📥 Submissions</span>
        <span className="py-0.2 rounded-md bg-blue-200/80 px-1.5 text-[11px] font-bold text-blue-900">
          {submittedCount}/{totalStudents}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="animate-in fade-in zoom-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-150">
            {/* DRAWER HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-gray-800 sm:text-base">
                  Student Submissions: {assignmentTitle}
                </h2>
                <p className="text-xs text-gray-500">
                  {submittedCount} of {totalStudents} enrolled students submitted homework.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {submissions.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-sm font-semibold text-gray-600">No student submissions yet.</p>
                  <p className="mt-1 text-xs">
                    Submissions will appear here once students upload homework.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {/* STUDENT INFO & SUBMISSION DETAILS */}
                      <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                          {sub.student.img ? (
                            <Image src={sub.student.img} alt="" fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-lamaSkyLight text-xs font-bold text-gray-700">
                              {sub.student.name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {sub.student.name} {sub.student.surname}
                          </p>
                          <p className="text-[10px] text-gray-400">@{sub.student.username}</p>
                          <span
                            className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              sub.status === "GRADED"
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === "LATE"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {sub.status === "GRADED"
                              ? `Graded · ${sub.score ?? 0}/100`
                              : sub.status}
                          </span>

                          {sub.notes && (
                            <p className="mt-1.5 max-w-md rounded-md border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600">
                              &ldquo;{sub.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        {sub.fileUrl && (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 shadow-sm hover:bg-gray-50"
                          >
                            <span>📄 View File</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenGrade(sub)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          {sub.status === "GRADED" ? "Edit Grade" : "Grade Work"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INLINE GRADING MODAL OVERLAY */}
            {selectedSubmission && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                  <h3 className="text-sm font-bold text-gray-800">
                    Grade Submission: {selectedSubmission.student.name}{" "}
                    {selectedSubmission.student.surname}
                  </h3>
                  <form onSubmit={handleSaveGrade} className="mt-3 flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Score (0 - 100):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="e.g. 85"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600">
                        Teacher Feedback / Comments:
                      </label>
                      <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Well done, great explanation on question 3..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-medium text-gray-800 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-lamaSky"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(null)}
                        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isPending ? "Saving..." : "Save Score & Feedback"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
