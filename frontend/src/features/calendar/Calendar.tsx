import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const events = [
  { id: "1", title: "Math Quiz", date: "2026-03-07", color: "#3B82F6" },
  {
    id: "2",
    title: "Art History Lecture",
    date: "2026-03-10",
    color: "#F97316",
  },
  { id: "3", title: "Biology Lab Due", date: "2026-03-15", color: "#8B5CF6" },
  { id: "4", title: "Psych Exam", date: "2026-03-16", color: "#10B981" },
  { id: "5", title: "Calculus Quiz", date: "2026-03-24", color: "#3B82F6" },
];

const Calendar = () => {
  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height="auto"
      />
    </div>
  );
};

export default Calendar;
