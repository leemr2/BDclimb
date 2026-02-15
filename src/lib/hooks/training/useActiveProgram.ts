"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import {
  subscribeToActiveProgram,
  type ActiveProgram,
} from "@/lib/firebase/training/program";

/**
 * Subscribes to the current user's active program (real-time).
 */
export function useActiveProgram(): {
  program: ActiveProgram | null;
  loading: boolean;
} {
  const { user } = useAuth();
  const [program, setProgram] = useState<ActiveProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProgram(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToActiveProgram(user.uid, (next) => {
      setProgram(next);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  return { program, loading };
}
