"use client";

import type { ExperienceLevel, WeightUnit } from "@/lib/firebase/training/profile";

export interface TrainingProfileFormData {
  age: number;
  weight: number;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  currentLimitGrade: string;
}

interface TrainingProfileFormProps {
  data: TrainingProfileFormData;
  onChange: (data: TrainingProfileFormData) => void;
  onSubmit: () => void;
}

const V_GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12"];

export function TrainingProfileForm({
  data,
  onChange,
  onSubmit,
}: TrainingProfileFormProps) {
  return (
    <form
      className="training-onboarding-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="training-form-group">
        <label htmlFor="training-age">Age</label>
        <input
          id="training-age"
          type="number"
          min={13}
          max={100}
          value={data.age || ""}
          onChange={(e) =>
            onChange({ ...data, age: parseInt(e.target.value, 10) || 0 })
          }
          required
        />
      </div>
      <div className="training-form-group">
        <label>Weight</label>
        <div className="training-weight-row">
          <input
            type="number"
            min={1}
            step={0.5}
            value={data.weight || ""}
            onChange={(e) =>
              onChange({ ...data, weight: parseFloat(e.target.value) || 0 })
            }
            required
          />
          <div className="training-weight-unit-toggle">
            <button
              type="button"
              className={data.weightUnit === "lbs" ? "active" : ""}
              onClick={() => onChange({ ...data, weightUnit: "lbs" })}
            >
              lbs
            </button>
            <button
              type="button"
              className={data.weightUnit === "kg" ? "active" : ""}
              onClick={() => onChange({ ...data, weightUnit: "kg" })}
            >
              kg
            </button>
          </div>
        </div>
      </div>
      <div className="training-form-group">
        <label htmlFor="training-experience">Experience level</label>
        <select
          id="training-experience"
          value={data.experienceLevel}
          onChange={(e) =>
            onChange({
              ...data,
              experienceLevel: e.target.value as ExperienceLevel,
            })
          }
          required
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div className="training-form-group">
        <label htmlFor="training-grade">Current limit grade (V-grade)</label>
        <select
          id="training-grade"
          value={data.currentLimitGrade}
          onChange={(e) =>
            onChange({ ...data, currentLimitGrade: e.target.value })
          }
          required
        >
          {V_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="training-form-submit training-center-cta">
        Continue
      </button>
    </form>
  );
}
