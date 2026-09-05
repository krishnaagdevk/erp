import { z } from "zod";

const parseDateInput = (val: unknown): Date => {
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    // Support DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(NaN);
};

const dateFieldSchema = (message: string) =>
  z.preprocess(
    parseDateInput,
    z.date({ message }).refine((d) => !isNaN(d.getTime()), { message })
  );

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Class name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: dateFieldSchema("Birthday is required!"),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(30, { message: "Username must be at most 30 characters long!" })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  aadhar: z
    .string()
    .regex(/^$|^(\d{4}\s\d{4}\s\d{4}|\d{12})$/, {
      message: "Aadhar number must be exactly 12 digits (e.g. 1234 5678 9012)!",
    })
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, { message: "Address is required!" }),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: dateFieldSchema("Birthday is required!"),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  category: z
    .enum(["GENERAL", "OBC", "SC", "ST", "EWS", "MINORITY", "OTHER"])
    .optional()
    .nullable(),
  religion: z
    .enum(["HINDU", "MUSLIM", "CHRISTIAN", "SIKH", "BUDDHIST", "JAIN", "PARSI", "JEWISH", "OTHER"])
    .optional()
    .nullable(),
  casteId: z.coerce.number().optional().nullable(),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const casteSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Caste name is required!" }),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export type CasteSchema = z.infer<typeof casteSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional().or(z.literal("")),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  phone: z
    .string()
    .min(10, { message: "Valid 10-digit mobile number is required!" })
    .max(15, { message: "Phone number is too long!" })
    .regex(/^[0-9+\-\s]+$/, { message: "Invalid phone number format!" }),
  aadhar: z
    .string()
    .regex(/^$|^(\d{4}\s\d{4}\s\d{4}|\d{12})$/, {
      message: "Aadhar number must be exactly 12 digits (e.g. 1234 5678 9012)!",
    })
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, { message: "Address is required!" }),
  students: z.array(z.string()).optional(), // student IDs to connect
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const accountantSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z.string().email({ message: "Invalid email address!" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  img: z.string().optional(),
});

export type AccountantSchema = z.infer<typeof accountantSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Lesson name is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], {
    message: "Day of week is required!",
  }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const assignmentSubmissionSchema = z.object({
  assignmentId: z.coerce.number({ message: "Assignment ID is required!" }),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type AssignmentSubmissionSchema = z.infer<typeof assignmentSubmissionSchema>;

export const assignmentGradeSchema = z.object({
  submissionId: z.coerce.number({ message: "Submission ID is required!" }),
  score: z.coerce.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  status: z.enum(["PENDING", "SUBMITTED", "GRADED", "LATE"]).default("GRADED"),
});

export type AssignmentGradeSchema = z.infer<typeof assignmentGradeSchema>;

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  classId: z.preprocess(
    (val) =>
      val === "" || val === "0" || val === 0 || val === undefined || val === null
        ? null
        : Number(val),
    z.number().nullable().optional()
  ),
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  date: z.coerce.date({ message: "Date is required!" }),
  classId: z.preprocess(
    (val) =>
      val === "" || val === "0" || val === 0 || val === undefined || val === null
        ? null
        : Number(val),
    z.number().nullable().optional()
  ),
  teacherId: z.string().optional(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const feeSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Fee title is required!" }),
  feeType: z.enum([
    "TUITION",
    "TRANSPORT",
    "EXAM",
    "ADMISSION",
    "ANNUAL",
    "LAB_LIBRARY",
    "HOSTEL",
    "OTHER",
  ]),
  amount: z.coerce.number().min(1, { message: "Amount must be greater than 0!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  academicYear: z.string().optional(),
  studentId: z.string().min(1, { message: "Student is required!" }),
});

export type FeeSchema = z.infer<typeof feeSchema>;

export const feePaymentSchema = z.object({
  feeId: z.coerce.number({ message: "Fee invoice is required!" }),
  amount: z.coerce.number().min(1, { message: "Payment amount must be greater than 0!" }),
  paymentDate: z.coerce.date().optional(),
  paymentMethod: z.enum(["CASH", "UPI_ONLINE", "CARD", "BANK_TRANSFER", "CHEQUE"]),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
  recordedBy: z.string().optional(),
});

export type FeePaymentSchema = z.infer<typeof feePaymentSchema>;

export const idFormatConfigSchema = z.object({
  studentIdPrefix: z.string().min(1, { message: "Student prefix is required!" }).max(10),
  studentIdYear: z.boolean().default(true),
  studentIdDigits: z.coerce.number().min(2).max(8),
  studentIdFormat: z.string().min(3, { message: "Student ID format is required!" }),

  teacherIdPrefix: z.string().min(1, { message: "Teacher prefix is required!" }).max(10),
  teacherIdYear: z.boolean().default(true),
  teacherIdDigits: z.coerce.number().min(2).max(8),
  teacherIdFormat: z.string().min(3, { message: "Teacher ID format is required!" }),

  parentIdPrefix: z.string().min(1, { message: "Parent prefix is required!" }).max(10),
  parentIdDigits: z.coerce.number().min(2).max(8),
  parentIdFormat: z.string().min(3, { message: "Parent ID format is required!" }),
});

export type IdFormatConfigSchema = z.infer<typeof idFormatConfigSchema>;
