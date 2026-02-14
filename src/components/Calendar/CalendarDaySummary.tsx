"use client";

import { useState, useEffect } from "react";
import {
  generateTimeBlocks,
  subscribeToCalendarEntries,
  formatTimeBlock,
  type CalendarEntry,
} from "@/lib/firebase/calendar";
import { Calendar } from "./Calendar";

export const CalendarDaySummary = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;

    setLoading(true);
    const unsubscribe = subscribeToCalendarEntries(selectedDate, (newEntries) => {
      setEntries(newEntries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalOpen]);

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const timeBlocks = generateTimeBlocks();

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getSegmentStatus = (timeBlock: string) => {
    const blockEntries = entries.filter((e) => e.timeBlock === timeBlock);
    if (blockEntries.length === 0) return "empty";
    const hasConfirmed = blockEntries.some((e) => e.status === "confirmed");
    return hasConfirmed ? "confirmed" : "thinking";
  };

  const getSegmentTitle = (timeBlock: string) => {
    const time = formatTimeBlock(timeBlock);
    const blockEntries = entries.filter((e) => e.timeBlock === timeBlock);
    if (blockEntries.length === 0) return time;
    const who = blockEntries
      .map(
        (e) =>
          `${e.displayName} (${e.status === "confirmed" ? "will be there" : "thinking"})`
      )
      .join(", ");
    return `${time} — ${who}`;
  };

  const daySummaryLines = (() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort(
      (a, b) => a.timeBlock.localeCompare(b.timeBlock)
    );
    return sorted.map((e) => {
      const name = e.displayName?.trim() || "Someone";
      const time = formatTimeBlock(e.timeBlock);
      const status =
        e.status === "confirmed" ? "will be there" : "thinking about";
      return { key: e.id, text: `${name} ${status} at ${time}` };
    });
  })();

  return (
    <>
      <div
        className="calendar-day-summary calendar-day-summary-condensed"
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        aria-label="Open full workout schedule"
      >
        <div className="calendar-summary-header">
          <h2>Workout Schedule</h2>
          <input
            type="date"
            value={selectedDate}
            min={getMinDate()}
            className="date-picker date-picker-summary"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="Select date"
          />
        </div>
        <p className="calendar-summary-date-label">{formatDateLabel(selectedDate)}</p>
        {loading ? (
          <div className="calendar-summary-loading">Loading...</div>
        ) : (
          <div className="calendar-summary-strip" title="6 AM – 10 PM: highlighted = someone scheduled">
            <span className="calendar-summary-strip-label">6a</span>
            <div className="calendar-summary-strip-segments">
              {timeBlocks.map((timeBlock) => (
                <div
                  key={timeBlock}
                  className={`calendar-summary-segment calendar-summary-segment-${getSegmentStatus(timeBlock)}`}
                  title={getSegmentTitle(timeBlock)}
                />
              ))}
            </div>
            <span className="calendar-summary-strip-label">10p</span>
          </div>
        )}
        <div className="calendar-summary-cta">Click to edit</div>
        {!loading && daySummaryLines && daySummaryLines.length > 0 && (
          <div className="calendar-summary-day-summary">
            {daySummaryLines.map((line) => (
              <div key={line.key} className="calendar-summary-day-summary-line">
                {line.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="calendar-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
        >
          <div
            className="calendar-modal-backdrop"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="calendar-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-modal-header">
              <h2 id="calendar-modal-title">Workout Schedule</h2>
              <button
                type="button"
                className="calendar-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close schedule"
              >
                ×
              </button>
            </div>
            <div className="calendar-modal-body">
              <Calendar defaultSelectedDate={selectedDate} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
