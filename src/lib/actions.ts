"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  accountantSchema,
  AccountantSchema,
  announcementSchema,
  AnnouncementSchema,
  assignmentSchema,
  AssignmentSchema,
  classSchema,
  ClassSchema,
  eventSchema,
  EventSchema,
  examSchema,
  ExamSchema,
  feePaymentSchema,
  FeePaymentSchema,
  feeSchema,
  FeeSchema,
  lessonSchema,
  LessonSchema,
  parentSchema,
  ParentSchema,
  studentSchema,
  StudentSchema,
  subjectSchema,
  SubjectSchema,
  teacherSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { hashPassword } from "./auth";
import { requireRole } from "./guard";

type CurrentState = { success: boolean; error: boolean; message?: string };

// ==========================================
// SUBJECT ACTIONS
// ==========================================

export const createSubject = async (currentState: CurrentState, data: SubjectSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = subjectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid subject data." };
    }

    const created = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        teachers: {
          connect: parsed.data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Subject",
        entityId: String(created.id),
        details: JSON.stringify({ name: created.name }),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createSubject error:", err);
    return { success: false, error: true, message: err.message || "Failed to create subject." };
  }
};

export const updateSubject = async (currentState: CurrentState, data: SubjectSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = subjectSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Invalid subject data." };
    }

    const updated = await prisma.subject.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        teachers: {
          set: parsed.data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Subject",
        entityId: String(updated.id),
        details: JSON.stringify({ name: updated.name }),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateSubject error:", err);
    return { success: false, error: true, message: err.message || "Failed to update subject." };
  }
};

export const deleteSubject = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin");
    const id = data.get("id") as string;
    const subjectId = parseInt(id);
    if (isNaN(subjectId)) {
      return { success: false, error: true, message: "Invalid subject ID." };
    }

    await prisma.$transaction([
      prisma.result.deleteMany({
        where: {
          OR: [{ exam: { lesson: { subjectId } } }, { assignment: { lesson: { subjectId } } }],
        },
      }),
      prisma.attendance.deleteMany({ where: { lesson: { subjectId } } }),
      prisma.exam.deleteMany({ where: { lesson: { subjectId } } }),
      prisma.assignment.deleteMany({ where: { lesson: { subjectId } } }),
      prisma.lesson.deleteMany({ where: { subjectId } }),
      prisma.subject.delete({
        where: { id: subjectId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "DELETE",
          entity: "Subject",
          entityId: String(subjectId),
        },
      }),
    ]);

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteSubject error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete subject." };
  }
};

// ==========================================
// CLASS ACTIONS
// ==========================================

export const createClass = async (currentState: CurrentState, data: ClassSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = classSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid class data." };
    }

    const created = await prisma.class.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Class",
        entityId: String(created.id),
        details: JSON.stringify(parsed.data),
      },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createClass error:", err);
    return { success: false, error: true, message: err.message || "Failed to create class." };
  }
};

export const updateClass = async (currentState: CurrentState, data: ClassSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = classSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Invalid class data." };
    }

    const updated = await prisma.class.update({
      where: { id: parsed.data.id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Class",
        entityId: String(updated.id),
        details: JSON.stringify(parsed.data),
      },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateClass error:", err);
    return { success: false, error: true, message: err.message || "Failed to update class." };
  }
};

export const deleteClass = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin");
    const id = data.get("id") as string;
    const classId = parseInt(id);
    if (isNaN(classId)) {
      return { success: false, error: true, message: "Invalid class ID." };
    }

    await prisma.$transaction([
      prisma.event.deleteMany({ where: { classId } }),
      prisma.announcement.deleteMany({ where: { classId } }),
      prisma.result.deleteMany({
        where: {
          OR: [
            { exam: { lesson: { classId } } },
            { assignment: { lesson: { classId } } },
            { student: { classId } },
          ],
        },
      }),
      prisma.attendance.deleteMany({
        where: {
          OR: [{ lesson: { classId } }, { student: { classId } }],
        },
      }),
      prisma.exam.deleteMany({ where: { lesson: { classId } } }),
      prisma.assignment.deleteMany({ where: { lesson: { classId } } }),
      prisma.lesson.deleteMany({ where: { classId } }),
      prisma.student.deleteMany({ where: { classId } }),
      prisma.class.delete({
        where: { id: classId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "DELETE",
          entity: "Class",
          entityId: String(classId),
        },
      }),
    ]);

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteClass error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete class." };
  }
};

