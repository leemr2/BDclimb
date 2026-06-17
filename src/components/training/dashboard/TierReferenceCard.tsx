"use client";

import { useState } from "react";
import type {
  ProfileScore,
  ProgressionParams,
  StartingState,
} from "@/lib/plans/power-endurance/profileScore";

interface TierReferenceCardProps {
  profileScore: ProfileScore;
  progressionParams: ProgressionParams;
  startingState?: StartingState | null;
  /** Render collapsed by default (e.g. on the dashboard). */
  defaultCollapsed?: boolean;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Read-only quick-reference of the athlete's tier progression parameters
 * (CruxTracker Profile Score System, Appendix A). Surfaced so the athlete
 * never has to leave the app mid-session to look up a parameter.
 */
export function TierReferenceCard({
  profileScore,
  progressionParams: pp,
  startingState,
  defaultCollapsed = false,
}: TierReferenceCardProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Load increment per step",
      value: `+${(pp.loadIncrementPct * 100).toFixed(1)}% of current load`,
    },
    { label: "Sessions to confirm advance", value: `${pp.sessionsToConfirm}` },
    { label: "Minimum time per step", value: `${pp.minWeeksPerStep} wk` },
    { label: "Hold threshold", value: `RPE ≥ ${pp.holdThresholdRPE}` },
    {
      label: "Regression trigger",
      value: `RPE > ${pp.regressionThresholdRPE} × ${pp.regressionSessionCount} sessions`,
    },
    {
      label: "Volume increment per step",
      value: `+${(pp.volumeIncrementPct * 100).toFixed(0)}%`,
    },
    { label: "Rest reduction per step", value: `${pp.restReductionSec} sec` },
    {
      label: "Weekly sRPE ceiling",
      value: pp.weeklySRPECeiling.toLocaleString(),
    },
    {
      label: "Deload volume cut",
      value: pct(pp.deloadVolumeReductionPct),
    },
    {
      label: "Deload intensity",
      value:
        pp.deloadIntensityHandling === "maintain"
          ? "Maintain"
          : `−${pct(pp.deloadIntensityReductionPct)}`,
    },
    {
      label: "Min days between finger sessions",
      value: `${pp.minRestDaysBetweenFingerSessions}`,
    },
    { label: "Early deload trigger", value: pp.symptomDeloadTrigger },
  ];

  if (startingState) {
    rows.unshift({
      label: "Starting working intensity",
      value: `${Math.round(startingState.startingIntensityPct * 100)}% MVC`,
    });
  }

  return (
    <section className="training-tier-card">
      <button
        type="button"
        className="training-tier-card-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="training-tier-card-title">
          Tier {profileScore.tier} — {profileScore.tierLabel}
        </span>
        <span className="training-tier-card-score">
          Profile score {profileScore.finalScore}/100
        </span>
        <span className="training-tier-card-toggle" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <>
          <p className="training-tier-card-note">
            Your progression parameters for this 12-week cycle. These govern how
            fast load and volume advance — fixed at onboarding.
          </p>
          <dl className="training-tier-card-list">
            {rows.map((row) => (
              <div key={row.label} className="training-tier-card-row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
