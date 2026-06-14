/**
 * 2-day per week power-endurance plan (12 weeks).
 * Source: docs/PowerEndurance_Trainer/Power-Endurance 2 DaysWeek.md
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
  const arcId =
    weekNum === 1 ? "arc_meso1_w1" : weekNum === 2 ? "arc_meso1_w2" : "arc_meso1_w3";
  const cafId =
    weekNum === 1 ? "caf_meso1_w1" : weekNum === 2 ? "caf_meso1_w2" : "caf_meso1_w3";
  const fbfId =
    weekNum === 1 ? "four_by_four_w1" : weekNum === 2 ? "four_by_four_w2" : "four_by_four_w3";

  return [
    session(
      "A",
      "Tuesday",
      "Strength + Aerobic Base",
      "Max hangs first when fresh, then ARC",
      95,
      ["warmup_progressive", "combined_strength_aerobic", "combined_aerobic_arc"]
    ),
    session(
      "B",
      "Friday",
      "4×4 + Crux-After-Fatigue",
      "Power-endurance + specificity combined",
      90,
      ["warmup_silent_feet", fbfId, cafId]
    ),
  ];
}

function meso2Week(weekNum: 5 | 6 | 7): SessionDefinition[] {
  const cafId =
    weekNum === 5 ? "caf_meso2_w5" : weekNum === 6 ? "caf_meso2_w6" : "caf_meso2_w7";
  const thresholdDrill =
    weekNum === 6 ? "critical_force_w6" : weekNum === 5 ? "intermittent_hang_w5" : "intermittent_hang_w7";

  return [
    session(
      "A",
      "Tuesday",
      "Maintenance Strength + IHE/CFB",
      "Strength maintenance then threshold work",
      85,
      ["warmup_progressive", "max_hang_maintenance", thresholdDrill]
    ),
    session(
      "B",
      "Friday",
      "4×4 + Enhanced Crux Simulation",
      "Capacity and specificity",
      95,
      ["warmup_silent_feet", "four_by_four_w3", cafId]
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

  return [
    session(
      "A",
      "Tuesday",
      "Route Attempts + Threshold",
      "Goal-route work when freshest",
      80,
      ["warmup_progressive", routeId, "threshold_intervals_w9"]
    ),
    session(
      "B",
      "Friday",
      "Crux Performance Session",
      "Redpoint-focused crux simulation",
      85,
      ["warmup_silent_feet", "caf_meso2_w7"]
    ),
  ];
}

const DELOAD_W4: SessionDefinition[] = [
  session("A", "Tuesday", "Deload Strength + ARC", "Reduced combined session", 55, [
    "warmup_progressive",
    "max_hang_deload",
    "arc_deload",
  ]),
  session("B", "Friday", "Deload 4×4 + CAF", "Light specificity", 60, [
    "warmup_silent_feet",
    "four_by_four_w1",
    "caf_meso1_w1",
  ]),
  session("C", "Saturday", "Assessment Retest", "Full assessment battery", 90, [
    "assessment_battery",
  ]),
];

const DELOAD_W8: SessionDefinition[] = [
  session("A", "Tuesday", "Deload Maintenance", "Light strength + IHE", 50, [
    "warmup_progressive",
    "max_hang_deload",
    "intermittent_hang_deload",
  ]),
  session("B", "Friday", "Deload Crux Sim", "Reduced rounds", 55, [
    "warmup_silent_feet",
    "caf_meso1_w2",
  ]),
  session("C", "Saturday", "Assessment Retest", "Full assessment battery", 90, [
    "assessment_battery",
  ]),
];

const WEEK12: SessionDefinition[] = [
  session("A", "Tuesday", "Taper Route Touches", "Minimal volume", 40, [
    "warmup_short",
    "route_practice_w11",
  ]),
  session("B", "Friday", "Taper Performance", "Light crux work", 45, [
    "warmup_silent_feet",
    "caf_meso1_w1",
  ]),
  session("C", "Saturday", "Final Assessment", "Week 12 performance test", 90, [
    "assessment_battery",
  ]),
];

function week(
  weekNumber: number,
  mesocycle: 1 | 2 | 3,
  isDeload: boolean,
  isTestWeek: boolean,
  educationSlug: string | null,
  sessions: SessionDefinition[]
): WeekDefinition {
  return { weekNumber, mesocycle, isDeload, isTestWeek, educationSlug, sessions };
}

export const plan2Day: PlanDefinition = {
  frequency: 2,
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
