import Link from "next/link";
import { getAllEducationPieces } from "@/lib/content/education";
import { EducationCard } from "@/components/training/education/EducationCard";

export default function EducationLibraryPage() {
  const pieces = getAllEducationPieces("bouldering");

  return (
    <div className="education-library-page">
      <div className="education-page-nav">
        <Link href="/training-center/dashboard" className="training-center-back">
          ← Back to dashboard
        </Link>
      </div>

      <header className="education-library-header">
        <h2 className="education-library-title">Education Library</h2>
        <p className="education-library-subtitle">
          Training science articles for the bouldering program — unlocked at
          milestones and always available here.
        </p>
      </header>

      <div className="education-library-grid">
        {pieces.map((piece) => (
          <EducationCard key={piece.slug} piece={piece} />
        ))}
      </div>
    </div>
  );
}
