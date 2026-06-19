/**
 * 4-day per week power-endurance plan (12 weeks).
 * Source: docs/PowerEndurance_Trainer/Power-Endurance 4 DaysWeek.md
 */

import type { PlanDefinition, WeekDefinition, SessionDefinition } from "./types";

function session(
  label: string,
  suggestedDay: string,
  title: string,
  intent: string,
  estimatedDuration: number,
  drillIds: string[]
): SessionDefinition {
  return {
    label,
    suggestedDay,
    title,
    intent,
    estimatedDuration,
    drills: drillIds.map((id) => ({ id })),
  };
}

function meso1Week(weekNum: 1 | 2 | 3): SessionDefinition[] {
  const hangId =
    weekNum === 1 ? "max_hang_pe_w1" : weekNum === 2 ? "max_hang_pe_w2" : "max_hang_pe_w3";
  const arcId =
    weekNum === 1 ? "arc_meso1_w1" : weekNum === 2 ? "arc_meso1_w2" : "arc_meso1_w3";
  const fbfId =
    weekNum === 1 ? "four_by_four_w1" : weekNum === 2 ? "four_by_four_w2" : "four_by_four_w3";
  const intId =
    weekNum === 1
      ? "route_intervals_w1"
      : weekNum === 2
        ? "route_intervals_w2"
        : "route_intervals_w3";
  const cafId =
    weekNum === 1 ? "caf_meso1_w1" : weekNum === 2 ? "caf_meso1_w2" : "caf_meso1_w3";

  return [
    session(
      "A",
      "Monday",
      "Max Hangs + Pulling + Antagonist",
      "Highest intensity — come in completely fresh",
      75,
      ["warmup_progressive", hangId, "pull_up_heavy", "antagonist_circuit"]
    ),
    session(
      "B",
      "Tuesday",
      "ARC Aerobic Base + Silent Feet + Fluency",
      "Lowest intensity — must feel like recovery",
      65,
      ["warmup_easy", arcId]
    ),
    session(
      "C",
      "Thursday",
      "Bouldering 4×4 + Route Intervals",
      "Anaerobic capacity + repeatability under incomplete rest",
      80,
      ["warmup_progressive", fbfId, intId, "core_circuit"]
    ),
    session(
      "D",
      "Saturday",
      "Crux-After-Fatigue Specificity",
      "Most specific session — 2 rest days beforehand",
      85,
      ["warmup_silent_feet", cafId]
    ),
  ];
}

function meso2Week(weekNum: 5 | 6 | 7): SessionDefinition[] {
  const arcId =
    weekNum === 5 ? "arc_meso2_w5" : weekNum === 6 ? "arc_meso2_w6" : "arc_meso2_w7";
  const cafId =
    weekNum === 5 ? "caf_meso2_w5" : weekNum === 6 ? "caf_meso2_w6" : "caf_meso2_w7";
  const thresholdDrill =
    weekNum === 6 ? "critical_force_w6" : weekNum === 5 ? "intermittent_hang_w5" : "intermittent_hang_w7";

  return [
    session(
      "A",
      "Monday",
      "Strength Maintenance + Campus + Antagonist",
      "Maintain strength; develop power",
      70,
      ["warmup_progressive", "max_hang_maintenance", "campus_pe", "antagonist_circuit"]
    ),
    session(
      "B",
      "Tuesday",
      "Continued Aerobic Base",
      "Stay at RPE 4-6 — do not let this become hard",
      60,
      ["warmup_easy", arcId]
    ),
    session(
      "C",
      "Thursday",
      "IHE or Critical-Force + Light Bouldering",
      "Threshold work alternating with CFB",
      75,
      ["warmup_progressive", thresholdDrill, "light_bouldering"]
    ),
    session(
      "D",
      "Saturday",
      "Enhanced Crux-After-Fatigue",
      "Longer lead-in; harder crux progression",
      90,
      ["warmup_silent_feet", cafId]
    ),
  ];
}

