"use client";

import Link from "next/link";
import { getAllEducationPieces } from "@/lib/content/educationRegistry";
import type { EducationGoalType } from "@/lib/types/education";
import { EducationCard } from "@/components/training/education/EducationCard";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";

const GOAL_LABELS: Record<EducationGoalType, string> = {
  bouldering: "bouldering",
  route_power_endurance: "power-endurance",
  route_endurance: "route endurance",
  route_power: "route power",
};

export default function EducationLibraryPage() {
  const { program } = useActiveProgram();

  const goal: EducationGoalType =
    program?.goalType === "route_power_endurance"
      ? "route_power_endurance"
      : "bouldering";

  const pieces = getAllEducationPieces(goal);

  return (
    <div className="education-library-page">
      <div className="education-page-nav">
        <Link href="/training-center" className="training-center-back">
          ← Training Home
        </Link>
      </div>

      <header className="education-library-header">
        <h2 className="education-library-title">Education Library</h2>
        <p className="education-library-subtitle">
          Training science articles for the {GOAL_LABELS[goal]} program —
          unlocked at milestones and always available here.
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
