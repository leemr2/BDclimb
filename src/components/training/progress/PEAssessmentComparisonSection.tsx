"use client";

import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";
import { PERadarComparison } from "./PERadarComparison";
import { PEAssessmentComparisonTable } from "./PEAssessmentComparisonTable";

interface PEAssessmentComparisonSectionProps {
  assessments: PowerEnduranceAssessment[];
  weightUnit?: "lbs" | "kg";
  showTitle?: boolean;
}

export function PEAssessmentComparisonSection({
  assessments,
  weightUnit = "lbs",
  showTitle = true,
}: PEAssessmentComparisonSectionProps) {
  if (assessments.length === 0) {
    return (
      <section className="progress-comparison-section">
        {showTitle && (
          <h3 className="progress-section-title">Assessment Comparison</h3>
        )}
        <p className="progress-chart-empty">
          Complete your Week 0 assessment to see before/after comparisons.
        </p>
      </section>
    );
  }

  return (
    <section className="progress-comparison-section">
      {showTitle && (
        <>
          <h3 className="progress-section-title">Assessment Comparison</h3>
          <p className="progress-section-subtitle">
            Radar chart indexes all metrics to Week 0 = 100. Table shows raw
            values at each retest week.
          </p>
        </>
      )}
      <div className="progress-comparison-grid">
        <div className="progress-chart-card">
          <h4 className="progress-chart-title">Radar Overview</h4>
          <PERadarComparison assessments={assessments} />
        </div>
        <div className="progress-chart-card">
          <h4 className="progress-chart-title">Before / After</h4>
          <PEAssessmentComparisonTable
            assessments={assessments}
            weightUnit={weightUnit}
          />
        </div>
      </div>
    </section>
  );
}
