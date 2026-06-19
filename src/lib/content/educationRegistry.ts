/**
 * Client-safe education metadata (no filesystem imports).
 * Used by milestone modals and the education library listing.
 */

import type {
  EducationGoalType,
  EducationPieceMeta,
} from "@/lib/types/education";

export const BOULDERING_EDUCATION_REGISTRY: EducationPieceMeta[] = [
  {
    slug: "bouldering-intro-why-test",
    goalType: "bouldering",
    title: "Why We Test Before Training",
    subtitle:
      "Understanding baseline assessments and how they shape your program",
    readTimeMinutes: 4,
    keyTakeaways: [
      "Baseline tests establish your starting point for load prescriptions",
      "Week 0 measures max hang, campus reach, and benchmark boulders",
      "Results drive target loads and progression throughout the 12 weeks",
    ],
    relatedMetrics: ["max_hang", "campus_reach", "send_rate"],
    filename: "intro-why-test.mdx",
  },
  {
    slug: "bouldering-meso1-max-strength",
    goalType: "bouldering",
    title: "Mesocycle 1: Building Your Strength Foundation",
    subtitle: "Why max strength comes first and what the next three weeks look like",
    readTimeMinutes: 6,
    keyTakeaways: [
      "Finger strength is the ceiling that supports power and endurance",
      "Two max hang sessions plus limit bouldering per week",
      "Aim for 5–10% max hang improvement by Week 4 retest",
    ],
    relatedMetrics: ["max_hang", "send_rate"],
    filename: "meso1-max-strength.mdx",
  },
  {
    slug: "bouldering-why-deload",
    goalType: "bouldering",
    title: "Why Deload Weeks Make You Stronger",
    subtitle: "Recovery, injury prevention, and preparing for the next mesocycle",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Gains consolidate during recovery, not during hard training",
      "Volume drops 40–50% while keeping some intensity",
      "Week 4 retest measures progress before power work begins",
    ],
    relatedMetrics: ["max_hang", "send_rate", "srpe"],
    filename: "why-deload.mdx",
  },
  {
    slug: "bouldering-meso2-power-rfd",
    goalType: "bouldering",
    title: "Mesocycle 2: Developing Power & Explosiveness",
    subtitle: "Transitioning from strength base to rate-of-force development",
    readTimeMinutes: 6,
    keyTakeaways: [
      "Power builds on the strength foundation from Mesocycle 1",
      "Campus board and limit bouldering develop explosive finger force",
      "Session RPE targets increase compared to Mesocycle 1",
    ],
    relatedMetrics: ["campus_reach", "send_rate", "srpe"],
    filename: "meso2-power-rfd.mdx",
  },
  {
    slug: "bouldering-campus-safety",
    goalType: "bouldering",
    title: "Campus Board: High Reward, High Risk",
    subtitle: "Prerequisites, pain rules, and when to skip campus work",
    readTimeMinutes: 4,
    keyTakeaways: [
      "Campus training is powerful but increases finger injury risk",
      "Stop immediately on sharp pain — not just fatigue",
      "Skip campus if finger status is elevated or you lack a strength base",
    ],
    relatedMetrics: ["campus_reach"],
    filename: "campus-safety.mdx",
  },
  {
    slug: "bouldering-mid-program-check",
    goalType: "bouldering",
    title: "Halfway Check: Reading Your Data",
    subtitle: "Comparing Week 0 and Week 8 results to adjust expectations",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Week 8 retest shows mid-program progress across all metrics",
      "Compare max hang, campus reach, and send rate trends",
      "Use data to set realistic targets for the performance phase",
    ],
    relatedMetrics: ["max_hang", "campus_reach", "send_rate"],
    filename: "mid-program-check.mdx",
  },
  {
    slug: "bouldering-meso3-performance",
    goalType: "bouldering",
    title: "Mesocycle 3: Time to Perform",
    subtitle: "Transferring training gains to hard boulder attempts",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Training volume shifts toward limit attempts and benchmarks",
      "Maintain strength gains while prioritizing on-the-wall performance",
      "Session intent focuses on quality sends over volume",
    ],
    relatedMetrics: ["send_rate", "max_hang"],
    filename: "meso3-performance.mdx",
  },
  {
    slug: "bouldering-taper-peak",
    goalType: "bouldering",
    title: "Tapering: Less Is More",
    subtitle: "Why volume drops in Week 12 and how to peak for performance",
    readTimeMinutes: 4,
    keyTakeaways: [
      "Taper reduces fatigue while maintaining neuromuscular readiness",
      "Keep some intensity; cut total volume significantly",
      "Trust rest — feeling fresh before a peak attempt is the goal",
    ],
    relatedMetrics: ["max_hang", "send_rate", "srpe"],
    filename: "taper-peak.mdx",
  },
  {
    slug: "bouldering-program-complete",
    goalType: "bouldering",
    title: "What Your Numbers Mean & What's Next",
    subtitle: "Interpreting final results and planning your next training block",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Compare Week 0, 4, 8, and 12 assessments for full-cycle progress",
      "Send rate and max hang together tell a complete story",
      "Use results to choose your next goal or repeat the cycle",
    ],
    relatedMetrics: ["max_hang", "campus_reach", "send_rate"],
    filename: "program-complete.mdx",
  },
];

