/**
 * 4-day per week bouldering plan (12 weeks).
 * Source: docs/Bouldering_Trainer/4 Day per Week Bouldering Plan.md
 */

import type { PlanDefinition, WeekDefinition, SessionDefinition } from "./types";

const SESSION_A_MESO1: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Max Hangs + Limit Bouldering (Power Focus)",
  intent: "High neural output — your freshest day of the week",
  estimatedDuration: 90,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_strength" },
    { id: "limit_bouldering_power" },
  ],
};

const SESSION_B_MESO1: SessionDefinition = {
  label: "B",
  suggestedDay: "Tuesday",
  title: "Antagonists + Technical Volume + Mobility",
  intent: "Active recovery — antagonists, easy technical climbing, mobility",
  estimatedDuration: 75,
  drills: [
    { id: "antagonist_circuit" },
    { id: "technical_easy_climbing" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_MESO1: SessionDefinition = {
  label: "C",
  suggestedDay: "Thursday",
  title: "Max Hangs + Limit Bouldering (Technical/Crimpy Focus)",
  intent: "Second max hang day; vertical/technical limit bouldering + core",
  estimatedDuration: 90,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_strength" },
    { id: "limit_bouldering_technical" },
    { id: "core_circuit" },
  ],
};

const SESSION_D_MESO1: SessionDefinition = {
  label: "D",
  suggestedDay: "Saturday",
  title: "Pulling Strength + Limit Bouldering (Mixed Styles)",
  intent: "Weighted pull-ups and mixed-style limit bouldering; light antagonists",
  estimatedDuration: 95,
  drills: [
    { id: "warmup_short" },
    { id: "pull_ups" },
    { id: "limit_bouldering_mixed" },
    { id: "antagonist_light" },
  ],
};

const SESSION_A_DELOAD_4: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Max Hang Retest + Easy Bouldering",
  intent: "Deload — max hang retest, easy bouldering, light mobility",
  estimatedDuration: 55,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_retest" },
    { id: "easy_bouldering_20" },
    { id: "mobility_15" },
  ],
};

