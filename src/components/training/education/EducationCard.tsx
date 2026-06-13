import Link from "next/link";
import type { EducationPieceMeta } from "@/lib/types/education";

interface EducationCardProps {
  piece: EducationPieceMeta;
}

export function EducationCard({ piece }: EducationCardProps) {
  return (
    <Link
      href={`/training-center/education/${piece.slug}`}
      className="education-card"
    >
      <h3 className="education-card-title">{piece.title}</h3>
      <p className="education-card-subtitle">{piece.subtitle}</p>
      <span className="education-card-meta">{piece.readTimeMinutes} min read</span>
    </Link>
  );
}
