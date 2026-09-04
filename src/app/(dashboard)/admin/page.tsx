import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChartContainer from "@/components/FinanceChartContainer";
import UserCards from "@/components/UserCards";
import { Suspense } from "react";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row">
      {/* LEFT */}
      <div className="flex w-full flex-col gap-8 lg:w-2/3">
        {/* USER CARDS */}
        <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-gray-100" />}>
          <UserCards />
        </Suspense>
        {/* MIDDLE CHARTS */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* COUNT CHART */}
          <div className="h-[450px] w-full lg:w-1/3">
            <Suspense
              fallback={<div className="h-full w-full animate-pulse rounded-xl bg-gray-100" />}
            >
              <CountChartContainer />
            </Suspense>
          </div>
          {/* ATTENDANCE CHART */}
          <div className="h-[450px] w-full lg:w-2/3">
            <Suspense
              fallback={<div className="h-full w-full animate-pulse rounded-xl bg-gray-100" />}
            >
              <AttendanceChartContainer />
            </Suspense>
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="h-[500px] w-full">
          <Suspense
            fallback={<div className="h-full w-full animate-pulse rounded-xl bg-gray-100" />}
          >
            <FinanceChartContainer />
          </Suspense>
        </div>
      </div>
      {/* RIGHT */}
      <div className="flex w-full flex-col gap-8 lg:w-1/3">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-100" />}>
          <EventCalendarContainer searchParams={resolvedSearchParams} />
        </Suspense>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-100" />}>
          <Announcements />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminPage;
