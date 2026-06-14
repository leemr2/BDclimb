"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import { markEducationSlugSeen } from "@/lib/firebase/training/program";
import { getEducationMeta } from "@/lib/content/educationRegistry";
import type { EducationPieceMeta } from "@/lib/types/education";
import { getPendingEducationSlug as getBoulderingPendingSlug } from "@/lib/plans/bouldering/educationTriggers";
import { getPendingEducationSlug as getPEPendingSlug } from "@/lib/plans/power-endurance/educationTriggers";
import type { BoulderingFrequency } from "@/lib/plans/bouldering/planEngine";
import type { PEFrequency } from "@/lib/plans/power-endurance/planEngine";

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
    if (
      !program ||
      (program.goalType !== "bouldering" &&
        program.goalType !== "route_power_endurance")
    ) {
      setPendingSlug(null);
      setMeta(null);
      return;
    }

    const slug =
      program.goalType === "route_power_endurance"
        ? getPEPendingSlug(
            program,
            program.frequency as PEFrequency,
            completedSessionLabelsForWeek12
          )
        : getBoulderingPendingSlug(
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