// ==========================================
// TEACHER ACTIONS
// ==========================================

export const createTeacher = async (currentState: CurrentState, data: TeacherSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = teacherSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid teacher data." };
    }

    const rawPassword = parsed.data.password || "teacher123";
    const hashedPassword = await hashPassword(rawPassword);

    const created = await prisma.teacher.create({
      data: {
        username: parsed.data.username,
        password: hashedPassword,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address,
        img: parsed.data.img || null,
        bloodType: parsed.data.bloodType,
        sex: parsed.data.sex,
        birthday: parsed.data.birthday,
        subjects: {
          connect: parsed.data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Teacher",
        entityId: created.id,
        details: JSON.stringify({ username: created.username, name: created.name }),
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createTeacher error:", err);
    return { success: false, error: true, message: err.message || "Failed to create teacher." };
  }
};

export const updateTeacher = async (currentState: CurrentState, data: TeacherSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = teacherSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Invalid teacher data." };
    }

    let hashedPassword: string | undefined = undefined;
    if (parsed.data.password && parsed.data.password.trim() !== "") {
      hashedPassword = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.teacher.update({
      where: { id: parsed.data.id },
      data: {
        ...(hashedPassword && { password: hashedPassword }),
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address,
        img: parsed.data.img || null,
        bloodType: parsed.data.bloodType,
        sex: parsed.data.sex,
        birthday: parsed.data.birthday,
        subjects: {
          set: parsed.data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Teacher",
        entityId: updated.id,
        details: JSON.stringify({ username: updated.username }),
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateTeacher error:", err);
    return { success: false, error: true, message: err.message || "Failed to update teacher." };
  }
};

export const deleteTeacher = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin");
    const id = data.get("id") as string;
    if (!id) {
      return { success: false, error: true, message: "Invalid teacher ID." };
    }

    await prisma.$transaction([
      prisma.class.updateMany({
        where: { supervisorId: id },
        data: { supervisorId: null },
      }),
      prisma.result.deleteMany({
        where: {
          OR: [
            { exam: { lesson: { teacherId: id } } },
            { assignment: { lesson: { teacherId: id } } },
          ],
        },
      }),
      prisma.exam.deleteMany({ where: { lesson: { teacherId: id } } }),
      prisma.assignment.deleteMany({ where: { lesson: { teacherId: id } } }),
      prisma.attendance.deleteMany({ where: { lesson: { teacherId: id } } }),
      prisma.lesson.deleteMany({ where: { teacherId: id } }),
      prisma.teacher.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "DELETE",
          entity: "Teacher",
          entityId: id,
        },
      }),
    ]);

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteTeacher error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete teacher." };
  }
};

// ==========================================
// STUDENT ACTIONS
// ==========================================

