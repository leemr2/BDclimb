"use client";

import type { WeekSchedule as WeekScheduleType } from "@/lib/plans/bouldering/types";

const DAY_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
};

function restLabel(dayA: string, dayB: string): string {
  const gap = (DAY_INDEX[dayB] ?? 0) - (DAY_INDEX[dayA] ?? 0) - 1;
  if (gap <= 0) return "back-to-back";
  return gap === 1 ? "1 day rest" : `${gap} days rest`;
}

interface WeekScheduleProps {
  schedule: WeekScheduleType | null;
}

export function WeekSchedule({ schedule }: WeekScheduleProps) {
  if (!schedule) return null;

  const sessions = schedule.days.filter((d) => d.session !== null);

  return (
    <div className="training-week-schedule">
      <h3 className="training-week-title">This Week</h3>
      <ul className="training-week-sessions">
        {sessions.map((day, i) => (
          <li key={day.session!.label} className="training-week-session-item">
            <div className={`training-week-session-card ${day.status ?? ""}`}>
              <div className="training-week-session-header">
                <span className="training-week-session-label">
                  Session {day.session!.label}
                </span>
                <span className="training-week-session-duration">
                  ~{day.session!.estimatedDuration} min
                </span>
              </div>
              <p className="training-week-session-title">
                {day.session!.title}
                {day.status === "completed" && (
                  <span className="training-week-session-check"> ✓</span>
                )}
              </p>
            </div>
            {i < sessions.length - 1 && (
              <div className="training-week-rest-hint" aria-hidden="true">
                {restLabel(day.dayName, sessions[i + 1].dayName)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
