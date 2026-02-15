/**
 * 3-day per week bouldering plan (12 weeks).
 * Source: docs/Bouldering_Trainer/Bouldering 3 Dayweek Plan.md
 */

import type { PlanDefinition, WeekDefinition, SessionDefinition } from "./types";

const SESSION_A_MESO1: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Max Hangs + Limit Bouldering",
  intent: "High neural output — freshest day; max hangs and limit bouldering",
  estimatedDuration: 85,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_strength" },
    { id: "limit_bouldering_power" },
  ],
};

const SESSION_B_MESO1: SessionDefinition = {
  label: "B",
  suggestedDay: "Wednesday",
  title: "Antagonist Work + Technical Volume",
  intent: "Recovery day — antagonists and easy technical climbing",
  estimatedDuration: 60,
  drills: [
    { id: "antagonist_circuit" },
    { id: "technical_easy_climbing" },
  ],
};

const SESSION_C_MESO1: SessionDefinition = {
  label: "C",
  suggestedDay: "Friday",
  title: "Pulling Strength + Limit Bouldering (Different Style)",
  intent: "Pulling strength and limit bouldering in a different style from Monday",
  estimatedDuration: 85,
  drills: [
    { id: "warmup_short" },
    { id: "pull_ups_4set" },
    { id: "limit_bouldering_technical" },
  ],
};

const SESSION_A_DELOAD_4: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Max Hang Retest",
  intent: "Deload — max hang retest (same protocol as Week 0)",
  estimatedDuration: 45,
  drills: [{ id: "warmup_progressive" }, { id: "max_hang_retest" }],
};

const SESSION_B_DELOAD_4: SessionDefinition = {
  label: "B",
  suggestedDay: "Wednesday",
  title: "Easy Climbing + Mobility",
  intent: "Deload — easy climbing only, mobility work",
  estimatedDuration: 35,
  drills: [{ id: "easy_climbing_30" }, { id: "mobility_work" }],
};

const SESSION_C_DELOAD_4: SessionDefinition = {
  label: "C",
  suggestedDay: "Friday",
  title: "Benchmark Retest",
  intent: "Limit boulder benchmark retest (same 3-5 problems from Week 0)",
  estimatedDuration: 50,
  drills: [{ id: "warmup_short" }, { id: "benchmark_retest" }],
};

const SESSION_A_MESO2: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Campus Board + Dynamic Limit Boulders",
  intent: "Power/RFD — campus work and dynamic bouldering",
  estimatedDuration: 85,
  drills: [
    { id: "warmup_extended" },
    { id: "campus_work" },
    { id: "limit_bouldering_dynamic" },
  ],
};

const SESSION_B_MESO2: SessionDefinition = {
  label: "B",
  suggestedDay: "Wednesday",
  title: "Max Hang Maintenance + Easy Volume",
  intent: "Maintain max hang; easy climbing below pump",
  estimatedDuration: 55,
  drills: [
    { id: "warmup_short" },
    { id: "max_hang_maintenance" },
    { id: "easy_climbing_30" },
  ],
};

const SESSION_C_MESO2: SessionDefinition = {
  label: "C",
  suggestedDay: "Friday",
  title: "Coordination Bouldering + Core",
  intent: "Coordination-focused limit bouldering and core",
  estimatedDuration: 75,
  drills: [
    { id: "warmup_short" },
    { id: "limit_bouldering_coordination" },
    { id: "core_circuit" },
  ],
};

const SESSION_A_DELOAD_8: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Campus Max Reach Test",
  intent: "Deload — campus test if doing campus training",
  estimatedDuration: 40,
  drills: [{ id: "warmup_extended" }],
};

const SESSION_B_DELOAD_8: SessionDefinition = {
  label: "B",
  suggestedDay: "Wednesday",
  title: "Rest or Easy Climbing",
  intent: "Rest or 20 min easy climbing",
  estimatedDuration: 20,
  drills: [{ id: "easy_bouldering_20" }],
};

