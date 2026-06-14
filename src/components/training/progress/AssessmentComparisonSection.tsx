"use client";

import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import { RadarComparison } from "./RadarComparison";
import { AssessmentComparisonTable } from "./AssessmentComparisonTable";

interface AssessmentComparisonSectionProps {
  assessments: BoulderingAssessment[];
  weightUnit?: "lbs" | "kg";
  showTitle?: boolean;
}

export function AssessmentComparisonSection({
  assessments,
  weightUnit = "lbs",
  showTitle = true,
}: AssessmentComparisonSectionProps) {
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
          <RadarComparison assessments={assessments} />
        </div>
        <div className="progress-chart-card">
          <h4 className="progress-chart-title">Before / After</h4>
          <AssessmentComparisonTable
            assessments={assessments}
            weightUnit={weightUnit}
          />
        </div>
      </div>
    </section>
  );
}
