/**
 * 2-day per week bouldering plan (12 weeks).
 * Source: docs/Bouldering_Trainer/Bouldering 2 dayweek Plan.md
 */

import type { PlanDefinition, WeekDefinition, SessionDefinition } from "./types";

const SESSION_A_MESO1: SessionDefinition = {
  label: "A",
  suggestedDay: "Tuesday",
  title: "Max Hangs + Limit Bouldering + Pulling Strength",
  intent: "High neural output — your freshest day; max hangs and limit bouldering combined",
  estimatedDuration: 100,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_strength" },
    { id: "limit_bouldering_power" },
    { id: "pull_ups" },
  ],
};

const SESSION_B_MESO1: SessionDefinition = {
  label: "B",
  suggestedDay: "Friday",
  title: "Limit Bouldering Focus + Antagonists",
  intent: "High volume limit bouldering, different styles; antagonists and core",
  estimatedDuration: 95,
  drills: [
    { id: "warmup_short" },
    { id: "limit_bouldering_volume" },
    { id: "antagonist_circuit" },
    { id: "core_circuit_2set" },
  ],
};

const SESSION_A_DELOAD_4: SessionDefinition = {
  label: "A",
  suggestedDay: "Tuesday",
  title: "Max Hang Retest + Easy Climbing",
  intent: "Deload week — retest max hang, light volume",
  estimatedDuration: 60,
  drills: [
    { id: "warmup_progressive" },
    { id: "max_hang_retest" },
    { id: "easy_bouldering_20" },
    { id: "antagonist_light" },
  ],
};

const SESSION_B_DELOAD_4: SessionDefinition = {
  label: "B",
  suggestedDay: "Friday",
  title: "Benchmark Retest",
  intent: "Limit boulder benchmark retest (same problems as Week 0)",
  estimatedDuration: 50,
  drills: [
    { id: "warmup_short" },
    { id: "benchmark_retest" },
    { id: "easy_bouldering_20" },
  ],
};

const SESSION_A_MESO2: SessionDefinition = {
  label: "A",
  suggestedDay: "Tuesday",
  title: "Campus Board + Max Hang Maintenance + Power Bouldering",
  intent: "Power/RFD development; campus and max hang maintenance",
  estimatedDuration: 95,
  drills: [
    { id: "warmup_extended" },
    { id: "campus_work" },
    { id: "max_hang_maintenance" },
    { id: "limit_bouldering_dynamic" },
  ],
};

const SESSION_B_MESO2: SessionDefinition = {
  label: "B",
  suggestedDay: "Friday",
  title: "Coordination Bouldering + Pull-Ups + Core",
  intent: "Technical/coordination limit bouldering; strength maintenance",
  estimatedDuration: 90,
  drills: [
    { id: "warmup_short" },
    { id: "limit_bouldering_coordination" },
    { id: "pull_ups_4set" },
    { id: "core_circuit" },
  ],
};

const SESSION_A_DELOAD_8: SessionDefinition = {
  label: "A",
  suggestedDay: "Tuesday",
  title: "Campus Test + Max Hang Check",
  intent: "Deload — campus max reach test, max hang check",
  estimatedDuration: 50,
  drills: [
    { id: "warmup_extended" },
    { id: "max_hang_maintenance" },
    { id: "easy_bouldering_20" },
  ],
};

const SESSION_B_DELOAD_8: SessionDefinition = {
  label: "B",
  suggestedDay: "Friday",
  title: "Easy Bouldering + Mobility",
  intent: "Deload — easy volume, mobility, light antagonists",
  estimatedDuration: 50,
  drills: [
    { id: "easy_bouldering_40" },
    { id: "mobility_work" },
    { id: "antagonist_light" },
  ],
};

const SESSION_A_MESO3: SessionDefinition = {
  label: "A",
  suggestedDay: "Tuesday",
  title: "Project Bouldering + Finger Maintenance",
  intent: "Peak performance — project work, max hang maintenance",
  estimatedDuration: 85,
  drills: [
    { id: "warmup_progressive" },
    { id: "project_bouldering" },
    { id: "max_hang_maintenance_3x7" },
  ],
};

const SESSION_B_MESO3: SessionDefinition = {
  label: "B",
  suggestedDay: "Friday",
  title: "Performance Attempts + Volume",
  intent: "Peak attempts then easy-moderate volume",
  estimatedDuration: 90,
  drills: [
    { id: "warmup_progressive" },
    { id: "performance_attempts" },
    { id: "easy_climbing_30" },
    { id: "antagonist_light" },
  ],
};

const SESSION_A_WEEK12: SessionDefinition = {
  label: "A",
  suggestedDay: "Tuesday",
  title: "Max Hang Test + Easy Bouldering",
  intent: "Taper — final max hang test, light movement",
  estimatedDuration: 50,
  drills: [
    { id: "warmup_short" },
    { id: "max_hang_retest" },
    { id: "easy_bouldering_20" },
    { id: "mobility_15" },
  ],
};

const SESSION_B_WEEK12: SessionDefinition = {
  label: "B",
  suggestedDay: "Friday",
  title: "Performance Day",
  intent: "Final assessment — benchmark reattempts + new limit attempts",
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

export const plan2Day: PlanDefinition = {
  frequency: 2,
  weeks: [
    week(1, 1, false, false, "bouldering-meso1-max-strength", [
      SESSION_A_MESO1,
      SESSION_B_MESO1,
    ]),
    week(2, 1, false, false, null, [SESSION_A_MESO1, SESSION_B_MESO1]),
    week(3, 1, false, false, null, [SESSION_A_MESO1, SESSION_B_MESO1]),
    week(4, 1, true, true, "bouldering-why-deload", [
      SESSION_A_DELOAD_4,
      SESSION_B_DELOAD_4,
    ]),
    week(5, 2, false, false, "bouldering-meso2-power-rfd", [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
    ]),
    week(6, 2, false, false, "bouldering-campus-safety", [
      SESSION_A_MESO2,
      SESSION_B_MESO2,
    ]),
    week(7, 2, false, false, null, [SESSION_A_MESO2, SESSION_B_MESO2]),
    week(8, 2, true, true, "bouldering-mid-program-check", [
      SESSION_A_DELOAD_8,
      SESSION_B_DELOAD_8,
    ]),
    week(9, 3, false, false, "bouldering-meso3-performance", [
      SESSION_A_MESO3,
      SESSION_B_MESO3,
    ]),
    week(10, 3, false, false, null, [SESSION_A_MESO3, SESSION_B_MESO3]),
    week(11, 3, false, false, null, [SESSION_A_MESO3, SESSION_B_MESO3]),
    week(12, 3, true, true, "bouldering-taper-peak", [
      SESSION_A_WEEK12,
      SESSION_B_WEEK12,
    ]),
  ],
};
