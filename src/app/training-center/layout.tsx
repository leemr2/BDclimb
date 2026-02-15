"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DAY_MODE_KEY = "bdclimb-day-mode";

export default function TrainingCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dayMode, setDayMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DAY_MODE_KEY);
      setDayMode(stored === "1");
    } catch {
      setDayMode(false);
    }
  }, []);

  const toggleDayMode = () => {
    setDayMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DAY_MODE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className={`community-page${dayMode ? " day-mode" : ""}`}>
      <div className="community-header">
        <h1>Training Center</h1>
        <div className="user-info">
          <button
            type="button"
            onClick={toggleDayMode}
            className="day-mode-btn"
            aria-pressed={dayMode}
            aria-label={dayMode ? "Switch to night mode" : "Switch to day mode"}
          >
            {dayMode ? "Night mode" : "Day mode"}
          </button>
          <Link href="/community" className="training-center-back">
            Back to Community
          </Link>
        </div>
      </div>
      <div className="training-center-content training-center-layout-main">
        {children}
      </div>
    </div>
  );
}
