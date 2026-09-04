import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@/lib/auth";
import { serializePlain } from "@/lib/utils";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "accountant"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "fee";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

// Role-based permissions matrix for Form actions
const canPerformAction = (
  role: string | undefined,
  table: string,
  type: "create" | "update" | "delete"
) => {
  if (!role) return false;
  if (role === "admin") return true;

  if (role === "accountant") {
    return table === "fee";
  }

  if (role === "teacher") {
    if (table === "exam" || table === "assignment" || table === "announcement") return true;
    return false;
  }

  return false;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // Authorization check before rendering action buttons
  if (!canPerformAction(role, table, type)) {
    return null;
  }

  if (type === "delete") {
    return (
      <div className="">
        <FormModal table={table} type={type} data={data} id={id} relatedData={{}} />
      </div>
    );
  }

  let relatedData = {};

  switch (table) {
    case "subject":
      const subjectTeachers = await prisma.teacher.findMany({
        select: { id: true, name: true, surname: true },
      });
      relatedData = { teachers: subjectTeachers };
      break;
    case "class":
      const classGrades = await prisma.grade.findMany({
        select: { id: true, level: true },
      });
      const classTeachers = await prisma.teacher.findMany({
        select: { id: true, name: true, surname: true },
      });
      relatedData = { teachers: classTeachers, grades: classGrades };
      break;
    case "teacher":
      const teacherSubjects = await prisma.subject.findMany({
        select: { id: true, name: true },
      });
      relatedData = { subjects: teacherSubjects };
      break;
    case "student":
      const studentGrades = await prisma.grade.findMany({
        select: { id: true, level: true },
      });
      const studentClasses = await prisma.class.findMany({
        include: { _count: { select: { students: true } } },
      });
      const studentParents = await prisma.parent.findMany({
        select: { id: true, name: true, surname: true, username: true, phone: true },
        orderBy: { name: "asc" },
      });
      relatedData = { classes: studentClasses, grades: studentGrades, parents: studentParents };
      break;
    case "parent":
      const parentStudents = await prisma.student.findMany({
        select: { id: true, name: true, surname: true, username: true },
        orderBy: { name: "asc" },
      });
      relatedData = { students: parentStudents };
      break;
    case "lesson":
      const lessonSubjects = await prisma.subject.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      const lessonClasses = await prisma.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      const lessonTeachers = await prisma.teacher.findMany({
        select: { id: true, name: true, surname: true },
        orderBy: { name: "asc" },
      });
      relatedData = { subjects: lessonSubjects, classes: lessonClasses, teachers: lessonTeachers };
      break;
    case "assignment":
      const assignmentLessons = await prisma.lesson.findMany({
        where: {
          ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
        },
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
          teacher: { select: { name: true, surname: true } },
        },
      });
      relatedData = { lessons: assignmentLessons };
      break;
    case "exam":
      const examLessons = await prisma.lesson.findMany({
        where: {
          ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
        },
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
          class: { select: { name: true } },
          teacher: { select: { name: true, surname: true } },
        },
      });
      relatedData = { lessons: examLessons };
      break;
    case "event":
      const eventClasses = await prisma.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      relatedData = { classes: eventClasses };
      break;
    case "announcement":
      const announcementClasses = await prisma.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      relatedData = { classes: announcementClasses };
      break;
    case "fee":
      const feeStudents = await prisma.student.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
          username: true,
          class: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });
      relatedData = { students: feeStudents };
      break;

    default:
      break;
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={serializePlain(data)}
        id={id}
        relatedData={serializePlain(relatedData)}
      />
    </div>
  );
};

export default FormContainer;
