"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";

const localizer = momentLocalizer(moment);

const BigCalendar = ({ data }: { data: { title: string; start: Date; end: Date }[] }) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  useEffect(() => {
    // On small screens, default to day view if user is on mobile
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setView(Views.WORK_WEEK);
    }
  }, []);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <div className="h-full w-full overflow-x-auto">
      <div className="h-full min-w-[580px] sm:min-w-0">
        <Calendar
          localizer={localizer}
          events={data}
          startAccessor="start"
          endAccessor="end"
          views={["work_week", "day"]}
          view={view}
          style={{ height: "100%" }}
          onView={handleOnChangeView}
          min={new Date(2025, 1, 0, 8, 0, 0)}
          max={new Date(2025, 1, 0, 17, 0, 0)}
        />
      </div>
    </div>
  );
};

export default BigCalendar;
