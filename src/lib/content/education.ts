import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import type {
  EducationGoalType,
  EducationPiece,
  EducationPieceMeta,
} from "@/lib/types/education";

const CONTENT_DIR = path.join(
  process.cwd(),
  "src/content/training/bouldering"
);

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

/** Strip goal prefix from slug to get MDX filename. */
export function slugToFilename(slug: string): string {
  return `${slug.replace(/^bouldering-/, "")}.mdx`;
}

export function getAllEducationPieces(
  goalType?: EducationGoalType
): EducationPieceMeta[] {
  if (goalType) {
    return BOULDERING_EDUCATION_REGISTRY.filter((p) => p.goalType === goalType);
  }
  return BOULDERING_EDUCATION_REGISTRY;
}

export async function getEducationPiece(
  slug: string
): Promise<EducationPiece | null> {
  const meta = BOULDERING_EDUCATION_REGISTRY.find((p) => p.slug === slug);
  if (!meta) return null;

  const filePath = path.join(CONTENT_DIR, meta.filename);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { content: mdxBody, data } = matter(raw);

    const { content } = await compileMDX({
      source: mdxBody,
      options: { parseFrontmatter: false },
    });

    return {
      slug: meta.slug,
      goalType: meta.goalType,
      title: (data.title as string | undefined) ?? meta.title,
      subtitle: (data.subtitle as string | undefined) ?? meta.subtitle,
      readTimeMinutes:
        (data.readTimeMinutes as number | undefined) ?? meta.readTimeMinutes,
      keyTakeaways:
        (data.keyTakeaways as string[] | undefined) ?? meta.keyTakeaways,
      relatedMetrics:
        (data.relatedMetrics as string[] | undefined) ?? meta.relatedMetrics,
      filename: meta.filename,
      content,
    };
  } catch {
    return null;
  }
}