const SESSION_C_DELOAD_8: SessionDefinition = {
  label: "C",
  suggestedDay: "Friday",
  title: "Max Hang Check",
  intent: "Max hang check: 4 sets × 7s at 90%, record best",
  estimatedDuration: 40,
  drills: [
    { id: "warmup_short" },
    { id: "max_hang_maintenance_3x7" },
  ],
};

const SESSION_A_MESO3: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Project-Style Limit Bouldering",
  intent: "Project boulders at absolute limit; finger maintenance",
  estimatedDuration: 80,
  drills: [
    { id: "warmup_progressive" },
    { id: "project_bouldering" },
    { id: "max_hang_maintenance_3x7" },
  ],
};

const SESSION_B_MESO3: SessionDefinition = {
  label: "B",
  suggestedDay: "Wednesday",
  title: "Active Recovery + Technique Refinement",
  intent: "Easy volume, light antagonists, mobility",
  estimatedDuration: 65,
  drills: [
    { id: "technical_easy_climbing" },
    { id: "antagonist_light" },
    { id: "mobility_work" },
  ],
};

const SESSION_C_MESO3: SessionDefinition = {
  label: "C",
  suggestedDay: "Friday",
  title: "Performance Attempts",
  intent: "Peak attempts — comp-style burns on limit problems",
  estimatedDuration: 70,
  drills: [
    { id: "warmup_progressive" },
    { id: "performance_attempts" },
  ],
};

const SESSION_A_WEEK12: SessionDefinition = {
  label: "A",
  suggestedDay: "Monday",
  title: "Light Warm-Up + Max Hangs",
  intent: "Taper — light warm-up, 2 sets max hangs at 85%",
  estimatedDuration: 35,
  drills: [{ id: "warmup_short" }],
};

const SESSION_B_WEEK12: SessionDefinition = {
  label: "B",
  suggestedDay: "Wednesday",
  title: "Rest or Easy Movement",
  intent: "Rest or 15 min very easy movement",
  estimatedDuration: 15,
  drills: [],
};

const SESSION_C_WEEK12: SessionDefinition = {
  label: "C",
  suggestedDay: "Friday",
  title: "Performance Day",
  intent: "Final assessment — benchmark + new limit problems",
  estimatedDuration: 90,
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

export const plan3Day: PlanDefinition = {
  frequency: 3,
  weeks: [
    week(1, 1, false, false, "bouldering-meso1-max-strength", [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
      SESSION_C_MESO1,
    ]),
    week(2, 1, false, false, null, [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
      SESSION_C_MESO1,
    ]),
    week(3, 1, false, false, null, [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
      SESSION_C_MESO1,
    ]),
    week(4, 1, true, true, "bouldering-why-deload", [
      SESSION_A_DELOAD_4,
      SESSION_B_DELOAD_4,
      SESSION_C_DELOAD_4,
    ]),
    week(5, 2, false, false, "bouldering-meso2-power-rfd", [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
      SESSION_C_MESO2,
    ]),
    week(6, 2, false, false, "bouldering-campus-safety", [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
      SESSION_C_MESO2,
    ]),
    week(7, 2, false, false, null, [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
      SESSION_C_MESO2,
    ]),
    week(8, 2, true, true, "bouldering-mid-program-check", [
      SESSION_A_DELOAD_8,
      SESSION_B_DELOAD_8,
      SESSION_C_DELOAD_8,
    ]),
    week(9, 3, false, false, "bouldering-meso3-performance", [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
      SESSION_C_MESO3,
    ]),
    week(10, 3, false, false, null, [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
      SESSION_C_MESO3,
    ]),
    week(11, 3, false, false, null, [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
      SESSION_C_MESO3,
    ]),
    week(12, 3, true, true, "bouldering-taper-peak", [
      SESSION_A_WEEK12,
      SESSION_B_WEEK12,
      SESSION_C_WEEK12,
    ]),
  ],
};
