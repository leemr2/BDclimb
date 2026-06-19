import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import type { EducationGoalType, EducationPiece, EducationPieceMeta } from "@/lib/types/education";
import {
  ALL_EDUCATION_REGISTRY,
  BOULDERING_EDUCATION_REGISTRY,
  POWER_ENDURANCE_EDUCATION_REGISTRY,
  getAllEducationPieces,
  getEducationMeta,
  slugToFilename,
} from "@/lib/content/educationRegistry";

export {
  ALL_EDUCATION_REGISTRY,
  BOULDERING_EDUCATION_REGISTRY,
  POWER_ENDURANCE_EDUCATION_REGISTRY,
  getAllEducationPieces,
  getEducationMeta,
  slugToFilename,
};

/** Content directory for each goal's MDX files. */
const CONTENT_DIR_BY_GOAL: Record<EducationGoalType, string> = {
  bouldering: path.join(process.cwd(), "src/content/training/bouldering"),
  route_power_endurance: path.join(
    process.cwd(),
    "src/content/training/power-endurance"
  ),
  route_endurance: path.join(
    process.cwd(),
    "src/content/training/route-endurance"
  ),
  route_power: path.join(process.cwd(), "src/content/training/route-power"),
};

interface ParsedEducationSource {
  meta: EducationPieceMeta;
  mdxBody: string;
  data: Record<string, unknown>;
}

const parsedSourceCache = new Map<string, ParsedEducationSource>();

function normalizeSlug(slug: string): string {
  return decodeURIComponent(slug.trim());
}

async function getParsedSource(
  slug: string
): Promise<ParsedEducationSource | null> {
  const normalized = normalizeSlug(slug);
  const cached = parsedSourceCache.get(normalized);
  if (cached) return cached;

  const meta = ALL_EDUCATION_REGISTRY.find((p) => p.slug === normalized);
  if (!meta) return null;

  const contentDir = CONTENT_DIR_BY_GOAL[meta.goalType];
  const filePath = path.join(contentDir, meta.filename);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { content: mdxBody, data } = matter(raw);
    const parsed: ParsedEducationSource = {
      meta,
      mdxBody,
      data: data as Record<string, unknown>,
    };
    parsedSourceCache.set(normalized, parsed);
    return parsed;
  } catch {
    return null;
  }
}

/** Warm filesystem + frontmatter cache when entering the education section. */
export async function preloadEducationContent(): Promise<void> {
  await Promise.all(
    ALL_EDUCATION_REGISTRY.map((meta) => getParsedSource(meta.slug))
  );
}

export async function getEducationPiece(
  slug: string
): Promise<EducationPiece | null> {
  const parsed = await getParsedSource(slug);
  if (!parsed) return null;

  const { meta, mdxBody, data } = parsed;

  try {
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
