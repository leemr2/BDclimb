"use client";

import { useState } from "react";
import { createEvent } from "@/lib/firebase/events";
import { generateTimeBlocks, formatTimeBlock } from "@/lib/firebase/calendar";

interface Props {
  userId: string;
  displayName: string;
  onClose: () => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

const TODAY = new Date().toISOString().split("T")[0];

export function EventSchedulerModal({ userId, displayName, onClose }: Props) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeBlocks = generateTimeBlocks();

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an event name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createEvent(
        name.trim(),
        date,
        startTime,
        durationMinutes,
        userId,
        displayName
      );
      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to schedule event. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="event-scheduler-overlay" onClick={handleOverlayClick}>
      <div className="event-scheduler-modal">
        <h2 className="event-scheduler-title">Schedule an Event</h2>
        <form className="event-scheduler-form" onSubmit={handleSubmit}>
          <div className="event-scheduler-field">
            <label htmlFor="event-name">Event Name</label>
            <input
              id="event-name"
              type="text"
              placeholder="e.g. Comp Training Session"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
          <div className="event-scheduler-row">
            <div className="event-scheduler-field">
              <label htmlFor="event-date">Date</label>
              <input
                id="event-date"
                type="date"
                value={date}
                min={TODAY}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="event-scheduler-field">
              <label htmlFor="event-time">Start Time</label>
              <select
                id="event-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {timeBlocks.map((block) => (
                  <option key={block} value={block}>
                    {formatTimeBlock(block)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="event-scheduler-field">
            <label htmlFor="event-duration">Duration</label>
            <select
              id="event-duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="event-scheduler-error">{error}</p>}
          <div className="event-scheduler-actions">
            <button
              type="button"
              className="event-scheduler-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="event-scheduler-save"
              disabled={submitting}
            >
              {submitting ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
