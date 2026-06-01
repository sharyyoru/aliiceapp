"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const appointments = [
  { id: 1, time: "09:00", patient: "Emma T.", type: "Consultation", color: "sky" },
  { id: 2, time: "10:30", patient: "Michael C.", type: "Follow-up", color: "emerald" },
  { id: 3, time: "14:00", patient: "Sarah J.", type: "Treatment", color: "violet" },
];

type CalendarDemoProps = {
  expanded?: boolean;
};

export default function CalendarDemo({ expanded = false }: CalendarDemoProps) {
  const [selectedDate, setSelectedDate] = useState(15);
  const [draggedAppt, setDraggedAppt] = useState<number | null>(null);
  
  const days = Array.from({ length: 7 }, (_, i) => ({
    date: 14 + i,
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  }));

  return (
    <div className="space-y-4">
      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between">
        <button className="p-1 rounded hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-400" />
        </button>
        <span className="font-semibold text-slate-900">June 2026</span>
        <button className="p-1 rounded hover:bg-slate-100">
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d.date)}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              selectedDate === d.date
                ? "bg-sky-600 text-white"
                : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <span className="text-xs">{d.day}</span>
            <span className="text-lg font-semibold">{d.date}</span>
          </button>
        ))}
      </div>

      {/* Appointments */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-500">Today&apos;s Appointments</div>
        {appointments.map((appt) => (
          <div
            key={appt.id}
            draggable
            onDragStart={() => setDraggedAppt(appt.id)}
            onDragEnd={() => setDraggedAppt(null)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
              draggedAppt === appt.id ? "opacity-50 scale-95" : ""
            } ${
              appt.color === "sky" ? "bg-sky-50 border-l-4 border-sky-500" :
              appt.color === "emerald" ? "bg-emerald-50 border-l-4 border-emerald-500" :
              appt.color === "violet" ? "bg-violet-50 border-l-4 border-violet-500" :
              "bg-amber-50 border-l-4 border-amber-500"
            }`}
          >
            <div className="text-sm font-mono font-semibold text-slate-600">{appt.time}</div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{appt.patient}</div>
              <div className="text-xs text-slate-500">{appt.type}</div>
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="pt-2 text-center">
          <span className="text-xs text-slate-400">Drag appointments to reschedule</span>
        </div>
      )}
    </div>
  );
}
