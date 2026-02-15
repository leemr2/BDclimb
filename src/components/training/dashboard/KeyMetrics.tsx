"use client";

/**
 * Placeholder key metrics for Phase 1. Populated in Phase 3 when assessment data exists.
 */
export function KeyMetrics() {
  return (
    <div className="training-key-metrics">
      <h3 className="training-metrics-title">Key metrics</h3>
      <div className="training-metrics-grid">
        <div className="training-metric-card">
          <span className="training-metric-label">Max hang</span>
          <span className="training-metric-value">—</span>
          <span className="training-metric-note">After Week 0 assessment</span>
        </div>
        <div className="training-metric-card">
          <span className="training-metric-label">Send rate</span>
          <span className="training-metric-value">—</span>
          <span className="training-metric-note">From limit bouldering logs</span>
        </div>
        <div className="training-metric-card">
          <span className="training-metric-label">Campus reach</span>
          <span className="training-metric-value">—</span>
          <span className="training-metric-note">After Week 5+ assessment</span>
        </div>
      </div>
    </div>
  );
}
