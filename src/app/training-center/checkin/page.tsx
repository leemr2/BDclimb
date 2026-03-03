"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import {
  getTodaysCheckin,
  type DailyCheckinInput,
} from "@/lib/firebase/training/daily-checkins";
import { MorningCheckin } from "@/components/training/checkin/MorningCheckin";

export default function CheckinPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const [initial, setInitial] = useState<Partial<DailyCheckinInput> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!programLoading && user && !program) {
      router.replace("/training-center");
    }
  }, [programLoading, user, program, router]);

  useEffect(() => {
    if (!user?.uid) {
      setInitial(null);
      setInitialLoading(false);
      return;
    }
    getTodaysCheckin(user.uid)
      .then((c) => {
        if (c) {
          setInitial({
            fingerStiffness: c.fingerStiffness,
            fingerPain: c.fingerPain,
            energyLevel: c.energyLevel,
            sleepQuality: c.sleepQuality,
            sleepHours: c.sleepHours,
            motivation: c.motivation,
            sorenessLocations: [...c.sorenessLocations],
            readinessForTraining: c.readinessForTraining,
            notes: c.notes,
          });
        } else {
          setInitial(null);
        }
      })
      .catch(() => setInitial(null))
      .finally(() => setInitialLoading(false));
  }, [user?.uid]);

  if (authLoading || programLoading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !program) {
    return null;
  }

  return (
    <div className="training-checkin-page">
      <Link
        href="/training-center"
        className="training-dashboard-back-link"
      >
        ← Training Home
      </Link>
      <h2 className="training-checkin-page-title">Morning Check-in</h2>
      {initialLoading ? (
        <p className="tc-placeholder-text">Loading…</p>
      ) : (
        <MorningCheckin
          userId={user.uid}
          initial={initial ?? undefined}
          onSuccess={() => router.replace("/training-center/dashboard")}
        />
      )}
    </div>
  );
}