export const createStudent = async (currentState: CurrentState, data: StudentSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = studentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid student data." };
    }

    const classItem = await prisma.class.findUnique({
      where: { id: parsed.data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem._count.students >= classItem.capacity) {
      return { success: false, error: true, message: "Class capacity reached!" };
    }

    const rawPassword = parsed.data.password || "student123";
    const hashedPassword = await hashPassword(rawPassword);

    const created = await prisma.student.create({
      data: {
        username: parsed.data.username,
        password: hashedPassword,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address,
        img: parsed.data.img || null,
        bloodType: parsed.data.bloodType,
        sex: parsed.data.sex,
        birthday: parsed.data.birthday,
        gradeId: parsed.data.gradeId,
        classId: parsed.data.classId,
        parentId: parsed.data.parentId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Student",
        entityId: created.id,
        details: JSON.stringify({ username: created.username }),
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createStudent error:", err);
    return { success: false, error: true, message: err.message || "Failed to create student." };
  }
};

export const updateStudent = async (currentState: CurrentState, data: StudentSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = studentSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Invalid student data." };
    }

    let hashedPassword: string | undefined = undefined;
    if (parsed.data.password && parsed.data.password.trim() !== "") {
      hashedPassword = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.student.update({
      where: { id: parsed.data.id },
      data: {
        ...(hashedPassword && { password: hashedPassword }),
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address,
        img: parsed.data.img || null,
        bloodType: parsed.data.bloodType,
        sex: parsed.data.sex,
        birthday: parsed.data.birthday,
        gradeId: parsed.data.gradeId,
        classId: parsed.data.classId,
        parentId: parsed.data.parentId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Student",
        entityId: updated.id,
        details: JSON.stringify({ username: updated.username }),
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateStudent error:", err);
    return { success: false, error: true, message: err.message || "Failed to update student." };
  }
};

export const deleteStudent = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin");
    const id = data.get("id") as string;
    if (!id) {
      return { success: false, error: true, message: "Invalid student ID." };
    }

    // Protect financial ledger: check if student has fee records
    const feeCount = await prisma.fee.count({
      where: { studentId: id },
    });
    if (feeCount > 0) {
      return {
        success: false,
        error: true,
        message:
          "Cannot delete student with associated financial or fee history. Consider soft deletion.",
      };
    }

    await prisma.$transaction([
      prisma.result.deleteMany({ where: { studentId: id } }),
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "DELETE",
          entity: "Student",
          entityId: id,
        },
      }),
    ]);

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteStudent error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete student." };
  }
};

// ==========================================
// EXAM ACTIONS
// ==========================================

export const createExam = async (currentState: CurrentState, data: ExamSchema) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const parsed = examSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid exam data." };
    }

    const created = await prisma.exam.create({
      data: {
        title: parsed.data.title,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        lessonId: parsed.data.lessonId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Exam",
        entityId: String(created.id),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createExam error:", err);
    return { success: false, error: true, message: err.message || "Failed to create exam." };
  }
};

export const updateExam = async (currentState: CurrentState, data: ExamSchema) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const parsed = examSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Invalid exam data." };
    }

    const updated = await prisma.exam.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        lessonId: parsed.data.lessonId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Exam",
        entityId: String(updated.id),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateExam error:", err);
    return { success: false, error: true, message: err.message || "Failed to update exam." };
  }
};

export const deleteExam = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const id = data.get("id") as string;
    const examId = parseInt(id);
    if (isNaN(examId)) {
      return { success: false, error: true, message: "Invalid exam ID." };
    }

    await prisma.$transaction([
      prisma.result.deleteMany({ where: { examId } }),
      prisma.exam.delete({ where: { id: examId } }),
      prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "DELETE",
          entity: "Exam",
          entityId: String(examId),
        },
      }),
    ]);

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteExam error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete exam." };
  }
};

// ==========================================
// ANNOUNCEMENT ACTIONS
// ==========================================

export const createAnnouncement = async (currentState: CurrentState, data: AnnouncementSchema) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const parsed = announcementSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid announcement data." };
    }

    const classId = parsed.data.classId && parsed.data.classId > 0 ? parsed.data.classId : null;
    const created = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        date: parsed.data.date,
        classId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Announcement",
        entityId: String(created.id),
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createAnnouncement error:", err);
    return {
      success: false,
      error: true,
      message: err.message || "Failed to create announcement.",
    };
  }
};

export const updateAnnouncement = async (currentState: CurrentState, data: AnnouncementSchema) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const parsed = announcementSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Invalid announcement data." };
    }

    const classId = parsed.data.classId && parsed.data.classId > 0 ? parsed.data.classId : null;
    const updated = await prisma.announcement.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        date: parsed.data.date,
        classId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Announcement",
        entityId: String(updated.id),
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateAnnouncement error:", err);
    return {
      success: false,
      error: true,
      message: err.message || "Failed to update announcement.",
    };
  }
};

