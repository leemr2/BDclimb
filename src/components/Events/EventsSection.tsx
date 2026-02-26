"use client";

import { useEffect, useState } from "react";
import {
  subscribeToUpcomingEvents,
  deleteEvent,
  type GymEvent,
} from "@/lib/firebase/events";
import { formatTimeBlock } from "@/lib/firebase/calendar";
import { EventSchedulerModal } from "./EventSchedulerModal";

interface Props {
  userId: string;
  displayName: string;
}

function formatEventDate(dateStr: string): {
  month: string;
  day: string;
  label: string;
} {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Use local date construction to avoid timezone-shift issues
  const date = new Date(year, month - 1, day);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: day.toString(),
    label: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return hours === 1 ? "1 hr" : `${hours} hrs`;
}

export function EventsSection({ userId, displayName }: Props) {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUpcomingEvents(setEvents);
    return unsubscribe;
  }, []);

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  return (
    <div className="events-section">
      <div className="events-card">
        <div className="events-card-header">
          <h2>Events</h2>
          <button
            type="button"
            className="events-schedule-btn"
            onClick={() => setShowScheduler(true)}
          >
            + Schedule
          </button>
        </div>
        <div className="events-list">
          {events.length === 0 ? (
            <p className="events-empty">No upcoming events. Schedule one!</p>
          ) : (
            events.map((event) => {
              const { month, day, label } = formatEventDate(event.date);
              return (
                <div key={event.id} className="event-item">
                  <div className="event-date-badge">
                    <span className="event-date-month">{month}</span>
                    <span className="event-date-day">{day}</span>
                  </div>
                  <div className="event-info">
                    <p className="event-name">{event.name}</p>
                    <p className="event-meta">
                      {label} · {formatTimeBlock(event.startTime)} ·{" "}
                      {formatDuration(event.durationMinutes)} ·{" "}
                      {event.createdByName}
                    </p>
                  </div>
                  {event.createdBy === userId && (
                    <button
                      type="button"
                      className="event-delete-btn"
                      onClick={() => handleDelete(event.id)}
                      aria-label="Delete event"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {showScheduler && (
        <EventSchedulerModal
          userId={userId}
          displayName={displayName}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}
