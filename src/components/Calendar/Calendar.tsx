"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/users";
import {
  generateTimeBlocks,
  subscribeToCalendarEntries,
  toggleCalendarEntry,
  type CalendarEntry,
} from "@/lib/firebase/calendar";
import { TimeBlock } from "./TimeBlock";

interface CalendarProps {
  /** When provided (e.g. from modal), use this as the initial selected date */
  defaultSelectedDate?: string;
  /** Pre-loaded from parent; avoids redundant fetch and race on modal open */
  displayName?: string | null;
}

export const Calendar = ({
  defaultSelectedDate,
  displayName: displayNameProp,
}: CalendarProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (defaultSelectedDate) return defaultSelectedDate;
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [fetchedDisplayName, setFetchedDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const skipProfileFetch = displayNameProp !== undefined;
  const displayName = skipProfileFetch
    ? (displayNameProp ?? "")
    : fetchedDisplayName;

  // Sync with parent when defaultSelectedDate changes (e.g. modal opened with new date)
  useEffect(() => {
    if (defaultSelectedDate != null && defaultSelectedDate !== selectedDate) {
      setSelectedDate(defaultSelectedDate);
    }
  }, [defaultSelectedDate]); // eslint-disable-line react-hooks/exhaustive-deps -- only sync when prop from parent changes

  // Fallback profile fetch when parent does not pass displayName
  useEffect(() => {
    if (skipProfileFetch || !user) return;

    let cancelled = false;
    setProfileLoading(true);

    const fetchDisplayName = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (!cancelled && profile?.displayName) {
          setFetchedDisplayName(profile.displayName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    fetchDisplayName();
    return () => {
      cancelled = true;
    };
  }, [user, skipProfileFetch]);

  // Subscribe to calendar entries for selected date
  useEffect(() => {
    if (!selectedDate) return;

    setLoading(true);
    const unsubscribe = subscribeToCalendarEntries(selectedDate, (newEntries) => {
      setEntries(newEntries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const handleToggleTimeBlock = async (timeBlock: string) => {
    if (!user || !displayName) {
      alert("Please set your display name first");
      return;
    }

    const userEntry = entries.find(
      (entry) => entry.userId === user.uid && entry.timeBlock === timeBlock
    );

    try {
      await toggleCalendarEntry(
        selectedDate,
        timeBlock,
        user.uid,
        displayName,
        userEntry?.status
      );
    } catch (error) {
      console.error("Error toggling calendar entry:", error);
      alert("Failed to update calendar. Please try again.");
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const timeBlocks = generateTimeBlocks();
  const waitingForProfile = !skipProfileFetch && profileLoading;
  const showLoading = loading || waitingForProfile;
  const canToggle = !showLoading && !!user && !!displayName;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Workout Schedule</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={getMinDate()}
          className="date-picker"
        />
      </div>
      {showLoading ? (
        <div className="calendar-loading">Loading...</div>
      ) : (
        <div className="calendar-grid">
          {timeBlocks.map((timeBlock) => {
            const blockEntries = entries.filter(
              (entry) => entry.timeBlock === timeBlock
            );
            return (
              <TimeBlock
                key={timeBlock}
                timeBlock={timeBlock}
                entries={blockEntries}
                currentUserId={user?.uid || ""}
                disabled={!canToggle}
                onToggle={handleToggleTimeBlock}
              />
            );
          })}
        </div>
      )}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color empty"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color thinking"></div>
          <span>Thinking about it</span>
        </div>
        <div className="legend-item">
          <div className="legend-color confirmed"></div>
          <span>Will be there</span>
        </div>
      </div>
    </div>
  );
};