export const deleteAnnouncement = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const id = data.get("id") as string;
    const announcementId = parseInt(id);
    if (isNaN(announcementId)) {
      return { success: false, error: true, message: "Invalid announcement ID." };
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Announcement",
        entityId: String(announcementId),
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteAnnouncement error:", err);
    return {
      success: false,
      error: true,
      message: err.message || "Failed to delete announcement.",
    };
  }
};

// ==========================================
// FEE ACTIONS (FINANCIAL MODULE)
// ==========================================

export const createFee = async (currentState: CurrentState, data: FeeSchema) => {
  try {
    const actor = await requireRole("admin", "accountant");
    const parsed = feeSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid fee data." };
    }

    const isPastDue = new Date(parsed.data.dueDate) < new Date();

    const fee = await prisma.fee.create({
      data: {
        title: parsed.data.title,
        feeType: parsed.data.feeType,
        amount: parsed.data.amount,
        paidAmount: 0,
        dueDate: parsed.data.dueDate,
        academicYear: parsed.data.academicYear || "2024-2025",
        studentId: parsed.data.studentId,
        status: isPastDue ? "OVERDUE" : "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Fee",
        entityId: String(fee.id),
        details: JSON.stringify({ amount: parsed.data.amount, studentId: parsed.data.studentId }),
      },
    });

    revalidatePath("/list/fees");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createFee error:", err);
    return { success: false, error: true, message: err.message || "Failed to create fee record." };
  }
};

export const updateFee = async (currentState: CurrentState, data: FeeSchema) => {
  try {
    const actor = await requireRole("admin", "accountant");
    const parsed = feeSchema.safeParse(data);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Fee ID is required." };
    }

    const existing = await prisma.fee.findUnique({
      where: { id: parsed.data.id },
      include: { payments: true },
    });

    if (!existing) {
      return { success: false, error: true, message: "Fee record not found." };
    }
    const existingPaid = Number(existing.paidAmount);
    const newAmount = Number(parsed.data.amount);

    // Financial integrity: cannot reassign student or lower amount below already paid amount
    if (existing.payments.length > 0) {
      if (existing.studentId !== parsed.data.studentId) {
        return {
          success: false,
          error: true,
          message: "Cannot reassign student for an invoice with existing payment receipts.",
        };
      }
      if (newAmount < existingPaid) {
        return {
          success: false,
          error: true,
          message: `Cannot reduce fee amount below already paid amount of ₹${existingPaid.toFixed(2)}. Issue a credit note or refund instead.`,
        };
      }
    }

    let status = existing.status;
    if (existingPaid >= newAmount) {
      status = "PAID";
    } else if (existingPaid > 0) {
      status = "PARTIAL";
    } else {
      status = new Date(parsed.data.dueDate) < new Date() ? "OVERDUE" : "PENDING";
    }

    const updated = await prisma.fee.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        feeType: parsed.data.feeType,
        amount: newAmount,
        dueDate: parsed.data.dueDate,
        academicYear: parsed.data.academicYear || existing.academicYear,
        studentId: parsed.data.studentId,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Fee",
        entityId: String(updated.id),
        details: JSON.stringify({ amount: parsed.data.amount }),
      },
    });

    revalidatePath("/list/fees");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateFee error:", err);
    return { success: false, error: true, message: err.message || "Failed to update fee record." };
  }
};

export const deleteFee = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin", "accountant");
    const id = data.get("id") as string;
    const feeId = parseInt(id);
    if (isNaN(feeId)) {
      return { success: false, error: true, message: "Invalid fee ID." };
    }

    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: { payments: true },
    });

    if (!fee) {
      return { success: false, error: true, message: "Fee record not found." };
    }

    if (fee.payments.length > 0 || fee.paidAmount.gt(0)) {
      return {
        success: false,
        error: true,
        message:
          "Cannot delete fee invoice with payment receipts. Financial records must be preserved for audit.",
      };
    }

    await prisma.fee.delete({
      where: { id: feeId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Fee",
        entityId: String(feeId),
      },
    });

    revalidatePath("/list/fees");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteFee error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete fee record." };
  }
};

