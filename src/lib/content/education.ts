import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import type { EducationPiece } from "@/lib/types/education";
import {
  BOULDERING_EDUCATION_REGISTRY,
  getAllEducationPieces,
  getEducationMeta,
  slugToFilename,
} from "@/lib/content/educationRegistry";

export {
  BOULDERING_EDUCATION_REGISTRY,
  getAllEducationPieces,
  getEducationMeta,
  slugToFilename,
};

const CONTENT_DIR = path.join(
  process.cwd(),
  "src/content/training/bouldering"
);

interface ParsedEducationSource {
  meta: (typeof BOULDERING_EDUCATION_REGISTRY)[number];
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

  const meta = BOULDERING_EDUCATION_REGISTRY.find((p) => p.slug === normalized);
  if (!meta) return null;

  const filePath = path.join(CONTENT_DIR, meta.filename);
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
    BOULDERING_EDUCATION_REGISTRY.map((meta) => getParsedSource(meta.slug))
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
