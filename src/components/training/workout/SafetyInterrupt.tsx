"use client";

export type SafetyInterruptChoice =
  | "skip_remaining"
  | "reduce_load"
  | "continue";

export interface SafetyInterruptProps {
  /** Title e.g. "Pain detected" */
  title: string;
  message: string;
  /** Recommended action text */
  action: string;
  severity: "red" | "yellow";
  onChoice: (choice: SafetyInterruptChoice) => void;
}

export function SafetyInterrupt({
  title,
  message,
  action,
  severity,
  onChoice,
}: SafetyInterruptProps) {
  return (
    <div className="training-safety-overlay" role="dialog" aria-modal="true">
      <div
        className={`training-safety-modal training-safety-modal--${severity}`}
      >
        <h3 className="training-safety-title">{title}</h3>
        <p className="training-safety-message">{message}</p>
        <p className="training-safety-action">{action}</p>
        <div className="training-safety-actions">
          <button
            type="button"
            className="training-safety-btn training-safety-btn--skip"
            onClick={() => onChoice("skip_remaining")}
          >
            Skip remaining sets
          </button>
          <button
            type="button"
            className="training-safety-btn training-safety-btn--reduce"
            onClick={() => onChoice("reduce_load")}
          >
            Reduce load 10%
          </button>
          <button
            type="button"
            className="training-safety-btn training-safety-btn--continue"
            onClick={() => onChoice("continue")}
          >
            Continue anyway (not recommended)
          </button>
        </div>
      </div>
    </div>
  );
}
