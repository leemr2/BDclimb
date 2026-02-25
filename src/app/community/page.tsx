"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/users";
import { CalendarDaySummary } from "@/components/Calendar/CalendarDaySummary";
import { Chat } from "@/components/Chat/Chat";
import { DisplayNameSetup } from "@/components/DisplayNameSetup";

const DAY_MODE_KEY = "bdclimb-day-mode";

export default function CommunityPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showDisplayNameSetup, setShowDisplayNameSetup] = useState(false);
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

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.displayName) {
          setDisplayName(profile.displayName);
          setShowDisplayNameSetup(false);
        } else {
          setShowDisplayNameSetup(true);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setShowDisplayNameSetup(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user]);

  const handleDisplayNameComplete = () => {
    setShowDisplayNameSetup(false);
    // Refresh to get the updated display name
    window.location.reload();
  };

  if (authLoading || checkingProfile) {
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
      {showDisplayNameSetup && (
        <DisplayNameSetup onComplete={handleDisplayNameComplete} />
      )}
      <div className="community-header">
        <div className="community-header-title">
          <Image
            src="/images/The Burly Burro.png"
            alt="The Burly Burro"
            width={48}
            height={48}
            className="community-header-logo"
          />
          <h1>The Burly Burro</h1>
        </div>
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
          <span>Welcome, {displayName || user.email}!</span>
          <button type="button" onClick={() => signOut()} className="logout-btn">
            Log out
          </button>
        </div>
      </div>
      <div className="community-content">
        <div className="community-left">
          <div className="calendar-section">
            <CalendarDaySummary />
          </div>
          <div className="training-center-section">
            <div className="training-center-card">
              <h2>Training Center</h2>
              <p className="training-center-description">
                Level up your climbing with structured training plans.
              </p>
              <Link href="/training-center" className="training-center-cta">
                Start Training Now
              </Link>
            </div>
          </div>
        </div>
        <div className="chat-section">
          <Chat />
        </div>
      </div>
    </div>
  );
}
