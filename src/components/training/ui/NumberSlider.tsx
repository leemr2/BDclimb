"use client";

interface NumberSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  className?: string;
}

/** Mobile-friendly slider + ± buttons replacing tiny number inputs. */
export function NumberSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  hint,
  className,
}: NumberSliderProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, parseFloat(v.toFixed(10))));

  const adjust = (delta: number) => {
    const raw = Math.round((value + delta) / step) * step;
    onChange(clamp(raw));
  };

  const displayValue =
    Number.isInteger(step) ? Math.round(value) : parseFloat(value.toFixed(1));

  return (
    <div className={`training-number-slider${className ? ` ${className}` : ""}`}>
      <div className="training-number-slider-header">
        <span className="training-number-slider-label">{label}</span>
        <span className="training-number-slider-value">
          {displayValue}
          {unit && <span className="training-number-slider-unit"> {unit}</span>}
        </span>
      </div>
      <div className="training-number-slider-controls">
        <button
          type="button"
          onClick={() => adjust(-step)}
          disabled={value <= min}
          className="training-number-slider-btn"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="training-number-slider-track"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          disabled={value >= max}
          className="training-number-slider-btn"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {hint && <p className="training-assessment-hint">{hint}</p>}
    </div>
  );
}
