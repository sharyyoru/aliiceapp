"use client";

import { useState } from "react";
import { User, Phone, Mail, Calendar, Star, MoreHorizontal } from "lucide-react";

const patients = [
  { id: 1, name: "Emma Thompson", age: 34, lastVisit: "2 days ago", status: "VIP", avatar: "ET" },
  { id: 2, name: "Michael Chen", age: 45, lastVisit: "1 week ago", status: "Regular", avatar: "MC" },
  { id: 3, name: "Sarah Johnson", age: 28, lastVisit: "Today", status: "New", avatar: "SJ" },
];

export default function PatientCardDemo() {
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <div
          key={patient.id}
          onClick={() => setSelectedPatient(patient)}
          onMouseEnter={() => setHoveredId(patient.id)}
          onMouseLeave={() => setHoveredId(null)}
          className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedPatient.id === patient.id
              ? "bg-sky-50 border-2 border-sky-200 shadow-sm"
              : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
          }`}
        >
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
            patient.status === "VIP" ? "bg-gradient-to-br from-amber-400 to-orange-500" :
            patient.status === "New" ? "bg-gradient-to-br from-emerald-400 to-teal-500" :
            "bg-gradient-to-br from-sky-400 to-blue-500"
          }`}>
            {patient.avatar}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 truncate">{patient.name}</span>
              {patient.status === "VIP" && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Age {patient.age}</span>
              <span>•</span>
              <span>{patient.lastVisit}</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 transition-opacity ${
            hoveredId === patient.id ? "opacity-100" : "opacity-0"
          }`}>
            <button className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-sky-600 transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-sky-600 transition-colors">
              <Mail className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-sky-600 transition-colors">
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 px-4 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors">
          + Add Patient
        </button>
        <button className="py-2 px-4 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
          Import
        </button>
      </div>
    </div>
  );
}
