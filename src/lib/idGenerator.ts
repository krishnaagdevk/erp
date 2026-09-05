import prisma from "./prisma";

export interface IdFormatConfig {
  studentIdPrefix: string;
  studentIdYear: boolean;
  studentIdDigits: number;
  studentIdFormat: string;

  teacherIdPrefix: string;
  teacherIdYear: boolean;
  teacherIdDigits: number;
  teacherIdFormat: string;

  parentIdPrefix: string;
  parentIdDigits: number;
  parentIdFormat: string;
}

export const DEFAULT_ID_CONFIG: IdFormatConfig = {
  studentIdPrefix: "STU",
  studentIdYear: true,
  studentIdDigits: 4,
  studentIdFormat: "STU[YYYY][SEQ]",

  teacherIdPrefix: "TCH",
  teacherIdYear: true,
  teacherIdDigits: 4,
  teacherIdFormat: "TCH[YYYY][SEQ]",

  parentIdPrefix: "PRN",
  parentIdDigits: 4,
  parentIdFormat: "PRN[SEQ]",
};

/**
 * Formats an ID string from a template and parameters without dashes.
 */
export function formatIdPattern(
  pattern: string,
  prefix: string,
  includeYear: boolean,
  digits: number,
  sequenceNum: number
): string {
  const currentYear = new Date().getFullYear().toString();
  const shortYear = currentYear.slice(-2);
  const paddedSeq = String(sequenceNum).padStart(digits || 4, "0");

  let result = pattern || `${prefix}[YYYY][SEQ]`;

  result = result.replace(/\[PREFIX\]/gi, prefix);
  result = result.replace(/\[YYYY\]/gi, currentYear);
  result = result.replace(/\[YY\]/gi, shortYear);
  result = result.replace(/\[SEQ\]/gi, paddedSeq);

  // If pattern didn't contain tokens, apply fallback without dashes
  if (!pattern.includes("[SEQ]") && !pattern.includes("[seq]")) {
    const yearPart = includeYear ? currentYear : "";
    return `${prefix}${yearPart}${paddedSeq}`;
  }

  return result;
}

/**
 * Retrieves the system-wide ID settings, creating or updating default record if needed.
 */
export async function getSystemIdConfig(): Promise<IdFormatConfig> {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          id: "default",
          ...DEFAULT_ID_CONFIG,
        },
      });
    }

    return {
      studentIdPrefix: setting.studentIdPrefix || "STU",
      studentIdYear: setting.studentIdYear,
      studentIdDigits: setting.studentIdDigits || 4,
      studentIdFormat: setting.studentIdFormat || "STU[YYYY][SEQ]",

      teacherIdPrefix: setting.teacherIdPrefix || "TCH",
      teacherIdYear: setting.teacherIdYear,
      teacherIdDigits: setting.teacherIdDigits || 4,
      teacherIdFormat: setting.teacherIdFormat || "TCH[YYYY][SEQ]",

      parentIdPrefix: setting.parentIdPrefix || "PRN",
      parentIdDigits: setting.parentIdDigits || 4,
      parentIdFormat: setting.parentIdFormat || "PRN[SEQ]",
    };
  } catch (err) {
    console.error("Failed to load SystemSetting, falling back to defaults:", err);
    return DEFAULT_ID_CONFIG;
  }
}

/**
 * Autogenerates the next Student ID (Username).
 */
export async function generateNextStudentId(): Promise<string> {
  const config = await getSystemIdConfig();
  const count = await prisma.student.count();
  const nextSeq = count + 1;

  let candidate = formatIdPattern(
    config.studentIdFormat,
    config.studentIdPrefix,
    config.studentIdYear,
    config.studentIdDigits,
    nextSeq
  );

  // Ensure uniqueness in case of deleted records or manual usernames
  let exists = await prisma.student.findUnique({ where: { username: candidate } });
  let counter = nextSeq;
  while (exists) {
    counter++;
    candidate = formatIdPattern(
      config.studentIdFormat,
      config.studentIdPrefix,
      config.studentIdYear,
      config.studentIdDigits,
      counter
    );
    exists = await prisma.student.findUnique({ where: { username: candidate } });
  }

  return candidate;
}

/**
 * Autogenerates the next Teacher ID (Username).
 */
export async function generateNextTeacherId(): Promise<string> {
  const config = await getSystemIdConfig();
  const count = await prisma.teacher.count();
  const nextSeq = count + 1;

  let candidate = formatIdPattern(
    config.teacherIdFormat,
    config.teacherIdPrefix,
    config.teacherIdYear,
    config.teacherIdDigits,
    nextSeq
  );

  let exists = await prisma.teacher.findUnique({ where: { username: candidate } });
  let counter = nextSeq;
  while (exists) {
    counter++;
    candidate = formatIdPattern(
      config.teacherIdFormat,
      config.teacherIdPrefix,
      config.teacherIdYear,
      config.teacherIdDigits,
      counter
    );
    exists = await prisma.teacher.findUnique({ where: { username: candidate } });
  }

  return candidate;
}
