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

/**
 * Which screen is requesting the milestone.
 * - "assessment": the Week 0 baseline assessment flow (intro fires here on launch).
 * - "dashboard": the program dashboard (every milestone except the pre-assessment intro).
 */
export type EducationSurface = "dashboard" | "assessment";

export function getPendingEducationSlug(
  program: ActiveProgram,
  frequency: BoulderingFrequency,
  completedSessionLabelsForWeek12: string[] = [],
  surface: EducationSurface = "dashboard"
): string | null {
  const seen = new Set(program.seenEducationSlugs ?? []);

  // The "why we test" intro belongs to the assessment launch, not the dashboard.
  if (surface === "assessment") {
    if (
      program.currentWeek === 0 &&
      program.status === "assessment" &&
      !seen.has(INTRO_SLUG)
    ) {
      return INTRO_SLUG;
    }
    return null;
  }

  const candidates: string[] = [];

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
