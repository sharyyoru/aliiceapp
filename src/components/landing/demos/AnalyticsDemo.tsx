"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign } from "lucide-react";

const stats = [
  { label: "Patients", value: 1247, change: 12, icon: Users, color: "sky" },
  { label: "Appointments", value: 89, change: 8, icon: Calendar, color: "violet" },
  { label: "Revenue", value: 45230, change: -3, icon: DollarSign, color: "emerald", prefix: "$" },
];

export default function AnalyticsDemo() {
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => 0));
  const [chartData, setChartData] = useState([30, 45, 35, 50, 40, 65, 55]);

  useEffect(() => {
    // Animate counters
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setAnimatedValues(stats.map((stat) => 
        Math.round((stat.value / steps) * Math.min(step, steps))
      ));
      if (step >= steps) clearInterval(timer);
    }, interval);

    // Animate chart
    const chartTimer = setInterval(() => {
      setChartData((prev) => 
        prev.map((v) => Math.max(20, Math.min(80, v + (Math.random() - 0.5) * 10)))
      );
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(chartTimer);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, idx) => (
          <div key={stat.label} className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${
                stat.color === "sky" ? "bg-sky-100 text-sky-600" :
                stat.color === "violet" ? "bg-violet-100 text-violet-600" :
                "bg-emerald-100 text-emerald-600"
              }`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {stat.prefix || ""}{animatedValues[idx].toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">{stat.label}</span>
              <span className={`flex items-center ${stat.change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {stat.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(stat.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Chart */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-400 mb-3">WEEKLY REVENUE</div>
        <div className="flex items-end gap-2 h-24">
          {chartData.map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-sky-500 to-violet-500 rounded-t transition-all duration-500"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      {/* Quick Insight */}
      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">Revenue up 15%</div>
            <div className="text-xs text-slate-500">Compared to last month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