function meso3Week(weekNum: 9 | 10 | 11): SessionDefinition[] {
  const routeId =
    weekNum === 9
      ? "route_practice_w9"
      : weekNum === 10
        ? "route_practice_w10"
        : "route_practice_w11";
  const thresholdId =
    weekNum === 9
      ? "threshold_intervals_w9"
      : weekNum === 10
        ? "threshold_intervals_w10"
        : "threshold_intervals_w11";

  return [
    session(
      "A",
      "Monday",
      "Maintenance Hangs + Route Attempts",
      "Minimal strength; route-specific work",
      70,
      ["warmup_progressive", "max_hang_maintenance", routeId]
    ),
    session(
      "B",
      "Tuesday",
      "Active Recovery + Technique",
      "Very easy climbing; manage cumulative fatigue",
      50,
      ["warmup_easy", "arc_recovery"]
    ),
    session(
      "C",
      "Thursday",
      "Threshold Intervals + Mental Practice",
      "Sustained hard climbing at route pace",
      65,
      ["warmup_progressive", thresholdId]
    ),
    session(
      "D",
      "Saturday",
      "Crux-After-Fatigue / Performance",
      "Apply training to goal-route crux",
      85,
      ["warmup_silent_feet", "caf_meso2_w7"]
    ),
  ];
}

// Week 4 retest is folded into Session A: run the full assessment battery
// (via the assessment flow), then the deload work back-to-back the same day.
// Session A is marked complete once the retest assessment is saved.
const DELOAD_W4: SessionDefinition[] = [
  session(
    "A",
    "Monday",
    "Retest Assessment + Deload Hangs + Pulling + Antagonist",
    "Run the full retest battery, then reduced-volume strength back-to-back",
    140,
    ["warmup_progressive", "max_hang_deload", "pull_up_maintenance", "antagonist_light"]
  ),
  session("B", "Tuesday", "Deload ARC", "Single ARC set with constraints", 35, [
    "warmup_easy",
    "arc_deload",
  ]),
  session(
    "C",
    "Thursday",
    "Deload Intervals + Core",
    "Skip 4×4; light intervals only",
    45,
    ["warmup_progressive", "route_intervals_deload", "core_circuit"]
  ),
];

// Week 8 retest is folded into Session A (see Week 4 note above).
const DELOAD_W8: SessionDefinition[] = [
  session(
    "A",
    "Monday",
    "Retest Assessment + Deload Hangs + Campus + Antagonist",
    "Run the full retest battery, then reduced-volume strength back-to-back",
    135,
    ["warmup_progressive", "max_hang_deload", "campus_deload", "antagonist_light"]
  ),
  session("B", "Tuesday", "Deload ARC", "Single ARC set", 35, ["warmup_easy", "arc_deload"]),
  session(
    "C",
    "Thursday",
    "Deload IHE + Light Bouldering",
    "Skip CFB; reduced IHE",
    50,
    ["warmup_progressive", "intermittent_hang_deload", "light_bouldering"]
  ),
];

const WEEK12: SessionDefinition[] = [
  session(
    "A",
    "Monday",
    "Taper: Maintenance Hangs",
    "Minimal volume before performance",
    40,
    ["warmup_short", "max_hang_deload", "mobility_work"]
  ),
  session("B", "Tuesday", "Taper: Easy Climbing", "Very light movement", 35, [
    "warmup_easy",
    "arc_recovery",
  ]),
  session("C", "Thursday", "Taper: Movement Prep", "Light warm-up only", 30, [
    "warmup_short",
  ]),
  session(
    "D",
    "Saturday",
    "Performance + Final Assessment",
    "Taper week performance day",
    90,
    ["warmup_progressive", "assessment_battery"]
  ),
];

function week(
  weekNumber: number,
  mesocycle: 1 | 2 | 3,
  isDeload: boolean,
  isTestWeek: boolean,
  educationSlug: string | null,
  sessions: SessionDefinition[]
): WeekDefinition {
  return {
    weekNumber,
    mesocycle,
    isDeload,
    isTestWeek,
    educationSlug,
    sessions,
  };
}

export const plan4Day: PlanDefinition = {
  frequency: 4,
  weeks: [
    week(1, 1, false, false, "pe-meso1-aerobic-foundation", meso1Week(1)),
    week(2, 1, false, false, null, meso1Week(2)),
    week(3, 1, false, false, null, meso1Week(3)),
    week(4, 1, true, true, "pe-why-deload", DELOAD_W4),
    week(5, 2, false, false, "pe-meso2-threshold-work", meso2Week(5)),
    week(6, 2, false, false, "pe-critical-force-explained", meso2Week(6)),
    week(7, 2, false, false, null, meso2Week(7)),
    week(8, 2, true, true, "pe-mid-program-check", DELOAD_W8),
    week(9, 3, false, false, "pe-meso3-redpoint-focus", meso3Week(9)),
    week(10, 3, false, false, null, meso3Week(10)),
    week(11, 3, false, false, null, meso3Week(11)),
    week(12, 3, true, true, "pe-taper-performance", WEEK12),
  ],
};
