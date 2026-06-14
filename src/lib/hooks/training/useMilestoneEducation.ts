"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import { markEducationSlugSeen } from "@/lib/firebase/training/program";
import { getEducationMeta } from "@/lib/content/educationRegistry";
import type { EducationPieceMeta } from "@/lib/types/education";
import { getPendingEducationSlug } from "@/lib/plans/bouldering/educationTriggers";
import type { BoulderingFrequency } from "@/lib/plans/bouldering/planEngine";

interface UseMilestoneEducationOptions {
  program: ActiveProgram | null;
  userId: string | undefined;
  completedSessionLabelsForWeek12?: string[];
}

export function useMilestoneEducation({
  program,
  userId,
  completedSessionLabelsForWeek12 = [],
}: UseMilestoneEducationOptions) {
  const [dismissedSlug, setDismissedSlug] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [meta, setMeta] = useState<EducationPieceMeta | null>(null);

  useEffect(() => {
    if (!program || program.goalType !== "bouldering") {
      setPendingSlug(null);
      setMeta(null);
      return;
    }

    const slug = getPendingEducationSlug(
      program,
      program.frequency as BoulderingFrequency,
      completedSessionLabelsForWeek12
    );
    setPendingSlug(slug);
    setMeta(slug ? getEducationMeta(slug) : null);
    setDismissedSlug(null);
  }, [program, completedSessionLabelsForWeek12]);

  const isVisible =
    pendingSlug != null &&
    meta != null &&
    dismissedSlug !== pendingSlug;

  const markRead = useCallback(async () => {
    if (!userId || !pendingSlug) return;
    await markEducationSlugSeen(userId, pendingSlug);
    setPendingSlug(null);
    setMeta(null);
  }, [userId, pendingSlug]);

  const dismissForLater = useCallback(() => {
    if (pendingSlug) setDismissedSlug(pendingSlug);
  }, [pendingSlug]);

  return {
    pendingSlug,
    meta,
    isVisible,
    markRead,
    dismissForLater,
  };
}
