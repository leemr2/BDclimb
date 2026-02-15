"use client";

import type { ActiveProgram } from "@/lib/firebase/training/program";
import { MESOCYCLE_NAMES } from "@/lib/plans/bouldering/planEngine";

interface DashboardHeaderProps {
  program: ActiveProgram;
}

export function DashboardHeader({ program }: DashboardHeaderProps) {
  const percent = Math.round((program.currentWeek / 12) * 100);
  const mesoName = MESOCYCLE_NAMES[program.currentMesocycle as 1 | 2 | 3];

  return (
    <header className="training-dashboard-header">
      <h2 className="training-dashboard-title">
        Week {program.currentWeek} of 12 · Mesocycle {program.currentMesocycle}:{" "}
        {mesoName}
      </h2>
      <div className="training-dashboard-progress-wrap">
        <div
          className="training-dashboard-progress-bar"
          role="progressbar"
          aria-valuenow={program.currentWeek}
          aria-valuemin={0}
          aria-valuemax={12}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="training-dashboard-progress-label">{percent}% complete</p>
    </header>
  );
}
