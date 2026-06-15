"use client";

import { CalendarEntry, formatTimeBlock } from "@/lib/firebase/calendar";

interface TimeBlockProps {
  timeBlock: string;
  entries: CalendarEntry[];
  currentUserId: string;
  disabled?: boolean;
  onToggle: (timeBlock: string) => void;
}

export const TimeBlock = ({
  timeBlock,
  entries,
  currentUserId,
  disabled = false,
  onToggle,
}: TimeBlockProps) => {
  const userEntry = entries.find((entry) => entry.userId === currentUserId);
  const otherEntries = entries.filter(
    (entry) => entry.userId !== currentUserId
  );

  const getBlockClass = () => {
    if (userEntry) {
      return userEntry.status === "confirmed"
        ? "time-block confirmed"
        : "time-block thinking";
    }
    return "time-block empty";
  };

  const handleClick = () => {
    if (disabled) return;
    onToggle(timeBlock);
  };

  return (
    <div
      className={`${getBlockClass()}${disabled ? " time-block-disabled" : ""}`}
      onClick={handleClick}
      aria-disabled={disabled}
    >
      <div className="time-block-header">
        <span className="time-label">{formatTimeBlock(timeBlock)}</span>
        {userEntry && (
          <span className="user-status">
            {userEntry.status === "confirmed" ? "✓ Will be there" : "🤔 Thinking"}
          </span>
        )}
      </div>
      {otherEntries.length > 0 && (
        <div className="time-block-others">
          <div className="others-label">Others:</div>
          <div className="others-list">
            {otherEntries.map((entry) => (
              <div
                key={entry.id}
                className={`other-entry ${entry.status === "confirmed" ? "confirmed" : "thinking"}`}
              >
                {entry.displayName}
                {entry.status === "confirmed" ? " ✓" : " 🤔"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
