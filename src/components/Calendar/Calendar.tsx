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

export const Calendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Get user's display name
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchDisplayName();
  }, [user]);

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
      {loading ? (
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