const SESSION_B_DELOAD_4: SessionDefinition = {
  label: "B",
  suggestedDay: "Tuesday",
  title: "Antagonists + Easy Climbing",
  intent: "Deload — 2 sets antagonists, 30 min easy climbing, extended mobility",
  estimatedDuration: 55,
  drills: [
    { id: "antagonist_light" },
    { id: "easy_climbing_30" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_DELOAD_4: SessionDefinition = {
  label: "C",
  suggestedDay: "Thursday",
  title: "Light Technique Bouldering",
  intent: "Deload — 40 min movement quality, no intensity; mobility",
  estimatedDuration: 45,
  drills: [{ id: "easy_bouldering_40" }, { id: "mobility_work" }],
};

const SESSION_D_DELOAD_4: SessionDefinition = {
  label: "D",
  suggestedDay: "Saturday",
  title: "Benchmark Retest + Pull-Up Test",
  intent: "Limit boulder benchmark retest; find new 3-5RM; easy volume",
  estimatedDuration: 60,
  drills: [
    { id: "warmup_short" },
    { id: "benchmark_retest" },
    { id: "pull_up_test" },
    { id: "easy_bouldering_20" },
  ],
};

const SESSION_A_MESO2: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Campus Board + Power Bouldering",
  intent: "Power/RFD — campus work and dynamic/explosive bouldering",
  estimatedDuration: 100,
  drills: [
    { id: "warmup_extended" },
    { id: "campus_work" },
    { id: "limit_bouldering_dynamic" },
    { id: "max_hang_maintenance" },
  ],
};

const SESSION_B_MESO2: SessionDefinition = {
  label: "B",
  suggestedDay: "Tuesday",
  title: "Active Recovery + Technique Refinement",
  intent: "Easy climbing volume, light antagonists, mobility",
  estimatedDuration: 70,
  drills: [
    { id: "technical_easy_climbing" },
    { id: "antagonist_light" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_MESO2: SessionDefinition = {
  label: "C",
  suggestedDay: "Thursday",
  title: "Max Hangs + Coordination Bouldering",
  intent: "Max hang maintenance (4 sets); coordination/technical limit bouldering + core",
  estimatedDuration: 75,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_maintenance" },
    { id: "limit_bouldering_coordination" },
    { id: "core_circuit" },
  ],
};

const SESSION_D_MESO2: SessionDefinition = {
  label: "D",
  suggestedDay: "Saturday",
  title: "Limit Bouldering Volume + Pulling Strength",
  intent: "High volume limit bouldering (mixed styles); weighted pull-ups; light antagonists",
  estimatedDuration: 90,
  drills: [
    { id: "warmup_short" },
    { id: "pull_ups_4set" },
    { id: "limit_bouldering_mixed" },
    { id: "antagonist_light" },
  ],
};

const SESSION_A_DELOAD_8: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Campus Test + Light Explosive Bouldering",
  intent: "Deload — campus max reach test; light explosive bouldering; mobility",
  estimatedDuration: 50,
  drills: [
    { id: "warmup_extended" },
    { id: "easy_bouldering_20" },
    { id: "mobility_15" },
  ],
};

const SESSION_B_DELOAD_8: SessionDefinition = {
  label: "B",
  suggestedDay: "Tuesday",
  title: "Easy Climbing + Antagonists",
  intent: "Deload — 40 min easy climbing, 2 sets antagonists, mobility",
  estimatedDuration: 55,
  drills: [
    { id: "easy_climbing_30" },
    { id: "antagonist_light" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_DELOAD_8: SessionDefinition = {
  label: "C",
  suggestedDay: "Thursday",
  title: "Max Hang Check + Easy Bouldering",
  intent: "Max hang check: 4 sets × 7s at 90%; easy technique bouldering; core 2 sets",
  estimatedDuration: 55,
  drills: [
    { id: "warmup_short" },
    { id: "max_hang_maintenance_3x7" },
    { id: "easy_bouldering_20" },
    { id: "core_circuit_2set" },
  ],
};

const SESSION_D_DELOAD_8: SessionDefinition = {
  label: "D",
  suggestedDay: "Saturday",
  title: "Pull-Up Test + Easy Bouldering",
  intent: "Deload — new 3-5RM; easy bouldering; light antagonists",
  estimatedDuration: 50,
  drills: [
    { id: "pull_up_test" },
    { id: "easy_bouldering_40" },
    { id: "antagonist_light" },
  ],
};

const SESSION_A_MESO3: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Project Bouldering + Finger Maintenance",
  intent: "Peak performance — 2-4 project problems; max hang maintenance",
  estimatedDuration: 80,
  drills: [
    { id: "warmup_progressive" },
    { id: "project_bouldering" },
    { id: "max_hang_maintenance_3x7" },
  ],
};

const SESSION_B_MESO3: SessionDefinition = {
  label: "B",
  suggestedDay: "Tuesday",
  title: "Movement Quality + Light Volume",
  intent: "Movement-focused climbing, antagonists, mobility + visualization",
  estimatedDuration: 65,
  drills: [
    { id: "technical_easy_climbing" },
    { id: "antagonist_circuit" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_MESO3: SessionDefinition = {
  label: "C",
  suggestedDay: "Thursday",
  title: "Performance Attempts (Fresh Problems)",
  intent: "5-7 problems at or near limit; competition-style; core maintenance",
  estimatedDuration: 75,
  drills: [
    { id: "warmup_progressive" },
    { id: "performance_attempts" },
    { id: "core_circuit_2set" },
  ],
};

const SESSION_D_MESO3: SessionDefinition = {
  label: "D",
  suggestedDay: "Saturday",
  title: "Mixed Volume + Strength Maintenance",
  intent: "Weighted pull-ups (maintenance); mixed bouldering volume; light antagonists",
  estimatedDuration: 85,
  drills: [
    { id: "warmup_short" },
    { id: "pull_ups_3set" },
    { id: "mixed_volume" },
    { id: "antagonist_light" },
  ],
};

const SESSION_A_WEEK12: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Max Hang Test + Easy Bouldering",
  intent: "Taper — final max hang test; easy bouldering; mobility",
  estimatedDuration: 55,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_retest" },
    { id: "easy_bouldering_20" },
    { id: "mobility_15" },
  ],
};

const SESSION_B_WEEK12: SessionDefinition = {
  label: "B",
  suggestedDay: "Tuesday",
  title: "Easy Climbing + Mobility",
  intent: "Taper — 30-40 min easy climbing; light antagonists; mobility",
  estimatedDuration: 50,
  drills: [
    { id: "easy_climbing_30" },
    { id: "antagonist_light" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_WEEK12: SessionDefinition = {
  label: "C",
  suggestedDay: "Thursday",
  title: "Light Warm-Up + Movement Prep",
  intent: "Taper — light warm-up, movement prep, rest",
  estimatedDuration: 35,
  drills: [{ id: "warmup_short" }],
};

const SESSION_D_WEEK12: SessionDefinition = {
  label: "D",
  suggestedDay: "Saturday",
  title: "Performance Day",
  intent: "Final assessment — benchmark reattempts + peak performance attempts",
  estimatedDuration: 100,
  drills: [
    { id: "warmup_progressive" },
    { id: "benchmark_retest" },
    { id: "performance_attempts" },
  ],
};

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
    week(1, 1, false, false, "bouldering-meso1-max-strength", [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
      SESSION_C_MESO1,
      SESSION_D_MESO1,
    ]),
    week(2, 1, false, false, null, [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
      SESSION_C_MESO1,
      SESSION_D_MESO1,
    ]),
    week(3, 1, false, false, null, [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
      SESSION_C_MESO1,
      SESSION_D_MESO1,
    ]),
    week(4, 1, true, true, "bouldering-why-deload", [
      SESSION_A_DELOAD_4,
      SESSION_B_DELOAD_4,
      SESSION_C_DELOAD_4,
      SESSION_D_DELOAD_4,
    ]),
    week(5, 2, false, false, "bouldering-meso2-power-rfd", [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
      SESSION_C_MESO2,
      SESSION_D_MESO2,
    ]),
    week(6, 2, false, false, "bouldering-campus-safety", [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
      SESSION_C_MESO2,
      SESSION_D_MESO2,
    ]),
    week(7, 2, false, false, null, [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
      SESSION_C_MESO2,
      SESSION_D_MESO2,
    ]),
    week(8, 2, true, true, "bouldering-mid-program-check", [
      SESSION_A_DELOAD_8,
      SESSION_B_DELOAD_8,
      SESSION_C_DELOAD_8,
      SESSION_D_DELOAD_8,
    ]),
    week(9, 3, false, false, "bouldering-meso3-performance", [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
      SESSION_C_MESO3,
      SESSION_D_MESO3,
    ]),
    week(10, 3, false, false, null, [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
      SESSION_C_MESO3,
      SESSION_D_MESO3,
    ]),
    week(11, 3, false, false, null, [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
      SESSION_C_MESO3,
      SESSION_D_MESO3,
    ]),
    week(12, 3, true, true, "bouldering-taper-peak", [
      SESSION_A_WEEK12,
      SESSION_B_WEEK12,
      SESSION_C_WEEK12,
      SESSION_D_WEEK12,
    ]),
  ],
};