export const recordFeePayment = async (currentState: CurrentState, data: FeePaymentSchema) => {
  try {
    const actor = await requireRole("admin", "accountant");
    const parsed = feePaymentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid payment data." };
    }

    const paymentAmount = Number(parsed.data.amount);
    const fiscalYear = new Date().getFullYear();

    // Atomic CAS Transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const fee = await tx.fee.findUnique({
        where: { id: parsed.data.feeId },
      });

      if (!fee) {
        throw new Error("Fee record not found.");
      }

      const currentAmount = Number(fee.amount);
      const currentPaid = Number(fee.paidAmount);
      const balance = currentAmount - currentPaid;

      if (paymentAmount > balance) {
        throw new Error(
          `Payment of ₹${paymentAmount.toFixed(2)} exceeds remaining balance of ₹${balance.toFixed(2)}`
        );
      }

      const newPaidAmount = currentPaid + paymentAmount;
      const newStatus = newPaidAmount >= currentAmount ? "PAID" : "PARTIAL";

      // Concurrency guard: update only if paidAmount has not changed since reading
      const updateCount = await tx.fee.updateMany({
        where: {
          id: fee.id,
          paidAmount: fee.paidAmount,
        },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      if (updateCount.count === 0) {
        throw new Error(
          "CONCURRENT_MODIFICATION: Another payment was processed concurrently. Please try again."
        );
      }

      // Create payment placeholder
      const payment = await tx.feePayment.create({
        data: {
          receiptNo: `PENDING-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          feeId: fee.id,
          amount: paymentAmount,
          paymentDate: parsed.data.paymentDate || new Date(),
          paymentMethod: parsed.data.paymentMethod,
          transactionId: parsed.data.transactionId || null,
          remarks: parsed.data.remarks || null,
          recordedBy: actor.name ? `${actor.name} (${actor.username})` : actor.username,
        },
      });

      // Monotonic, unique, collision-free receipt number derived from PK
      const finalReceiptNo = `REC-${fiscalYear}-${String(payment.id).padStart(6, "0")}`;
      await tx.feePayment.update({
        where: { id: payment.id },
        data: { receiptNo: finalReceiptNo },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "RECORD_PAYMENT",
          entity: "FeePayment",
          entityId: String(payment.id),
          details: JSON.stringify({
            receiptNo: finalReceiptNo,
            feeId: fee.id,
            amount: paymentAmount.toString(),
            method: parsed.data.paymentMethod,
          }),
        },
      });

      return { receiptNo: finalReceiptNo, amount: paymentAmount.toString() };
    });

    revalidatePath("/list/fees");
    revalidatePath("/admin");
    return {
      success: true,
      error: false,
      message: `Payment of ₹${result.amount} recorded successfully. Receipt #${result.receiptNo}`,
    };
  } catch (err: any) {
    console.error("recordFeePayment error:", err);
    return {
      success: false,
      error: true,
      message: err.message || "Failed to record payment.",
    };
  }
};

export const deleteFeePayment = async (currentState: CurrentState, data: FormData) => {
  try {
    const actor = await requireRole("admin", "accountant");
    const id = data.get("id") as string;
    const paymentId = parseInt(id);
    if (isNaN(paymentId)) {
      return { success: false, error: true, message: "Invalid payment ID." };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payment = await tx.feePayment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error("Payment record not found.");
      }

      const fee = await tx.fee.findUnique({
        where: { id: payment.feeId },
      });

      if (fee) {
        const feeAmount = Number(fee.amount);
        const paymentAmount = Number(payment.amount);
        const currentPaid = Number(fee.paidAmount);
        const rawNewPaid = currentPaid - paymentAmount;
        const newPaidAmount = Math.max(0, rawNewPaid);

        let newStatus = fee.status;
        if (newPaidAmount >= feeAmount) {
          newStatus = "PAID";
        } else if (newPaidAmount > 0) {
          newStatus = "PARTIAL";
        } else {
          newStatus = new Date(fee.dueDate) < new Date() ? "OVERDUE" : "PENDING";
        }

        await tx.feePayment.delete({
          where: { id: paymentId },
        });

        await tx.fee.update({
          where: { id: fee.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });
      } else {
        await tx.feePayment.delete({
          where: { id: paymentId },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "DELETE_PAYMENT",
          entity: "FeePayment",
          entityId: String(paymentId),
        },
      });
    });

    revalidatePath("/list/fees");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteFeePayment error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete payment." };
  }
};

// ==========================================
// PARENT ACTIONS
// ==========================================

export const createParent = async (currentState: CurrentState, data: ParentSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = parentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid parent data." };
    }

    const hashedPassword = await hashPassword(parsed.data.password || "parent123");

    const created = await prisma.parent.create({
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        address: parsed.data.address,
        password: hashedPassword,
        students: parsed.data.students?.length
          ? {
              connect: parsed.data.students.map((studentId) => ({ id: studentId })),
            }
          : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Parent",
        entityId: created.id,
        details: JSON.stringify({
          name: `${created.name} ${created.surname}`,
          username: created.username,
        }),
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createParent error:", err);
    return { success: false, error: true, message: err.message || "Failed to create parent." };
  }
};

export const updateParent = async (currentState: CurrentState, data: ParentSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Parent ID is missing." };
  }
  try {
    const actor = await requireRole("admin");
    const parsed = parentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid parent data." };
    }

    const updatePayload: any = {
      username: parsed.data.username,
      name: parsed.data.name,
      surname: parsed.data.surname,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      address: parsed.data.address,
      students: parsed.data.students
        ? {
            set: parsed.data.students.map((studentId) => ({ id: studentId })),
          }
        : undefined,
    };

    if (parsed.data.password && parsed.data.password.trim() !== "") {
      updatePayload.password = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.parent.update({
      where: { id: data.id },
      data: updatePayload,
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Parent",
        entityId: updated.id,
        details: JSON.stringify({
          name: `${updated.name} ${updated.surname}`,
          username: updated.username,
        }),
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateParent error:", err);
    return { success: false, error: true, message: err.message || "Failed to update parent." };
  }
};

export const deleteParent = async (currentState: CurrentState, data: FormData) => {
  const id = data.get("id") as string;
  try {
    const actor = await requireRole("admin");

    const studentCount = await prisma.student.count({
      where: { parentId: id },
    });

    if (studentCount > 0) {
      return {
        success: false,
        error: true,
        message: `Cannot delete parent because they are currently assigned to ${studentCount} student(s). Reassign or remove students first.`,
      };
    }

    await prisma.parent.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Parent",
        entityId: id,
      },
    });

    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteParent error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete parent." };
  }
};

