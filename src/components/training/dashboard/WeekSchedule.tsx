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
  const completedCount = sessions.filter((d) => d.status === "completed").length;

  return (
    <div className="training-week-schedule">
      <div className="training-week-schedule-header">
        <h3 className="training-week-title">This Week</h3>
        {completedCount > 0 && (
          <span className="training-week-progress-badge">
            {completedCount}/{sessions.length} done
          </span>
        )}
      </div>
      <ul className="training-week-sessions">
        {sessions.map((day, i) => {
          const isCompleted = day.status === "completed";
          return (
            <li key={day.session!.label} className="training-week-session-item">
              <div className={`training-week-session-card ${day.status ?? ""}`}>
                <div className="training-week-session-header">
                  <div className="training-week-session-label-row">
                    <span className={`training-week-session-label ${isCompleted ? "completed" : ""}`}>
                      Session {day.session!.label}
                    </span>
                    {isCompleted && (
                      <span className="training-week-session-badge" aria-label="Completed">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Done
                      </span>
                    )}
                  </div>
                  <span className="training-week-session-duration">
                    ~{day.session!.estimatedDuration} min
                  </span>
                </div>
                <p className={`training-week-session-title ${isCompleted ? "completed" : ""}`}>
                  {day.session!.title}
                </p>
              </div>
              {i < sessions.length - 1 && (
                <div className="training-week-rest-hint" aria-hidden="true">
                  {restLabel(day.dayName, sessions[i + 1].dayName)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
