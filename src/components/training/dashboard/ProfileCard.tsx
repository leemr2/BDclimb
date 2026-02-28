"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import {
  getTrainingProfile,
  updateTrainingProfile,
  type TrainingProfile,
  type WeightUnit,
  type ExperienceLevel,
} from "@/lib/firebase/training/profile";

const V_GRADES = [
  "V0", "V1", "V2", "V3", "V4", "V5", "V6",
  "V7", "V8", "V9", "V10", "V11", "V12",
];

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface ProfileCardProps {
  /** Training frequency from the active program */
  frequency: 2 | 3 | 4;
}

interface DraftProfile {
  age: number;
  weight: number;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  currentLimitGrade: string;
}

export function ProfileCard({ frequency }: ProfileCardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TrainingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTrainingProfile(user.uid)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user]);

  function openEdit() {
    if (!profile) return;
    setDraft({
      age: profile.age,
      weight: profile.weight,
      weightUnit: profile.weightUnit,
      experienceLevel: profile.experienceLevel,
      currentLimitGrade: profile.currentLimitGrade,
    });
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateTrainingProfile(user.uid, draft);
      // Refresh local state
      const updated = await getTrainingProfile(user.uid);
      setProfile(updated);
      setEditing(false);
      setDraft(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="tc-section tc-section--profile">
        <div className="tc-section-header">
          <h3 className="tc-section-title">Training Profile</h3>
        </div>
        <p className="tc-section-empty">Loading…</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="tc-section tc-section--profile">
        <div className="tc-section-header">
          <h3 className="tc-section-title">Training Profile</h3>
        </div>
        <p className="tc-section-empty">No profile found.</p>
      </section>
    );
  }

  return (
    <section className="tc-section tc-section--profile">
      <div className="tc-section-header">
        <h3 className="tc-section-title">Training Profile</h3>
        {!editing && (
          <button
            type="button"
            onClick={openEdit}
            className="tc-profile-edit-btn"
          >
            Edit
          </button>
        )}
      </div>

      {editing && draft ? (
        <form className="tc-profile-form" onSubmit={handleSave}>
          <div className="tc-profile-form-row">
            <label className="tc-profile-form-label" htmlFor="prof-age">
              Age
            </label>
            <input
              id="prof-age"
              className="tc-profile-form-input"
              type="number"
              min={13}
              max={100}
              value={draft.age || ""}
              onChange={(e) =>
                setDraft({ ...draft, age: parseInt(e.target.value, 10) || 0 })
              }
              required
            />
          </div>

          <div className="tc-profile-form-row">
            <label className="tc-profile-form-label">Weight</label>
            <div className="tc-profile-weight-row">
              <input
                className="tc-profile-form-input tc-profile-weight-input"
                type="number"
                min={1}
                step={0.5}
                value={draft.weight || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weight: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              <div className="tc-profile-unit-toggle">
                <button
                  type="button"
                  className={draft.weightUnit === "lbs" ? "active" : ""}
                  onClick={() => setDraft({ ...draft, weightUnit: "lbs" })}
                >
                  lbs
                </button>
                <button
                  type="button"
                  className={draft.weightUnit === "kg" ? "active" : ""}
                  onClick={() => setDraft({ ...draft, weightUnit: "kg" })}
                >
                  kg
                </button>
              </div>
            </div>
          </div>

          <div className="tc-profile-form-row">
            <label className="tc-profile-form-label" htmlFor="prof-exp">
              Experience
            </label>
            <select
              id="prof-exp"
              className="tc-profile-form-input"
              value={draft.experienceLevel}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  experienceLevel: e.target.value as ExperienceLevel,
                })
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="tc-profile-form-row">
            <label className="tc-profile-form-label" htmlFor="prof-grade">
              Limit Grade
            </label>
            <select
              id="prof-grade"
              className="tc-profile-form-input"
              value={draft.currentLimitGrade}
              onChange={(e) =>
                setDraft({ ...draft, currentLimitGrade: e.target.value })
              }
            >
              {V_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <p className="tc-profile-error">{saveError}</p>
          )}

          <div className="tc-profile-form-actions">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="tc-profile-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="tc-profile-save-btn training-center-cta"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <dl className="tc-profile-list">
          <div className="tc-profile-row">
            <dt className="tc-profile-key">Age</dt>
            <dd className="tc-profile-val">{profile.age}</dd>
          </div>
          <div className="tc-profile-row">
            <dt className="tc-profile-key">Weight</dt>
            <dd className="tc-profile-val">
              {profile.weight} {profile.weightUnit}
            </dd>
          </div>
          <div className="tc-profile-row">
            <dt className="tc-profile-key">Experience</dt>
            <dd className="tc-profile-val">
              {EXPERIENCE_LABELS[profile.experienceLevel]}
            </dd>
          </div>
          <div className="tc-profile-row">
            <dt className="tc-profile-key">Limit Grade</dt>
            <dd className="tc-profile-val">{profile.currentLimitGrade}</dd>
          </div>
          <div className="tc-profile-row">
            <dt className="tc-profile-key">Training Days</dt>
            <dd className="tc-profile-val">{frequency}× / week</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
