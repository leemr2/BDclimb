"use client";

import Link from "next/link";
import { getEducationMeta } from "@/lib/content/educationRegistry";

interface OnboardingEducationStepProps {
  /** Education slug to surface before the user builds their profile. */
  slug: string;
  onContinue: () => void;
}

/**
 * Intro education screen shown at the start of PE onboarding, before any
 * profile exists. Renders the piece's client-safe metadata (title, subtitle,
 * key takeaways) with a link to the full article; advancing is not gated on
 * reading, but the piece is strongly surfaced so the "why" lands first.
 */
export function OnboardingEducationStep({
  slug,
  onContinue,
}: OnboardingEducationStepProps) {
  const meta = getEducationMeta(slug);

  if (!meta) {
    // Content missing should never block onboarding — fail open.
    return (
      <div className="onboarding-education-step">
        <button
          type="button"
          className="training-form-submit training-center-cta"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-education-step">
      <span className="milestone-modal-badge">Before you begin</span>
      <h3 className="onboarding-education-title">{meta.title}</h3>
      <p className="onboarding-education-subtitle">{meta.subtitle}</p>
      <p className="onboarding-education-meta">{meta.readTimeMinutes} min read</p>

      {meta.keyTakeaways.length > 0 && (
        <div className="onboarding-education-takeaways">
          <h4 className="onboarding-education-takeaways-title">
            What this means for your program
          </h4>
          <ul className="onboarding-education-takeaways-list">
            {meta.keyTakeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="training-assessment-actions onboarding-education-actions">
        <Link
          href={`/training-center/education/${meta.slug}`}
          className="training-center-cta training-btn-secondary"
        >
          Read full article
        </Link>
        <button
          type="button"
          className="training-form-submit training-center-cta"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