export const POWER_ENDURANCE_EDUCATION_REGISTRY: EducationPieceMeta[] = [
  {
    slug: "pe-why-program-built-around-you",
    goalType: "route_power_endurance",
    title: "Why your program is built around you",
    subtitle:
      "The science behind personalized progression — and why two climbers at the same grade can need completely different training",
    readTimeMinutes: 6,
    keyTakeaways: [
      "Your training advances at the pace your connective tissue can safely adapt, not your grade",
      "Years climbing, age, training history, and injury history set how fast load can rise",
      "RPE logged honestly is the single most important input the program uses",
    ],
    relatedMetrics: ["srpe", "max_hang", "crux_success_rate"],
    filename: "why-program-built-around-you.mdx",
  },
  {
    slug: "pe-intro-why-test",
    goalType: "route_power_endurance",
    title: "Why We Test Before Power-Endurance Training",
    subtitle:
      "How your Week 0 baseline sets the loads, volumes, and crux targets for the next 12 weeks",
    readTimeMinutes: 4,
    keyTakeaways: [
      "Baseline tests calibrate your starting loads — they are not pass/fail gates",
      "Your crux-after-fatigue score is the program's primary KPI from day one",
      "Max hang sets your intensity work; intermittent endurance sets your interval volume",
    ],
    relatedMetrics: ["crux_success_rate", "max_hang", "ihe_reps"],
    filename: "intro-why-test.mdx",
  },
  {
    slug: "pe-meso1-aerobic-foundation",
    goalType: "route_power_endurance",
    title: "Mesocycle 1: Why Aerobic Base Comes First",
    subtitle: "Building the engine that gets you to the crux less pumped",
    readTimeMinutes: 6,
    keyTakeaways: [
      "A stronger aerobic base means you arrive at the crux far less pumped",
      "ARC sessions must stay RPE 4-6 — they are recovery and skill work, not tempo",
      "Max hangs build your strength ceiling while the base develops underneath it",
    ],
    relatedMetrics: ["crux_success_rate", "fluency_stops", "max_hang"],
    filename: "meso1-aerobic-foundation.mdx",
  },
  {
    slug: "pe-silent-feet-fluency",
    goalType: "route_power_endurance",
    title: "Silent Feet + Fluency: Free Speed Through Movement Economy",
    subtitle:
      "How two simple constraints turn easy climbing into measurable skill training",
    readTimeMinutes: 4,
    keyTakeaways: [
      "Silent feet reduces the micro-corrections that bleed energy before the crux",
      "Every stop over two seconds is a partial pump ratchet you cannot fully undo",
      "Tracking slips and stops turns each ARC set into measurable progress",
    ],
    relatedMetrics: ["fluency_stops", "silent_foot_slips"],
    filename: "silent-feet-fluency.mdx",
  },
  {
    slug: "pe-why-deload",
    goalType: "route_power_endurance",
    title: "Why Deload Weeks Are Mandatory in Power-Endurance Training",
    subtitle: "The compound-fatigue math that makes recovery non-negotiable here",
    readTimeMinutes: 5,
    keyTakeaways: [
      "PE stacks finger, metabolic, and neural fatigue at once — more than any single modality",
      "Deloads are when adaptation consolidates; skipping them accumulates silent debt",
      "The Week 4 retest sets your Mesocycle 2 working loads — treat it as real data",
    ],
    relatedMetrics: ["srpe", "shoulder_symptom", "crux_success_rate"],
    filename: "why-deload.mdx",
  },
  {
    slug: "pe-meso2-threshold-work",
    goalType: "route_power_endurance",
    title: "Mesocycle 2: Building the Threshold + Crux Simulation",
    subtitle: "Turning the aerobic base into anaerobic capacity and crux durability",
    readTimeMinutes: 6,
    keyTakeaways: [
      "Mesocycle 2 layers anaerobic capacity on top of your Mesocycle 1 base",
      "Intermittent hang endurance and critical-force blocks build forearm threshold",
      "Crux simulations now carry your goal-route crux — the KPI gets specific",
    ],
    relatedMetrics: ["crux_success_rate", "ihe_reps", "srpe"],
    filename: "meso2-threshold-work.mdx",
  },
  {
    slug: "pe-critical-force-explained",
    goalType: "route_power_endurance",
    title: "Critical-Force Blocks: Your Intensity Anchor",
    subtitle:
      "What the threshold between sustainable and unsustainable output trains",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Critical force is the ceiling above which fatigue accumulates non-linearly",
      "CFB runs at RPE 8-9 — sustainable and stable, never maximal",
      "Cross-cycle comparison of CFB sessions is your clearest threshold-adaptation signal",
    ],
    relatedMetrics: ["ihe_reps", "max_hang", "srpe"],
    filename: "critical-force-explained.mdx",
  },
  {
    slug: "pe-mid-program-check",
    goalType: "route_power_endurance",
    title: "Halfway: Reading Your Crux-Success and Fluency Data",
    subtitle: "What eight weeks of crux scores and movement metrics are telling you",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Your crux success rate arc is the single best measure of transfer",
      "A falling fluency stop count is direct evidence of better movement economy",
      "Mesocycle 3 shifts from building capacity to performing under real conditions",
    ],
    relatedMetrics: ["crux_success_rate", "fluency_stops", "ihe_reps"],
    filename: "mid-program-check.mdx",
  },
  {
    slug: "pe-meso3-redpoint-focus",
    goalType: "route_power_endurance",
    title: "Mesocycle 3: Translating Training to Route Sends",
    subtitle: "Turning capacity into performance through guided redpoint linking",
    readTimeMinutes: 5,
    keyTakeaways: [
      "The final phase converts fitness into route-specific skill and tactics",
      "Redpoint burns rehearse pacing, rests, and beta — not just raw fitness",
      "Drop the fluency constraint on genuine send attempts; keep it on rehearsals",
    ],
    relatedMetrics: ["crux_success_rate", "fluency_stops", "srpe"],
    filename: "meso3-redpoint-focus.mdx",
  },
  {
    slug: "pe-taper-performance",
    goalType: "route_power_endurance",
    title: "Tapering for Power-Endurance: What to Do (and Not Do)",
    subtitle:
      "Shedding fatigue while keeping the sharpness you spent 11 weeks building",
    readTimeMinutes: 4,
    keyTakeaways: [
      "Taper cuts volume sharply while keeping enough intensity to stay sharp",
      "Feeling under-worked is normal and expected — trust the rest",
      "Do not chase fitness in the final week; the gains are already banked",
    ],
    relatedMetrics: ["crux_success_rate", "max_hang", "srpe"],
    filename: "taper-performance.mdx",
  },
  {
    slug: "pe-program-complete",
    goalType: "route_power_endurance",
    title: "Reading Your 12-Week Arc: What the Data Means",
    subtitle: "Interpreting your full-cycle results and choosing what comes next",
    readTimeMinutes: 5,
    keyTakeaways: [
      "Crux success rate is the headline — it captures whether everything transferred",
      "Compare Weeks 0, 4, 8, and 12 to see which systems drove the gains",
      "Use the pattern in your data to choose your next training block",
    ],
    relatedMetrics: ["crux_success_rate", "max_hang", "ihe_reps"],
    filename: "program-complete.mdx",
  },
];

