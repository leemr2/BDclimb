/**
 * Resolve pending education slug for the current program week.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 5.
 */

import type { ActiveProgram } from "@/lib/firebase/training/program";
import {
  getWeekDefinition,
  isWeekFullyComplete,
  type BoulderingFrequency,
} from "@/lib/plans/bouldering/planEngine";

const INTRO_SLUG = "bouldering-intro-why-test";
const PROGRAM_COMPLETE_SLUG = "bouldering-program-complete";

export function getPendingEducationSlug(
  program: ActiveProgram,
  frequency: BoulderingFrequency,
  completedSessionLabelsForWeek12: string[] = []
): string | null {
  const seen = new Set(program.seenEducationSlugs ?? []);
  const candidates: string[] = [];

  if (program.currentWeek === 0 && program.status === "assessment") {
    candidates.push(INTRO_SLUG);
  }

  const weekDef = getWeekDefinition(frequency, program.currentWeek);
  if (weekDef?.educationSlug) {
    candidates.push(weekDef.educationSlug);
  }

  if (
    program.currentWeek >= 12 &&
    isWeekFullyComplete(frequency, 12, completedSessionLabelsForWeek12)
  ) {
    candidates.push(PROGRAM_COMPLETE_SLUG);
  }

  for (const slug of candidates) {
    if (!seen.has(slug)) return slug;
  }

  return null;
}
