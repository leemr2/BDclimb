"use client";

import { useState } from "react";
import type { LimitBoulderProblem } from "@/lib/plans/bouldering/types";

interface BoulderBenchmarkProps {
  onComplete: (problems: LimitBoulderProblem[]) => void;
  onBack?: () => void;
}

export function BoulderBenchmark({ onComplete, onBack }: BoulderBenchmarkProps) {
  const [step, setStep] = useState<"intro" | "logging">("intro");
  const [problems, setProblems] = useState<LimitBoulderProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Partial<LimitBoulderProblem>>({
    problemDescription: "",
    grade: "",
    attemptsToSend: 1,
    sent: false,
    highPoint: null,
    style: "power",
    notes: "",
  });

  const handleStartLogging = () => {
    setStep("logging");
  };

  const handleAddProblem = () => {
    if (!currentProblem.problemDescription || !currentProblem.grade) {
      alert("Please fill in problem description and grade.");
      return;
    }

    const problem: LimitBoulderProblem = {
      problemDescription: currentProblem.problemDescription!,
      grade: currentProblem.grade!,
      attemptsToSend: currentProblem.attemptsToSend || 1,
      sent: currentProblem.sent || false,
      highPoint: currentProblem.highPoint || null,
      style: currentProblem.style || "power",
      notes: currentProblem.notes || "",
    };

    setProblems(prev => [...prev, problem]);
    setCurrentProblem({
      problemDescription: "",
      grade: "",
      attemptsToSend: 1,
      sent: false,
      highPoint: null,
      style: "power",
      notes: "",
    });
  };

  const handleFinish = () => {
    if (problems.length === 0) {
      alert("Please log at least one limit boulder problem.");
      return;
    }
    onComplete(problems);
  };

  const handleDeleteProblem = (index: number) => {
    setProblems(prev => prev.filter((_, i) => i !== index));
  };

  if (step === "intro") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Limit Boulder Benchmark</h2>
          <p className="training-assessment-subtitle">
            Log 3-5 limit boulder problems to establish your baseline climbing performance.
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-instructions">
            <h3>What you'll do:</h3>
            <ol>
              <li>Choose problems at or near your limit (V-grade where you're projecting)</li>
              <li>Attempt each problem, tracking attempts and result</li>
              <li>Focus on problems with different styles (power, technical, compression)</li>
              <li>Rest fully between problems (5-10 minutes)</li>
              <li>Log 3-5 problems total</li>
            </ol>

            <h3>Why this matters:</h3>
            <ul>
              <li>Tracks your <strong>send rate</strong> (% of limit problems sent)</li>
              <li>Measures <strong>attempts-to-send</strong> efficiency</li>
              <li>Helps identify strength vs technique gaps</li>
              <li>Shows progress across mesocycles</li>
            </ul>
          </div>
        </div>

        <div className="training-assessment-actions">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="training-center-cta training-btn-secondary"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleStartLogging}
            className="training-center-cta"
          >
            Start logging
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Log Limit Boulders</h2>
        <p className="training-assessment-subtitle">
          Problem {problems.length + 1} · Target: 3-5 total problems
        </p>
      </div>

      <div className="training-assessment-content">
        {/* Current Problem Form */}
        <div className="training-assessment-form">
          <div className="training-assessment-section">
            <label className="training-assessment-label">
              Problem description *
              <input
                type="text"
                value={currentProblem.problemDescription}
                onChange={(e) => setCurrentProblem(prev => ({ ...prev, problemDescription: e.target.value }))}
                placeholder="e.g., Red corner problem with big move to jug"
                className="training-assessment-input"
              />
            </label>
          </div>

          <div className="training-assessment-section">
            <label className="training-assessment-label">
              Grade *
              <input
                type="text"
                value={currentProblem.grade}
                onChange={(e) => setCurrentProblem(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="e.g., V6, V7, V8..."
                className="training-assessment-input"
              />
            </label>
          </div>

          <div className="training-assessment-section">
            <label className="training-assessment-label">Style</label>
            <div className="training-assessment-style-options">
              <button
                type="button"
                onClick={() => setCurrentProblem(prev => ({ ...prev, style: "power" }))}
                className={`training-assessment-style-btn ${currentProblem.style === "power" ? "active" : ""}`}
              >
                Power
              </button>
              <button
                type="button"
                onClick={() => setCurrentProblem(prev => ({ ...prev, style: "technical" }))}
                className={`training-assessment-style-btn ${currentProblem.style === "technical" ? "active" : ""}`}
              >
                Technical
              </button>
              <button
                type="button"
                onClick={() => setCurrentProblem(prev => ({ ...prev, style: "compression" }))}
                className={`training-assessment-style-btn ${currentProblem.style === "compression" ? "active" : ""}`}
              >
                Compression
              </button>
            </div>
          </div>

          <div className="training-assessment-section">
            <label className="training-assessment-label">
              Result
            </label>
            <div className="training-assessment-result-options">
              <button
                type="button"
                onClick={() => setCurrentProblem(prev => ({ ...prev, sent: true, highPoint: null }))}
                className={`training-assessment-result-btn ${currentProblem.sent ? "active" : ""}`}
              >
                Sent ✓
              </button>
              <button
                type="button"
                onClick={() => setCurrentProblem(prev => ({ ...prev, sent: false }))}
                className={`training-assessment-result-btn ${!currentProblem.sent ? "active" : ""}`}
              >
                Did not send
              </button>
            </div>
          </div>

          {!currentProblem.sent && (
            <div className="training-assessment-section">
              <label className="training-assessment-label">
                High point (optional)
                <input
                  type="text"
                  value={currentProblem.highPoint || ""}
                  onChange={(e) => setCurrentProblem(prev => ({ ...prev, highPoint: e.target.value || null }))}
                  placeholder="e.g., reached the crimp rail, stuck the deadpoint"
                  className="training-assessment-input"
                />
              </label>
            </div>
          )}

          <div className="training-assessment-section">
            <label className="training-assessment-label">
              Attempts {currentProblem.sent ? "to send" : ""}
              <input
                type="number"
                value={currentProblem.attemptsToSend}
                onChange={(e) => setCurrentProblem(prev => ({ ...prev, attemptsToSend: parseInt(e.target.value) || 1 }))}
                className="training-assessment-input"
                min="1"
              />
            </label>
          </div>

          <div className="training-assessment-section">
            <label className="training-assessment-label">
              Notes (optional)
              <textarea
                value={currentProblem.notes}
                onChange={(e) => setCurrentProblem(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Beta, difficulty, observations..."
                className="training-assessment-textarea"
                rows={3}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleAddProblem}
            className="training-center-cta training-btn-secondary"
          >
            Next Problem
          </button>
        </div>

        {/* Logged Problems */}
        {problems.length > 0 && (
          <div className="training-assessment-logged">
            <h4 className="training-assessment-logged-title">Logged problems ({problems.length}):</h4>
            <ul className="training-assessment-logged-list">
              {problems.map((problem, i) => (
                <li key={i} className="training-assessment-logged-item">
                  <div className="training-assessment-logged-info">
                    <span className="training-assessment-logged-grade">{problem.grade}</span>
                    <span className="training-assessment-logged-desc">{problem.problemDescription}</span>
                    <span className={`training-assessment-logged-result ${problem.sent ? "sent" : "not-sent"}`}>
                      {problem.sent ? `Sent (${problem.attemptsToSend} attempts)` : `${problem.attemptsToSend} attempts`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProblem(i)}
                    className="training-assessment-logged-delete"
                    aria-label="Delete problem"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        {problems.length >= 3 && (
          <button
            type="button"
            onClick={handleFinish}
            className="training-center-cta"
          >
            Finish benchmark ({problems.length} problems)
          </button>
        )}
        {problems.length < 3 && (
          <p className="training-assessment-hint-action">
            Log at least {3 - problems.length} more problem{3 - problems.length !== 1 ? "s" : ""} to continue
          </p>
        )}
      </div>
    </div>
  );
}
