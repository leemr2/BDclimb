"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import type { EducationPieceMeta } from "@/lib/types/education";

interface MilestoneModalProps {
  meta: EducationPieceMeta;
  open: boolean;
  onDismiss: () => void;
  onMarkRead: () => void;
}

export function MilestoneModal({
  meta,
  open,
  onDismiss,
  onMarkRead,
}: MilestoneModalProps) {
  if (!open || typeof window === "undefined") return null;

  const handleReadFull = () => {
    onMarkRead();
  };

  return createPortal(
    <div
      className="milestone-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="milestone-modal-dialog">
        <span className="milestone-modal-badge">Training milestone</span>
        <h2 id="milestone-modal-title" className="milestone-modal-title">
          {meta.title}
        </h2>
        <p className="milestone-modal-subtitle">{meta.subtitle}</p>
        <p className="milestone-modal-meta">{meta.readTimeMinutes} min read</p>

        {meta.keyTakeaways.length > 0 && (
          <div className="milestone-modal-takeaways">
            <h3 className="milestone-modal-takeaways-title">Key takeaways</h3>
            <ul className="milestone-modal-takeaways-list">
              {meta.keyTakeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="milestone-modal-actions">
          <button
            type="button"
            onClick={onDismiss}
            className="milestone-modal-btn milestone-modal-btn-secondary"
          >
            Read later
          </button>
          <button
            type="button"
            onClick={onMarkRead}
            className="milestone-modal-btn milestone-modal-btn-secondary"
          >
            Got it
          </button>
          <Link
            href={`/training-center/education/${meta.slug}`}
            onClick={handleReadFull}
            className="milestone-modal-btn milestone-modal-btn-primary"
          >
            Read full article
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
