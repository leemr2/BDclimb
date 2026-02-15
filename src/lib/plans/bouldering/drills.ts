/**
 * Drill catalog for bouldering plans. Sessions reference drills by id.
 * Content derived from docs/Bouldering_Trainer/ plan documents.
 */

import type { DrillDefinition } from "./types";

const DRILLS: Record<string, Omit<DrillDefinition, "id">> = {
  warmup_progressive: {
    type: "warmup",
    name: "Progressive Warm-Up",
    description: "15-20 min easy climbing, then progressive hangs",
    instructions: [
      "Start with 10-15 min of easy climbing (3-4 grades below max)",
      "Progressive hangs: bodyweight → 50% → 75% of your target work load",
      "Arm circles, scapular activation, finger flexion/extension",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Never skip warm-up before max hangs — injury risk is significantly higher",
    ],
    progressionRules: [],
  },

  warmup_short: {
    type: "warmup",
    name: "Short Warm-Up",
    description: "15 min easy climbing, progressive hangs",
    instructions: [
      "10-15 min easy climbing (3-4 grades below max)",
      "Progressive hangs: bodyweight → 50% → 75% of target",
      "Movement prep: arm circles, scapular activation",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: ["Minimum 15 min warm-up before high-intensity work"],
    progressionRules: [],
  },

  warmup_extended: {
    type: "warmup",
    name: "Extended Warm-Up",
    description: "20-25 min progressive climbing + easy campus moves",
    instructions: [
      "15-20 min easy climbing",
      "2-3 sets of easy campus rungs (if doing campus work)",
      "Progressive hangs for finger loading",
      "Scapular activation, finger flexion/extension",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Campus board requires 20+ min warm-up. Never skip.",
    ],
    progressionRules: [],
  },

  max_hang_strength: {
    type: "max_hang",
    name: "Max Hangs",
    description: "6 sets × 10 seconds at 85-90% of your tested max",
    instructions: [
      "Use 20mm edge, half-crimp grip",
      "Set scapulae DOWN and BACK before loading",
      "Hold for full 10 seconds — stop if position breaks",
      "Rest exactly 2 minutes between sets",
    ],
    sets: 6,
    reps: "10 seconds",
    intensity: "85-90%",
    restSeconds: 120,
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Stop immediately if pain > 2/10",
      "Never progress load AND volume in the same week",
    ],
    progressionRules: [
      "Complete all 6 sets clean for 2 consecutive sessions → add 2-3% load",
      "Failed a set? Stay at same weight next session",
    ],
  },

  max_hang_maintenance: {
    type: "max_hang",
    name: "Max Hang Maintenance",
    description: "4 sets × 10s at 85-90% (reduced volume)",
    instructions: [
      "Same protocol as strength block: 20mm edge, half-crimp",
      "Hold 10 seconds, rest 2 min between sets",
      "Maintain intensity from your last assessment",
    ],
    sets: 4,
    reps: "10 seconds",
    intensity: "85-90%",
    restSeconds: 120,
    notes: [],
    isOptional: false,
    safetyWarnings: ["Stop if pain > 2/10"],
    progressionRules: [],
  },

  max_hang_maintenance_3x7: {
    type: "max_hang",
    name: "Max Hang Maintenance (3×7s)",
    description: "3 sets × 7 seconds at 90%",
    instructions: [
      "Minimal volume to maintain adaptations",
      "7 second holds, 2 min rest",
    ],
    sets: 3,
    reps: "7 seconds",
    intensity: "90%",
    restSeconds: 120,
    notes: [],
    isOptional: false,
    safetyWarnings: ["Stop if pain > 2/10"],
    progressionRules: [],
  },

  limit_bouldering_power: {
    type: "limit_boulder",
    name: "Limit Bouldering (Steep/Powerful)",
    description: "5-6 problems at your current limit",
    instructions: [
      "Focus: steep angles, powerful moves, compression",
      "3-5 high-quality attempts per problem",
      "Rest 4-5 minutes between attempts",
      "Stop when movement quality degrades noticeably",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Stop after 5 tries per problem (unless project session)",
      "Never boulder through finger pain > 2/10",
    ],
    progressionRules: [],
  },

  limit_bouldering_technical: {
    type: "limit_boulder",
    name: "Limit Bouldering (Vertical/Technical)",
    description: "5-6 problems — small edges, technical sequences",
    instructions: [
      "Focus: small edges, technical sequences, balance-dependent",
      "Different style from power day",
      "3-5 attempts per problem, rest 4-5 min between",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Stop after 5 tries per problem",
      "Never boulder through finger pain > 2/10",
    ],
    progressionRules: [],
  },

  limit_bouldering_mixed: {
    type: "limit_boulder",
    name: "Limit Bouldering (Mixed Styles)",
    description: "6-8 problems across power, technical, compression, dynamic",
    instructions: [
      "Mix of styles: compression, pinch, dynamic, slab",
      "3-4 attempts per problem",
      "Rest 4-5 minutes between problems",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Stop after 5 tries per problem",
      "Never boulder through finger pain > 2/10",
    ],
    progressionRules: [],
  },

  limit_bouldering_volume: {
    type: "limit_boulder",
    name: "Limit Bouldering (High Volume)",
    description: "8-10 problems, different styles from first session",
    instructions: [
      "Choose different styles than your other session this week",
      "3-5 attempts per problem",
      "Rest 4-5 minutes between attempts",
      "Focus on movement quality and power output",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Stop after 5 tries per problem",
      "Never boulder through finger pain > 2/10",
    ],
    progressionRules: [],
  },

  limit_bouldering_coordination: {
    type: "limit_boulder",
    name: "Coordination/Technical Limit Bouldering",
    description: "6-7 problems with complex sequences",
    instructions: [
      "Complex sequences requiring precise movement",
      "Challenging coordination, not necessarily max grade",
      "3-5 attempts each, rest 4-5 min",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: ["Never boulder through finger pain > 2/10"],
    progressionRules: [],
  },

  limit_bouldering_dynamic: {
    type: "limit_boulder",
    name: "Dynamic/Power Bouldering",
    description: "4-5 problems — dynos, powerful deadpoints",
    instructions: [
      "Emphasis: dynos, powerful deadpoints, explosive sequences",
      "3-4 attempts each, rest 5 min between problems",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Controlled landings only",
      "Skip if finger/shoulder pain > 1/10",
    ],
    progressionRules: [],
  },

  campus_work: {
    type: "campus",
    name: "Campus Board",
    description: "2 exercises per session, 4 sets each, 3 min rest",
    instructions: [
      "Choose 2 exercises: 1-4-7-10 ladder, max reach, 1-2-3 reaches, or 10RM continuous",
      "4 sets per exercise, match at top rung where applicable",
      "Controlled catches only — no slamming into rungs",
      "Rest 3 minutes between sets",
    ],
    sets: 4,
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Only if finger/shoulder pain ≤ 1/10",
      "Extended warm-up required (20+ min)",
      "Skip entirely if any pain — substitute explosive bouldering",
    ],
    progressionRules: [
      "Week 5: Establish baseline with deeper rungs",
      "Week 6-7: Focus on quality; progress to smaller rungs only if pain-free",
    ],
  },

  pull_ups: {
    type: "pull_up",
    name: "Weighted Pull-Ups",
    description: "5 sets × 3-5 reps, add weight to reach failure at 3-5 reps",
    instructions: [
      "Add weight to reach failure at 3-5 reps",
      "Rest 3 minutes between sets",
      "Controlled tempo: 2 sec up, 1 sec hold, 2 sec down",
    ],
    sets: 5,
    reps: "3-5",
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [
      "Complete all 5 sets × 5 reps with good form → add 2-5 lbs",
    ],
  },

  pull_ups_4set: {
    type: "pull_up",
    name: "Weighted Pull-Ups (4 sets)",
    description: "4 sets × 3-5 reps",
    instructions: [
      "Add weight to reach failure at 3-5 reps",
      "Rest 3 minutes between sets",
    ],
    sets: 4,
    reps: "3-5",
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  pull_ups_3set: {
    type: "pull_up",
    name: "Weighted Pull-Ups (Maintenance)",
    description: "3 sets × 3-5 reps, light maintenance load",
    instructions: [
      "Light maintenance — don't push PRs",
      "Rest 3 min between sets",
    ],
    sets: 3,
    reps: "3-5",
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  antagonist_circuit: {
    type: "antagonist",
    name: "Antagonist Circuit",
    description: "3 sets each: push-ups, wrist curls, face pulls, pronation/supination",
    instructions: [
      "Push-ups or dips: 10-15 reps",
      "Reverse wrist curls: 15-20 reps",
      "Face pulls or external rotation: 15-20 reps",
      "Wrist pronation/supination: 12-15 reps each direction",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  antagonist_light: {
    type: "antagonist",
    name: "Light Antagonists",
    description: "2 sets each: push-ups, band pull-aparts",
    instructions: [
      "Push-ups: 10-12 reps",
      "Band pull-aparts: 15-20 reps",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  technical_easy_climbing: {
    type: "easy_climbing",
    name: "Technical Easy Climbing",
    description: "45-60 min at 3-4 grades below max",
    instructions: [
      "Climb 3-4 grades below your max",
      "Drills: silent feet, straight-arm hangs, hover hands, precise foot placement",
      "Variety of angles and hold types",
      "No pump, no strain",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  easy_climbing_30: {
    type: "easy_climbing",
    name: "Easy Climbing (30-45 min)",
    description: "30-45 min below pump threshold",
    instructions: [
      "Climb 2-3 grades below max",
      "Focus on technique, flow, movement quality",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  easy_bouldering_20: {
    type: "easy_climbing",
    name: "Easy Bouldering (20-30 min)",
    description: "20-30 min at comfortable intensity",
    instructions: [
      "2-3 grades below max",
      "Movement quality only, no intensity",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  easy_bouldering_40: {
    type: "easy_climbing",
    name: "Light Technique Bouldering (40 min)",
    description: "40 min focus on movement quality, no intensity",
    instructions: [
      "Stay well below limit",
      "Focus: movement quality, no intensity",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  core_circuit: {
    type: "core",
    name: "Core Circuit",
    description: "3 sets: front lever progressions, hanging knee raises, Copenhagen planks",
    instructions: [
      "Front lever progressions: 3-6 reps",
      "Hanging knee raises: 10-15 reps",
      "Copenhagen planks: 30-40s each side",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  core_circuit_2set: {
    type: "core",
    name: "Core (2 sets)",
    description: "2 sets: hanging knee raises, planks",
    instructions: [
      "Hanging knee raises: 10-12 reps",
      "Copenhagen planks: 20-30s each side",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  mobility_work: {
    type: "mobility",
    name: "Mobility Work",
    description: "15-20 min: shoulders, hips, fingers, thoracic",
    instructions: [
      "Shoulder CARs (controlled articular rotations)",
      "Hip flexor stretches",
      "Finger flexor/extensor stretches",
      "Thoracic spine mobility",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  mobility_15: {
    type: "mobility",
    name: "Mobility (15 min)",
    description: "15 min light mobility",
    instructions: [
      "Full body mobility",
      "Focus on shoulders, hips, fingers",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  max_hang_retest: {
    type: "max_hang",
    name: "Max Hang Retest",
    description: "Work up to new 7-second max",
    instructions: [
      "Same protocol as Week 0",
      "Progressive attempts until you find 7s max",
      "Rest 2+ min between attempts",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: ["Full warm-up required before testing"],
    progressionRules: [],
  },

  benchmark_retest: {
    type: "limit_boulder",
    name: "Limit Boulder Benchmark Retest",
    description: "Same 3-5 problems from Week 0",
    instructions: [
      "Reattempt your Week 0 benchmark problems",
      "Record attempts needed and quality",
      "Compare ease/control to baseline",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  pull_up_test: {
    type: "pull_up",
    name: "Pull-Up Test (3-5RM)",
    description: "Find new 3-5 rep max",
    instructions: [
      "Add weight until you reach failure at 3-5 reps",
      "Record best set",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },

  project_bouldering: {
    type: "limit_boulder",
    name: "Project Bouldering",
    description: "2-4 problems at absolute limit",
    instructions: [
      "Peak performance problems — may take multiple weeks",
      "Work moves, then links, then full sends",
      "6-10 total attempts across all projects",
      "Rest 5-10 min between burns",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [
      "Stop after 5 tries per problem unless project session",
      "Never boulder through finger pain > 2/10",
    ],
    progressionRules: [],
  },

  performance_attempts: {
    type: "limit_boulder",
    name: "Performance Attempts",
    description: "5-7 problems at or near limit, competition-style",
    instructions: [
      "Treat like competition: 2-4 attempts per problem, then move on",
      "Rest 8-12 min between problems (full recovery)",
      "Focus on execution quality",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: ["Never boulder through finger pain > 2/10"],
    progressionRules: [],
  },

  mixed_volume: {
    type: "limit_boulder",
    name: "Mixed Volume",
    description: "Circuit: limit problems + easier volume",
    instructions: [
      "3-4 problems at limit (2-3 tries each)",
      "4-5 problems at -1 grade",
      "5-6 problems at -2 grades (flash goals)",
      "Rest 5 min between limit, 3 min between easier",
    ],
    notes: [],
    isOptional: false,
    safetyWarnings: [],
    progressionRules: [],
  },
};

/** Drill catalog: id -> full DrillDefinition */
export const drillCatalog: Record<string, DrillDefinition> = Object.fromEntries(
  Object.entries(DRILLS).map(([id, d]) => [id, { ...d, id }])
);

export function getDrill(id: string): DrillDefinition | undefined {
  return drillCatalog[id];
}

/** Resolve an array of drill refs to full definitions. */
export function resolveDrills(ids: string[]): DrillDefinition[] {
  return ids
    .map((id) => drillCatalog[id])
    .filter((d): d is DrillDefinition => d != null);
}
