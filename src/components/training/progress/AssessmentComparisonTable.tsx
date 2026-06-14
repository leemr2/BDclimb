"use client";

import {
  buildComparisonTable,
  getAssessmentWeeks,
} from "@/lib/calculations/assessmentComparison";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";

interface AssessmentComparisonTableProps {
  assessments: BoulderingAssessment[];
  weightUnit?: "lbs" | "kg";
}

export function AssessmentComparisonTable({
  assessments,
  weightUnit = "lbs",
}: AssessmentComparisonTableProps) {
  const weeks = getAssessmentWeeks(assessments);
  const rows = buildComparisonTable(assessments, weightUnit);

  if (rows.length === 0 || weeks.length === 0) {
    return (
      <p className="progress-chart-empty">
        Complete your Week 0 assessment to see comparison tables.
      </p>
    );
  }

  return (
    <div className="assessment-comparison-table-wrap">
      <table className="assessment-comparison-table">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            {weeks.map((w) => (
              <th key={w} scope="col">
                {w === 0 ? "Week 0" : `Week ${w}`}
              </th>
            ))}
            {weeks.length > 1 && (
              <th scope="col">Δ vs baseline</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric}>
              <th scope="row">{row.metric}</th>
              {weeks.map((w) => (
                <td key={w}>{row.values[w] ?? "—"}</td>
              ))}
              {weeks.length > 1 && (
                <td
                  className={
                    row.deltaFromBaseline?.startsWith("+")
                      ? "assessment-delta-positive"
                      : row.deltaFromBaseline?.startsWith("-")
                        ? "assessment-delta-negative"
                        : undefined
                  }
                >
                  {row.deltaFromBaseline ?? "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