/** All education registries combined (used for slug lookups across goals). */
export const ALL_EDUCATION_REGISTRY: EducationPieceMeta[] = [
  ...BOULDERING_EDUCATION_REGISTRY,
  ...POWER_ENDURANCE_EDUCATION_REGISTRY,
];

/** Registry lookup keyed by goal type. */
export const EDUCATION_REGISTRY_BY_GOAL: Partial<
  Record<EducationGoalType, EducationPieceMeta[]>
> = {
  bouldering: BOULDERING_EDUCATION_REGISTRY,
  route_power_endurance: POWER_ENDURANCE_EDUCATION_REGISTRY,
};

/** Strip goal prefix from slug to get MDX filename. */
export function slugToFilename(slug: string): string {
  return `${slug.replace(/^(bouldering|pe)-/, "")}.mdx`;
}

/** Sync lookup of education metadata by slug (for milestone modals). */
export function getEducationMeta(slug: string): EducationPieceMeta | null {
  const normalized = slug.trim();
  return ALL_EDUCATION_REGISTRY.find((p) => p.slug === normalized) ?? null;
}

export function getAllEducationPieces(
  goalType?: EducationGoalType
): EducationPieceMeta[] {
  if (goalType) {
    return EDUCATION_REGISTRY_BY_GOAL[goalType] ?? [];
  }
  return ALL_EDUCATION_REGISTRY;
}
