import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { getWeeklyAttendanceSummary } from "@/lib/queries";

const AttendanceChartContainer = async () => {
  const data = await getWeeklyAttendanceSummary();

  return (
    <div className="h-full rounded-lg bg-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data} />
    </div>
  );
};

export default AttendanceChartContainer;