// ==========================================
// LESSON ACTIONS
// ==========================================

export const createLesson = async (currentState: CurrentState, data: LessonSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = lessonSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid lesson data." };
    }

    const created = await prisma.lesson.create({
      data: {
        name: parsed.data.name,
        day: parsed.data.day,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        subjectId: parsed.data.subjectId,
        classId: parsed.data.classId,
        teacherId: parsed.data.teacherId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Lesson",
        entityId: String(created.id),
        details: JSON.stringify({ name: created.name }),
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createLesson error:", err);
    return { success: false, error: true, message: err.message || "Failed to create lesson." };
  }
};

export const updateLesson = async (currentState: CurrentState, data: LessonSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Lesson ID is missing." };
  }
  try {
    const actor = await requireRole("admin");
    const parsed = lessonSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid lesson data." };
    }

    const updated = await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: parsed.data.name,
        day: parsed.data.day,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        subjectId: parsed.data.subjectId,
        classId: parsed.data.classId,
        teacherId: parsed.data.teacherId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Lesson",
        entityId: String(updated.id),
        details: JSON.stringify({ name: updated.name }),
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateLesson error:", err);
    return { success: false, error: true, message: err.message || "Failed to update lesson." };
  }
};

export const deleteLesson = async (currentState: CurrentState, data: FormData) => {
  const id = parseInt(data.get("id") as string);
  try {
    const actor = await requireRole("admin");

    await prisma.attendance.deleteMany({ where: { lessonId: id } });
    await prisma.result.deleteMany({
      where: {
        OR: [{ exam: { lessonId: id } }, { assignment: { lessonId: id } }],
      },
    });
    await prisma.exam.deleteMany({ where: { lessonId: id } });
    await prisma.assignment.deleteMany({ where: { lessonId: id } });

    await prisma.lesson.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Lesson",
        entityId: String(id),
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteLesson error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete lesson." };
  }
};

