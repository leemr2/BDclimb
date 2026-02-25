"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { LimitBoulderData } from "@/lib/plans/bouldering/types";

const STYLES: Array<"power" | "technical" | "compression" | "mixed"> = [
  "power",
  "technical",
  "compression",
  "mixed",
];
const RESULTS: Array<"send" | "highpoint" | "working"> = [
  "send",
  "highpoint",
  "working",
];

export interface BoulderLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: LimitBoulderData) => void;
}

interface ProblemEntry {
  description: string;
  grade: string;
  style: "power" | "technical" | "compression" | "mixed";
  attempts: number;
  result: "send" | "highpoint" | "working";
  quality: number;
  restMinutes: number;
  notes: string;
}

export function BoulderLogger({ drill, onComplete }: BoulderLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [problems, setProblems] = useState<ProblemEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalAttempted = problems.reduce((sum, p) => sum + p.attempts, 0);
  const totalSent = problems.filter((p) => p.result === "send").length;
  const sendRate = problems.length > 0 ? (totalSent / problems.length) * 100 : 0;

  const addProblem = useCallback(() => {
    setProblems((prev) => [
      ...prev,
      {
        description: "",
        grade: "",
        style: "power",
        attempts: 0,
        result: "working",
        quality: 3,
        restMinutes: 4,
        notes: "",
      },
    ]);
    setEditingIndex(problems.length);
    setShowAddForm(false);
  }, [problems.length]);

  const updateProblem = useCallback((index: number, updates: Partial<ProblemEntry>) => {
    setProblems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const removeProblem = useCallback((index: number) => {
    setProblems((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  }, []);

  const handleDone = useCallback(() => {
    const data: LimitBoulderData = {
      problems: problems.map((p) => ({
        description: p.description,
        grade: p.grade,
        style: p.style,
        attempts: p.attempts,
        result: p.result,
        quality: p.quality,
        restMinutes: p.restMinutes,
        notes: p.notes,
      })),
      totalAttempted,
      totalSent,
      sendRate,
    };
    dispatch({
      type: "COMPLETE_DRILL",
      payload: { drillIndex: currentDrillIndex, data: data as unknown as Record<string, unknown> },
    });
    const nextDrills = [...drills];
    nextDrills[currentDrillIndex] = {
      ...nextDrills[currentDrillIndex],
      completed: true,
      data: data as unknown as Record<string, unknown>,
      completedAt: Timestamp.now(),
    };
    persistDrills(nextDrills);
    onComplete(data);
  }, [problems, totalAttempted, totalSent, sendRate, currentDrillIndex, dispatch, drills, persistDrills, onComplete]);

  return (
    <div className="training-boulder-log">
      <h4 className="training-boulder-log-title">{drill.name}</h4>
      <p className="training-boulder-log-hint">
        Add problems as you go. Rest 4–5 min between attempts.
      </p>

      <ul className="training-boulder-log-list">
        {problems.map((p, i) => (
          <li key={i} className="training-boulder-log-item">
            {editingIndex === i ? (
              <div className="training-boulder-log-form">
                <input
                  type="text"
                  placeholder="Description"
                  value={p.description}
                  onChange={(e) => updateProblem(i, { description: e.target.value })}
                  className="training-form-group input"
                />
                <input
                  type="text"
                  placeholder="Grade (e.g. V5)"
                  value={p.grade}
                  onChange={(e) => updateProblem(i, { grade: e.target.value })}
                  className="training-form-group input"
                />
                <select
                  value={p.style}
                  onChange={(e) => updateProblem(i, { style: e.target.value as ProblemEntry["style"] })}
                  className="training-form-group input"
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <label>
                  Attempts
                  <input
                    type="number"
                    min={0}
                    value={p.attempts}
                    onChange={(e) => updateProblem(i, { attempts: parseInt(e.target.value, 10) || 0 })}
                    className="training-form-group input"
                  />
                </label>
                <select
                  value={p.result}
                  onChange={(e) => updateProblem(i, { result: e.target.value as ProblemEntry["result"] })}
                  className="training-form-group input"
                >
                  {RESULTS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <label>
                  Quality (1–5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={p.quality}
                    onChange={(e) => updateProblem(i, { quality: parseInt(e.target.value, 10) || 3 })}
                    className="training-form-group input"
                  />
                </label>
                <div className="training-boulder-log-add-form">
                  <button type="button" className="training-timer-btn" onClick={() => setEditingIndex(null)}>
                    Save
                  </button>
                  <button type="button" className="training-boulder-log-cancel-btn" onClick={() => removeProblem(i)}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="training-boulder-log-summary" onClick={() => setEditingIndex(i)}>
                <span className="training-boulder-log-summary-desc">{p.description || "No description"}</span>
                <span className="training-boulder-log-summary-meta">
                  {p.grade && <span>{p.grade}</span>}
                  <span>{p.attempts} attempts</span>
                  <span>{p.result}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {showAddForm ? (
        <div className="training-boulder-log-add-form">
          <button type="button" className="training-timer-btn" onClick={addProblem}>
            Add problem
          </button>
          <button
            type="button"
            className="training-boulder-log-cancel-btn"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="training-timer-btn"
          onClick={() => setShowAddForm(true)}
        >
          Add problem
        </button>
      )}

      {problems.length > 0 && (
        <>
          <p className="training-boulder-log-stats">
            Sent {totalSent} / {problems.length} · {totalAttempted} attempts · Send rate {sendRate.toFixed(0)}%
          </p>
          <button
            type="button"
            className="training-timer-btn"
            onClick={handleDone}
          >
            Done bouldering
          </button>
        </>
      )}
    </div>
  );
}
