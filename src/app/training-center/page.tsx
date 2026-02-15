"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { getActiveProgram } from "@/lib/firebase/training/program";

const GOALS = [
  {
    id: "bouldering" as const,
    title: "Bouldering",
    description:
      "12-week periodized program: max strength, power/RFD, and peak performance. Guided workouts, assessments, and progress tracking.",
    href: "/training-center/onboarding?goal=bouldering",
    available: true,
  },
  {
    id: "route_endurance" as const,
    title: "Route Endurance",
    description:
      "Build endurance for longer routes. ARC training, 4x4s, and aerobic capacity work.",
    href: "#",
    available: false,
  },
  {
    id: "route_power" as const,
    title: "Route Power",
    description:
      "Power and anaerobic capacity for short, hard route efforts.",
    href: "#",
    available: false,
  },
  {
    id: "route_power_endurance" as const,
    title: "Route Power/Endurance",
    description:
      "Hybrid program for routes that demand both power and sustained effort.",
    href: "#",
    available: false,
  },
];

export default function TrainingCenterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingProgram, setCheckingProgram] = useState(true);
  const [hasActiveProgram, setHasActiveProgram] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) {
      setCheckingProgram(false);
      return;
    }
    getActiveProgram(user.uid)
      .then((program) => {
        setHasActiveProgram(program != null);
        if (program != null) {
          router.replace("/training-center/dashboard");
        }
      })
      .catch(() => setCheckingProgram(false))
      .finally(() => setCheckingProgram(false));
  }, [user, router]);

  if (authLoading || checkingProgram) {
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
    <div className="training-center-hub">
      <h2 className="training-center-hub-title">Choose your goal</h2>
      <p className="training-center-hub-subtitle">
        Select a 12-week program to get started. Complete the cycle, then pick a
        new goal.
      </p>
      <div className="training-center-goal-cards">
        {GOALS.map((goal) => (
          <div
            key={goal.id}
            className={`training-center-goal-card ${goal.available ? "available" : "coming-soon"}`}
          >
            {!goal.available && (
              <span className="training-center-goal-badge">Coming soon</span>
            )}
            <h3 className="training-center-goal-title">{goal.title}</h3>
            <p className="training-center-goal-description">
              {goal.description}
            </p>
            {goal.available ? (
              <Link
                href={goal.href}
                className="training-center-goal-cta training-center-cta"
              >
                Start Bouldering Program
              </Link>
            ) : (
              <span className="training-center-goal-cta disabled">
                Not available yet
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