// ==========================================
// ASSIGNMENT ACTIONS
// ==========================================

export const createAssignment = async (currentState: CurrentState, data: AssignmentSchema) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const parsed = assignmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid assignment data." };
    }

    const created = await prisma.assignment.create({
      data: {
        title: parsed.data.title,
        startDate: parsed.data.startDate,
        dueDate: parsed.data.dueDate,
        lessonId: parsed.data.lessonId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Assignment",
        entityId: String(created.id),
        details: JSON.stringify({ title: created.title }),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createAssignment error:", err);
    return { success: false, error: true, message: err.message || "Failed to create assignment." };
  }
};

export const updateAssignment = async (currentState: CurrentState, data: AssignmentSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Assignment ID is missing." };
  }
  try {
    const actor = await requireRole("admin", "teacher");
    const parsed = assignmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid assignment data." };
    }

    const updated = await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: parsed.data.title,
        startDate: parsed.data.startDate,
        dueDate: parsed.data.dueDate,
        lessonId: parsed.data.lessonId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Assignment",
        entityId: String(updated.id),
        details: JSON.stringify({ title: updated.title }),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateAssignment error:", err);
    return { success: false, error: true, message: err.message || "Failed to update assignment." };
  }
};

export const deleteAssignment = async (currentState: CurrentState, data: FormData) => {
  const id = parseInt(data.get("id") as string);
  try {
    const actor = await requireRole("admin", "teacher");

    await prisma.result.deleteMany({ where: { assignmentId: id } });
    await prisma.assignment.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Assignment",
        entityId: String(id),
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteAssignment error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete assignment." };
  }
};

// ==========================================
// EVENT ACTIONS
// ==========================================

export const createEvent = async (currentState: CurrentState, data: EventSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid event data." };
    }

    const created = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        classId: parsed.data.classId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Event",
        entityId: String(created.id),
        details: JSON.stringify({ title: created.title }),
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createEvent error:", err);
    return { success: false, error: true, message: err.message || "Failed to create event." };
  }
};

export const updateEvent = async (currentState: CurrentState, data: EventSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Event ID is missing." };
  }
  try {
    const actor = await requireRole("admin");
    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid event data." };
    }

    const updated = await prisma.event.update({
      where: { id: data.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        classId: parsed.data.classId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Event",
        entityId: String(updated.id),
        details: JSON.stringify({ title: updated.title }),
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateEvent error:", err);
    return { success: false, error: true, message: err.message || "Failed to update event." };
  }
};

export const deleteEvent = async (currentState: CurrentState, data: FormData) => {
  const id = parseInt(data.get("id") as string);
  try {
    const actor = await requireRole("admin");

    await prisma.event.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Event",
        entityId: String(id),
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteEvent error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete event." };
  }
};

// ==========================================
// ACCOUNTANT ACTIONS
// ==========================================

export const createAccountant = async (currentState: CurrentState, data: AccountantSchema) => {
  try {
    const actor = await requireRole("admin");
    const parsed = accountantSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid accountant data." };
    }

    // Check unique username, email, phone
    const existingUsername = await prisma.accountant.findUnique({
      where: { username: parsed.data.username },
    });
    if (existingUsername) {
      return { success: false, error: true, message: "Username already taken." };
    }

    if (parsed.data.email) {
      const existingEmail = await prisma.accountant.findUnique({
        where: { email: parsed.data.email },
      });
      if (existingEmail) {
        return { success: false, error: true, message: "Email already in use." };
      }
    }

    if (parsed.data.phone) {
      const existingPhone = await prisma.accountant.findUnique({
        where: { phone: parsed.data.phone },
      });
      if (existingPhone) {
        return { success: false, error: true, message: "Phone number already in use." };
      }
    }

    const hashedPassword = await hashPassword(parsed.data.password || "accountant123");

    const created = await prisma.accountant.create({
      data: {
        username: parsed.data.username,
        password: hashedPassword,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        img: parsed.data.img || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Accountant",
        entityId: created.id,
        details: JSON.stringify({
          username: created.username,
          name: `${created.name} ${created.surname}`,
        }),
      },
    });

    revalidatePath("/list/accountants");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("createAccountant error:", err);
    return { success: false, error: true, message: err.message || "Failed to create accountant." };
  }
};

