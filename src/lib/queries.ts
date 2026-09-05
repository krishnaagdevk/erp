import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import { getLatestMonday } from "./utils";

// ============================================================================
// GLOBAL LOOKUP QUERIES (Shared dropdowns and filters)
// Revalidated on mutation via revalidateTag, with a 300s TTL backstop.
// ============================================================================

export const getClassOptions = unstable_cache(
  async () => {
    return prisma.class.findMany({
      select: { id: true, name: true, capacity: true, gradeId: true },
      orderBy: { name: "asc" },
    });
  },
  ["class-options"],
  { revalidate: 300, tags: ["classes"] }
);

export const getGradeOptions = unstable_cache(
  async () => {
    return prisma.grade.findMany({
      select: { id: true, level: true },
      orderBy: { level: "asc" },
    });
  },
  ["grade-options"],
  { revalidate: 300, tags: ["grades"] }
);

export const getSubjectOptions = unstable_cache(
  async () => {
    return prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
  ["subject-options"],
  { revalidate: 300, tags: ["subjects"] }
);

export const getTeacherOptions = unstable_cache(
  async () => {
    return prisma.teacher.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    });
  },
  ["teacher-options"],
  { revalidate: 300, tags: ["teachers"] }
);

export const getParentOptions = unstable_cache(
  async () => {
    return prisma.parent.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        surname: true,
        phone: true,
        username: true,
        email: true,
        aadhar: true,
        address: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["parent-options-v2"],
  { revalidate: 300, tags: ["parents"] }
);

export const getStudentOptions = unstable_cache(
  async () => {
    return prisma.student.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        class: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  },
  ["student-options"],
  { revalidate: 300, tags: ["students"] }
);

export const getCasteOptions = unstable_cache(
  async () => {
    return prisma.caste.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["caste-options"],
  { revalidate: 300, tags: ["castes"] }
);

// ============================================================================
// DASHBOARD AGGREGATES & METRICS
// Revalidated on mutation via revalidateTag, with a 30s TTL backstop.
// ============================================================================

export const getUserCardsCounts = unstable_cache(
  async () => {
    const [adminCount, teacherCount, studentCount, parentCount, accountantCount] =
      await Promise.all([
        prisma.admin.count(),
        prisma.teacher.count({ where: { deletedAt: null } }),
        prisma.student.count({ where: { deletedAt: null } }),
        prisma.parent.count({ where: { deletedAt: null } }),
        prisma.accountant.count({ where: { deletedAt: null } }),
      ]);
    return {
      adminCount,
      teacherCount,
      studentCount,
      parentCount,
      accountantCount,
    };
  },
  ["user-cards-counts"],
  {
    revalidate: 30,
    tags: ["dashboard-counts", "students", "teachers", "parents", "accountants"],
  }
);

export const getGenderDistribution = unstable_cache(
  async () => {
    const data = await prisma.student.groupBy({
      by: ["sex"],
      where: { deletedAt: null },
      _count: true,
    });
    const boys = data.find((d) => d.sex === "MALE")?._count || 0;
    const girls = data.find((d) => d.sex === "FEMALE")?._count || 0;
    return { boys, girls };
  },
  ["student-gender-distribution"],
  { revalidate: 30, tags: ["students", "dashboard-counts"] }
);

export const getWeeklyAttendanceSummary = unstable_cache(
  async () => {
    const startOfWeek = getLatestMonday();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5);
    endOfWeek.setHours(23, 59, 59, 999);

    const grouped = await prisma.attendance.groupBy({
      by: ["date", "present"],
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      _count: true,
    });

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const attendanceMap: { [key: string]: { present: number; absent: number } } = {
      Mon: { present: 0, absent: 0 },
      Tue: { present: 0, absent: 0 },
      Wed: { present: 0, absent: 0 },
      Thu: { present: 0, absent: 0 },
      Fri: { present: 0, absent: 0 },
    };

    grouped.forEach((item) => {
      const itemDate = new Date(item.date);
      const dayOfWeek = itemDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayName = daysOfWeek[dayOfWeek - 1];
        if (item.present) {
          attendanceMap[dayName].present += item._count;
        } else {
          attendanceMap[dayName].absent += item._count;
        }
      }
    });

    return daysOfWeek.map((day) => ({
      name: day,
      present: attendanceMap[day].present,
      absent: attendanceMap[day].absent,
    }));
  },
  ["weekly-attendance-summary"],
  { revalidate: 30, tags: ["attendance"] }
);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getMonthlyFinanceSummary = unstable_cache(
  async () => {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const payments = await prisma.feePayment.findMany({
      where: {
        paymentDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    const monthlyIncome = new Array(12).fill(0);
    payments.forEach((p) => {
      const monthIndex = new Date(p.paymentDate).getMonth();
      monthlyIncome[monthIndex] += Number(p.amount);
    });

    return months.map((month, idx) => ({
      name: month,
      income: monthlyIncome[idx],
      expense: Math.round(monthlyIncome[idx] * 0.4),
    }));
  },
  ["monthly-finance-summary"],
  { revalidate: 30, tags: ["fees", "finance"] }
);
