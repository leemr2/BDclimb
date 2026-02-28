"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TrainingProfile } from "@/lib/firebase/training/profile";

/**
 * Subscribes to the current user's training profile (real-time).
 * The profile lives at users/{uid}.trainingProfile alongside activeProgram.
 */
export function useTrainingProfile(): {
  profile: TrainingProfile | null;
  loading: boolean;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TrainingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setProfile(null);
      } else {
        const data = snap.data();
        setProfile((data.trainingProfile as TrainingProfile | undefined) ?? null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  return { profile, loading };
}
