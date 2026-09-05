export const getLatestMonday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const latestMonday = new Date(today);
  latestMonday.setDate(today.getDate() - daysSinceMonday);
  latestMonday.setHours(0, 0, 0, 0);
  return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
  const latestMonday = getLatestMonday();

  return lessons.map((lesson) => {
    const lessonDayOfWeek = lesson.start.getDay();
    const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

    const adjustedStartDate = new Date(latestMonday);
    adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      lesson.start.getMinutes(),
      lesson.start.getSeconds()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      lesson.end.getHours(),
      lesson.end.getMinutes(),
      lesson.end.getSeconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};

export function serializePlain<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === "object" && data !== null) {
    if (data instanceof Date) {
      return data;
    }
    // Prisma Decimal check (Decimal instances have toNumber method or d, s, e props)
    if (typeof (data as any).toNumber === "function") {
      return (data as any).toNumber();
    }
    if ("d" in data && "s" in data && "e" in data) {
      return Number(data) as any;
    }
    if (Array.isArray(data)) {
      return data.map((item) => serializePlain(item)) as any;
    }
    const result: any = {};
    for (const [key, val] of Object.entries(data)) {
      result[key] = serializePlain(val);
    }
    return result;
  }
  return data;
}

export function getCurrentAcademicYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 3 = Apr
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}/${endYearShort}`;
}

/**
 * Optimizes a Cloudinary image URL by automatically applying
 * modern compression (f_auto), automatic quality (q_auto), and responsive dimensions.
 */
export function getOptimizedCloudinaryUrl(
  urlOrPublicId: string | null | undefined,
  width = 200,
  height = 200
): string {
  if (!urlOrPublicId) return "/noAvatar.png";
  if (!urlOrPublicId.includes("cloudinary.com")) {
    // If it's a relative path or external URL, return as is
    return urlOrPublicId;
  }

  // Inject transformation if not already transformed
  if (urlOrPublicId.includes("/image/upload/") && !urlOrPublicId.includes("f_auto")) {
    return urlOrPublicId.replace(
      "/image/upload/",
      `/image/upload/w_${width},h_${height},c_fill,g_face,f_auto,q_auto/`
    );
  }

  return urlOrPublicId;
}
