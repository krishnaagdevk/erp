import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@/lib/auth";
import { serializePlain } from "@/lib/utils";
import {
  getClassOptions,
  getGradeOptions,
  getParentOptions,
  getStudentOptions,
  getSubjectOptions,
  getTeacherOptions,
  getCasteOptions,
} from "@/lib/queries";

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
    | "fee"
    | "caste";
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
      const subjectTeachers = await getTeacherOptions();
      relatedData = { teachers: subjectTeachers };
      break;
    case "class":
      const [classGrades, classTeachers] = await Promise.all([
        getGradeOptions(),
        getTeacherOptions(),
      ]);
      relatedData = { teachers: classTeachers, grades: classGrades };
      break;
    case "teacher":
      const teacherSubjects = await getSubjectOptions();
      relatedData = { subjects: teacherSubjects };
      break;
    case "student":
      const [studentGrades, studentClasses, studentParents, studentCastes] = await Promise.all([
        getGradeOptions(),
        prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        }),
        getParentOptions(),
        getCasteOptions(),
      ]);
      relatedData = {
        classes: studentClasses,
        grades: studentGrades,
        parents: studentParents,
        castes: studentCastes,
      };
      break;
    case "parent":
      relatedData = {};
      break;
    case "caste":
      relatedData = {};
      break;
    case "lesson":
      const [lessonSubjects, lessonClasses, lessonTeachers] = await Promise.all([
        getSubjectOptions(),
        getClassOptions(),
        getTeacherOptions(),
      ]);
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
      const eventClasses = await getClassOptions();
      relatedData = { classes: eventClasses };
      break;
    case "announcement":
      const announcementClasses =
        role === "teacher" && currentUserId
          ? await prisma.class.findMany({
              where: {
                OR: [
                  { supervisorId: currentUserId },
                  { lessons: { some: { teacherId: currentUserId } } },
                ],
              },
              select: { id: true, name: true },
              orderBy: { name: "asc" },
            })
          : await getClassOptions();
      relatedData = { classes: announcementClasses };
      break;
    case "fee":
      const feeStudents = await getStudentOptions();
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
