"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";

const DAY_MODE_KEY = "bdclimb-day-mode";

export default function TrainingCenterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
      <div className="training-center-content">
        <div className="training-center-coming-soon">
          <h2>Coming soon</h2>
          <p>Structured training plans and progress tracking are on the way.</p>
        </div>
      </div>
    </div>
  );
}