export const updateAccountant = async (currentState: CurrentState, data: AccountantSchema) => {
  if (!data.id) {
    return { success: false, error: true, message: "Accountant ID is missing." };
  }
  try {
    const actor = await requireRole("admin");
    const parsed = accountantSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: true, message: "Invalid accountant data." };
    }

    const updateData: any = {
      username: parsed.data.username,
      name: parsed.data.name,
      surname: parsed.data.surname,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      img: parsed.data.img || null,
    };

    if (parsed.data.password && parsed.data.password.trim() !== "") {
      updateData.password = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.accountant.update({
      where: { id: data.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Accountant",
        entityId: updated.id,
        details: JSON.stringify({ username: updated.username }),
      },
    });

    revalidatePath("/list/accountants");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("updateAccountant error:", err);
    return { success: false, error: true, message: err.message || "Failed to update accountant." };
  }
};

export const deleteAccountant = async (currentState: CurrentState, data: FormData) => {
  const id = data.get("id") as string;
  try {
    const actor = await requireRole("admin");

    await prisma.accountant.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Accountant",
        entityId: id,
      },
    });

    revalidatePath("/list/accountants");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("deleteAccountant error:", err);
    return { success: false, error: true, message: err.message || "Failed to delete accountant." };
  }
};

// ==========================================
// ATTENDANCE ACTIONS
// ==========================================

export type ClassAttendanceSubmission = {
  lessonId: number;
  date: string;
  records: {
    studentId: string;
    present: boolean;
  }[];
};

export const markClassAttendance = async (
  currentState: CurrentState,
  data: ClassAttendanceSubmission
) => {
  try {
    const actor = await requireRole("admin", "teacher");
    const { lessonId, date, records } = data;

    if (!lessonId || !date || !records || records.length === 0) {
      return { success: false, error: true, message: "Incomplete attendance submission data." };
    }

    // Verify teacher authorization for this lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { class: true },
    });

    if (!lesson) {
      return { success: false, error: true, message: "Lesson not found." };
    }

    if (actor.role === "teacher" && lesson.teacherId !== actor.id) {
      return {
        success: false,
        error: true,
        message: "You are only authorized to mark attendance for your assigned lessons.",
      };
    }

    const attendanceDate = new Date(date);
    // Normalize to start of day UTC/local
    attendanceDate.setHours(0, 0, 0, 0);

    // Upsert all student attendance records atomically
    await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: {
            studentId_lessonId_date: {
              studentId: r.studentId,
              lessonId,
              date: attendanceDate,
            },
          },
          update: {
            present: r.present,
          },
          create: {
            studentId: r.studentId,
            lessonId,
            date: attendanceDate,
            present: r.present,
          },
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "MARK_ATTENDANCE",
        entity: "Attendance",
        entityId: `${lessonId}_${date}`,
        details: JSON.stringify({
          lessonId,
          lessonName: lesson.name,
          classId: lesson.classId,
          date,
          totalStudents: records.length,
          presentCount: records.filter((r) => r.present).length,
        }),
      },
    });

    revalidatePath("/list/attendance");
    revalidatePath("/teacher");
    revalidatePath("/admin");
    revalidatePath("/accountant");
    revalidatePath("/student");
    revalidatePath("/parent");

    return {
      success: true,
      error: false,
      message: `Attendance marked successfully for ${records.length} students!`,
    };
  } catch (err: any) {
    console.error("markClassAttendance error:", err);
    return { success: false, error: true, message: err.message || "Failed to mark attendance." };
  }
};
