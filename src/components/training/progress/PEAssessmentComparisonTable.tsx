"use client";

import {
  buildPEComparisonTable,
  getPEAssessmentWeeks,
  type PEComparisonTableRow,
} from "@/lib/calculations/peAssessmentComparison";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";

interface PEAssessmentComparisonTableProps {
  assessments: PowerEnduranceAssessment[];
  weightUnit?: "lbs" | "kg";
}

/**
 * Delta cell class. For most rows a positive change is good; for `lowerIsBetter`
 * rows (e.g. shoulder symptoms) the sign meaning is inverted.
 */
function deltaClass(row: PEComparisonTableRow): string | undefined {
  const delta = row.deltaFromBaseline;
  if (!delta) return undefined;
  const isPositive = delta.startsWith("+");
  const isNegative = delta.startsWith("-");
  if (!isPositive && !isNegative) return undefined;
  const good = row.lowerIsBetter ? isNegative : isPositive;
  return good ? "assessment-delta-positive" : "assessment-delta-negative";
}

export function PEAssessmentComparisonTable({
  assessments,
  weightUnit = "lbs",
}: PEAssessmentComparisonTableProps) {
  const weeks = getPEAssessmentWeeks(assessments);
  const rows = buildPEComparisonTable(assessments, weightUnit);

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
            {weeks.length > 1 && <th scope="col">Δ vs baseline</th>}
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
                <td className={deltaClass(row)}>
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
