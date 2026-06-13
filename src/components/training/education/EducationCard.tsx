import type { EducationPieceMeta } from "@/lib/types/education";

interface EducationCardProps {
  piece: EducationPieceMeta;
}

/**
 * Uses a plain anchor so article navigation matches a full page load (reliable
 * with on-demand MDX compilation). Client-side Link prefetch/soft nav can
 * 404 on first visit in dev before the route segment is ready.
 */
export function EducationCard({ piece }: EducationCardProps) {
  return (
    <a
      href={`/training-center/education/${piece.slug}`}
      className="education-card"
    >
      <h3 className="education-card-title">{piece.title}</h3>
      <p className="education-card-subtitle">{piece.subtitle}</p>
      <span className="education-card-meta">{piece.readTimeMinutes} min read</span>
    </a>
  );
}
