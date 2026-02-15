"use client";

export type FrequencyOption = 2 | 3 | 4;

const OPTIONS: {
  value: FrequencyOption;
  label: string;
  description: string;
}[] = [
  {
    value: 2,
    label: "2 days per week",
    description:
      "Two focused sessions (e.g. Tue + Fri). Max hangs and limit bouldering combined; higher volume per session. Best if recovery or schedule is limited.",
  },
  {
    value: 3,
    label: "3 days per week",
    description:
      "Mon / Wed / Fri. Clear separation of max strength, antagonist/technical, and pulling + bouldering. Balanced volume and recovery.",
  },
  {
    value: 4,
    label: "4 days per week",
    description:
      "Mon / Tue / Thu / Sat. Dedicated max hang days, active recovery day, and more limit bouldering variety. Highest weekly volume.",
  },
];

interface FrequencySelectorProps {
  value: FrequencyOption | null;
  onChange: (value: FrequencyOption) => void;
  onSubmit: () => void;
}

export function FrequencySelector({
  value,
  onChange,
  onSubmit,
}: FrequencySelectorProps) {
  return (
    <div className="training-frequency-selector">
      <p className="training-frequency-intro">
        How many days per week can you train? This sets your plan structure.
      </p>
      <div className="training-frequency-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`training-frequency-option ${value === opt.value ? "selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            <span className="training-frequency-label">{opt.label}</span>
            <span className="training-frequency-desc">{opt.description}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="training-form-submit training-center-cta"
        disabled={value === null}
        onClick={onSubmit}
      >
        Continue
      </button>
    </div>
  );
}
