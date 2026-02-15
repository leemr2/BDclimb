"use client";

import type { WeekSchedule as WeekScheduleType } from "@/lib/plans/bouldering/types";

interface WeekScheduleProps {
  schedule: WeekScheduleType | null;
}

export function WeekSchedule({ schedule }: WeekScheduleProps) {
  if (!schedule) return null;

  return (
    <div className="training-week-schedule">
      <h3 className="training-week-title">This week</h3>
      <ul className="training-week-days">
        {schedule.days.map((day) => (
          <li
            key={day.dayName}
            className={`training-week-day ${day.session ? "session" : "rest"} ${day.status ?? ""}`}
          >
            <span className="training-week-day-name">{day.dayName}</span>
            {day.session ? (
              <span className="training-week-day-session">
                Session {day.session.label}: {day.session.title}
                {day.status === "completed" ? " ✓" : ""}
                {day.status === "upcoming" ? " (upcoming)" : ""}
              </span>
            ) : (
              <span className="training-week-day-rest">REST</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
