/**
 * 3-day per week power-endurance plan (12 weeks).
 * Source: docs/PowerEndurance_Trainer/Power-Endurance Plan 3 days a Week.md
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
  const longId =
    weekNum === 1
      ? "long_intervals_w1"
      : weekNum === 2
        ? "long_intervals_w2"
        : "long_intervals_w3";
  const fbfId =
    weekNum === 1 ? "four_by_four_w1" : weekNum === 2 ? "four_by_four_w2" : "four_by_four_w3";
  const cafId =
    weekNum === 1 ? "caf_meso1_w1" : weekNum === 2 ? "caf_meso1_w2" : "caf_meso1_w3";
  const hangId =
    weekNum === 1 ? "max_hang_pe_w1" : weekNum === 2 ? "max_hang_pe_w2" : "max_hang_pe_w3";

  return [
    session(
      "A",
      "Monday",
      "Long Intervals + Fluency Constraint",
      "Aerobic base with movement economy tracking",
      70,
      ["warmup_easy", longId]
    ),
    session(
      "B",
      "Friday",
      "4×4 + Crux-After-Fatigue",
      "Capacity builder then specificity drill",
      85,
      ["warmup_silent_feet", fbfId, cafId]
    ),
    session(
      "C",
      "Wednesday",
      "Max Hangs + Antagonist",
      "Strength separated from endurance days",
      65,
      ["warmup_progressive", hangId, "antagonist_circuit"]
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
      "Monday",
      "Threshold ARC + Fluency",
      "Continued aerobic work with constraints",
      65,
      ["warmup_easy", "arc_meso2_w5"]
    ),
    session(
      "B",
      "Friday",
      "4×4 + Enhanced Crux Simulation",
      "Harder crux under fatigue",
      90,
      ["warmup_silent_feet", "four_by_four_w3", cafId]
    ),
    session(
      "C",
      "Wednesday",
      "Maintenance Hangs + IHE/CFB",
      "Strength maintenance mid-week",
      70,
      ["warmup_progressive", "max_hang_maintenance", thresholdDrill, "antagonist_circuit"]
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
      "Route Attempts + Fluency Rehearsal",
      "Goal-route focused burns",
      75,
      ["warmup_progressive", routeId]
    ),
    session(
      "B",
      "Friday",
      "Crux Simulation + Performance",
      "Apply linking work to crux execution",
      85,
      ["warmup_silent_feet", "caf_meso2_w7"]
    ),
    session(
      "C",
      "Wednesday",
      "Threshold Intervals",
      "Sustained hard climbing",
      65,
      ["warmup_progressive", thresholdId, "antagonist_light"]
    ),
  ];
}

const DELOAD_W4: SessionDefinition[] = [
  session("A", "Monday", "Deload Intervals", "Reduced volume", 40, [
    "warmup_easy",
    "long_intervals_w1",
  ]),
  session("B", "Friday", "Deload 4×4 + Light CAF", "Reduced rounds", 60, [
    "warmup_silent_feet",
    "four_by_four_w1",
    "caf_meso1_w1",
  ]),
  session("C", "Wednesday", "Deload Hangs", "Light strength", 40, [
    "warmup_progressive",
    "max_hang_deload",
    "antagonist_light",
  ]),
  session("D", "Saturday", "Assessment Retest", "Full assessment battery", 90, [
    "assessment_battery",
  ]),
];

const DELOAD_W8: SessionDefinition[] = [
  session("A", "Monday", "Deload ARC", "Easy aerobic", 35, ["warmup_easy", "arc_deload"]),
  session("B", "Friday", "Deload Crux Sim", "Light specificity", 55, [
    "warmup_silent_feet",
    "caf_meso1_w2",
  ]),
  session("C", "Wednesday", "Deload IHE", "Reduced threshold", 45, [
    "warmup_progressive",
    "intermittent_hang_deload",
    "antagonist_light",
  ]),
  session("D", "Saturday", "Assessment Retest", "Full assessment battery", 90, [
    "assessment_battery",
  ]),
];

const WEEK12: SessionDefinition[] = [
  session("A", "Monday", "Taper Route Work", "Light route touches", 45, [
    "warmup_short",
    "route_practice_w11",
  ]),
  session("B", "Friday", "Taper Performance", "Minimal crux work", 50, [
    "warmup_silent_feet",
    "caf_meso1_w1",
  ]),
  session("C", "Wednesday", "Taper Mobility", "Recovery", 30, ["mobility_work"]),
  session("D", "Saturday", "Final Assessment", "Week 12 performance test", 90, [
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

export const plan3Day: PlanDefinition = {
  frequency: 3,
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
