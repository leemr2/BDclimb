# CruxTracker: Profile Score System
## Design Specification v1.0

---

## Overview

The Profile Score System is the engine that converts a climber's background into a personalized, quantified training program. It operates on two independent axes:

- **The Profile Score (PS)** — a 0–100 composite score derived from four onboarding inputs. Governs *how fast* the program advances: load increment size, volume steps, deload frequency, and safety thresholds.
- **The Performance Axis** — three scores derived from the Week 0 assessment. Governs *where the program starts*: initial working load, starting volume, and initial crux complexity.

These axes do not conflict. A high-performing Tier 1 athlete starts at a demanding place but progresses slowly. A lower-performing Tier 5 athlete starts at a moderate place but advances quickly. Together they fully parameterize the program without manual coaching judgment.

---

## Part 1: Profile Score Calculation

### 1.1 Scoring Components

The Profile Score is the sum of three components, each reflecting a distinct dimension of structural readiness.

---

#### Component 1: Climbing Age (C1) — max 45 points

Measures years of *consistent* climbing, defined as two or more sessions per week for at least eight months per year. This is the primary proxy for connective tissue adaptation accumulated over time. Tendons and pulleys remodel across years to decades; this is the variable no amount of motivation can accelerate.

| Input | Points |
|---|---|
| Less than 1 year | 0 |
| 1–2 years | 8 |
| 2–5 years | 18 |
| 5–10 years | 30 |
| 10–20 years | 38 |
| 20+ years | 45 |

C1 carries the highest weight (45%) in the model because structural resilience is the primary safety constraint in climbing finger training. A 20-year climber at V5 has undergone far more connective tissue remodeling cycles than a 2-year climber at V5, regardless of current performance level.

---

#### Component 2: Age / Recovery Capacity (C2) — max 25 points

Chronological age determines two things: collagen synthesis rate (which declines meaningfully after approximately age 40) and inter-session recovery speed. The curve peaks in the 22–30 range and decreases bilaterally.

| Input | Points |
|---|---|
| Under 22 | 15 |
| 22–30 | 25 |
| 30–40 | 20 |
| 40–50 | 13 |
| 50+ | 8 |

**Under-22 note:** Athletes under 22 score 15 rather than 25 because connective tissue continues developing until approximately age 25, requiring moderate conservatism despite high recovery capacity. High recovery speed does not compensate for incomplete structural maturation.

**40+ note:** Athletes 40 and over should be offered the 3-day plan as a default when selecting frequency, even if they have high experience. The C2 score reduction captures this in the parameter table automatically.

---

#### Component 3: Structured Training History (C3) — max 30 points

Measures exposure to deliberate tendon loading protocols: hangboard programs, campus board training, structured interval blocks. Systematic tendon loading produces different structural adaptations than climbing alone. A climber who has hangboarded consistently for 3 years has meaningfully more robust finger flexor tendons than a 3-year climber of the same grade who only bouldered.

| Input | Points |
|---|---|
| No structured training (just climbing) | 5 |
| Occasional structured work | 12 |
| Consistent structured training, 1+ year | 22 |
| Multi-year systematic program | 30 |

The minimum score of 5 (not 0) reflects that any consistent climbing develops some connective tissue baseline. Zero is not physiologically accurate for a climber with any years in the sport.

---

### 1.2 Raw Score

```
Raw Score = C1 + C2 + C3     (maximum: 100)
```

---

### 1.3 Injury Ceiling

After the Raw Score is calculated, a ceiling is applied based on finger injury history. The ceiling is a **hard cap, not a subtracted penalty.** It represents a permanent structural constraint that exists regardless of experience level. A Grade 2 A2 pulley tear heals with altered collagen architecture; that is a physical fact, not a reflection of current fitness.

| Injury History | Score Ceiling |
|---|---|
| No significant finger injuries | 100 (no ceiling applied) |
| Grade 1 pulley, fully healed | 85 |
| Grade 2 pulley, fully healed | 70 |
| Grade 3+ tear or surgery | 55 |
| Current active finger issue | 35 |

The injury ceiling is applied to the final score, not subtracted from it. A 25-year veteran with a healed Grade 2 tear and a raw score of 88 receives a Final Profile Score of 70 (Experienced tier), not 58. The ceiling reflects their structural reality, not a punishment.

---

### 1.4 Final Profile Score

```
Final Profile Score (FPS) = min(Raw Score, Injury Ceiling)
```

---

### 1.5 Tier Assignment

The FPS maps to one of five tiers. The tier is the primary lookup key for every progression parameter table throughout the plan.

| FPS Range | Tier | Label | Structural Description |
|---|---|---|---|
| 0–20 | 1 | Developing | Foundational connective tissue building. Load-tolerance window is narrow. |
| 21–40 | 2 | Building | Tissue adapting steadily. Consistent readiness checks are critical. |
| 41–60 | 3 | Established | Solid structural foundation. Standard progressive overload applies. |
| 61–80 | 4 | Experienced | Well-adapted tissue. Faster progression with maintained safety gates. |
| 81–100 | 5 | Seasoned | Highly adapted structures. Fastest safe progression with readiness-gated autoregulation. |

---

## Part 2: Protocol Parameters by Tier

All parameter tables below use the tier as the lookup key. Parameters are fixed at onboarding and remain constant throughout the 12-week program unless a mid-program injury downgrade occurs (see Section 5.2).

---

### 2.1 Finger Load (Hangboard) Parameters

These parameters govern max hang sessions across all training frequency variants (2-day, 3-day, 4-day). They apply to the 7–10 second max hang protocol on a 20–22mm edge in half-crimp position.

---

#### Starting Intensity Range

The tier defines a range. The Performance Axis (Section 3.2) resolves this to a specific starting percentage. The range represents the floor and ceiling for that tier; the exact starting point within the range is determined by the athlete's Finger Strength Score.

| Tier | Starting Intensity Range |
|---|---|
| 1 – Developing | 78–82% MVC |
| 2 – Building | 80–84% MVC |
| 3 – Established | 82–87% MVC |
| 4 – Experienced | 85–90% MVC |
| 5 – Seasoned | 87–92% MVC |

---

#### Load Increment Per Step

Expressed as a **percentage of the current working load**, not a fixed kilogram value. This resolves the body-weight-relative problem in the old "+2–3kg" rule.

| Tier | Load Increment |
|---|---|
| 1 – Developing | 1.5% |
| 2 – Building | 2.5% |
| 3 – Established | 3.5% |
| 4 – Experienced | 4.5% |
| 5 – Seasoned | 5.0% |

**Implementation note:** If a Tier 3 athlete is working at +15.0kg added weight, the next step is +15.525kg, rounded to the nearest 0.25kg increment (±15.5kg). A fixed "+2.5kg" rule on this athlete would represent a 16.7% jump — far too aggressive for connective tissue tolerance. A fixed "+2.5kg" on a Tier 5 athlete adding 50kg would be only 5% — appropriate. The percentage model is weight-class and strength-level agnostic.

---

#### Sessions to Confirm Advance (Readiness Gate)

The athlete must complete this many consecutive sessions at the current load, meeting all form and RPE criteria, before any increment is permitted. This is the primary autoregulation mechanism — the gate cannot be bypassed by calendar time alone.

| Tier | Sessions Required |
|---|---|
| 1 – Developing | 3 sessions |
| 2 – Building | 3 sessions |
| 3 – Established | 2 sessions |
| 4 – Experienced | 2 sessions |
| 5 – Seasoned | 2 sessions |

---

#### Minimum Time Per Step

Even with the session confirmation gate met, a minimum calendar period must pass between increments. Connective tissue remodeling is time-dependent, not just load-volume dependent. Meeting the session count in one week does not mean the tissue is ready to advance.

| Tier | Minimum Time |
|---|---|
| 1 – Developing | 3 weeks |
| 2 – Building | 2–3 weeks |
| 3 – Established | 2 weeks |
| 4 – Experienced | 2 weeks |
| 5 – Seasoned | 1–2 weeks |

Both gates must clear before an increment is proposed. If the session count is met but the minimum time has not elapsed, the system holds and waits.

---

#### Hold Threshold — Do Not Advance

If the athlete's logged RPE for the current prescribed load equals or exceeds this value during any confirmation session, the advance is blocked and the session confirmation counter resets to zero. The athlete continues at current load.

| Tier | Hold Threshold |
|---|---|
| 1 – Developing | RPE ≥ 7.5 |
| 2 – Building | RPE ≥ 8.0 |
| 3 – Established | RPE ≥ 8.0 |
| 4 – Experienced | RPE ≥ 8.5 |
| 5 – Seasoned | RPE ≥ 8.5 |

---

#### Regression Trigger — Roll Back

If RPE exceeds the regression threshold for the specified number of consecutive sessions, the athlete drops one step (returns to the prior load) and the confirmation counter resets to zero at the lower load.

| Tier | Regression Trigger |
|---|---|
| 1 – Developing | RPE > 8.0 for 2 consecutive sessions |
| 2 – Building | RPE > 8.5 for 2 consecutive sessions |
| 3 – Established | RPE > 9.0 for 2 consecutive sessions |
| 4 – Experienced | RPE > 9.0 for 2 consecutive sessions |
| 5 – Seasoned | RPE > 9.5 for 2 consecutive sessions |

---

### 2.2 Volume & Interval Parameters

These parameters govern all interval and volume-based training: 4×4 boulder rounds, intermittent hangboard repeaters (7:3), critical-force blocks, threshold intervals, and crux-after-fatigue rounds.

---

#### Volume Increment Per Step

Applied when increasing sets, rounds, or total time at a given intensity level.

| Tier | Volume Increment |
|---|---|
| 1 – Developing | 10% |
| 2 – Building | 12% |
| 3 – Established | 15% |
| 4 – Experienced | 17% |
| 5 – Seasoned | 20% |

---

#### Rest Reduction Per Step

Applied when reducing inter-set rest as a load variable. Used exclusively in power-endurance and metabolic blocks. Never applied to max-strength hangboard sessions, where full rest recovery is maintained to protect strength-quality work.

| Tier | Rest Reduction |
|---|---|
| 1 – Developing | 15 sec per step |
| 2 – Building | 20 sec per step |
| 3 – Established | 25 sec per step |
| 4 – Experienced | 30 sec per step |
| 5 – Seasoned | 30–45 sec per step |

---

#### Sessions to Confirm Rest Change

Confirmation sessions required at the new rest interval before any further reduction is permitted.

| Tier | Sessions Required |
|---|---|
| 1 – Developing | 3 sessions |
| 2 – Building | 3 sessions |
| 3 – Established | 2 sessions |
| 4 – Experienced | 2 sessions |
| 5 – Seasoned | 2 sessions |

---

#### Progression Ordering Rule (All Tiers)

The ordering of variable progression is fixed across all tiers. Tier only determines the size of each step, not the order:

1. Add reps or duration within existing sets (volume)
2. Add sets (volume)
3. Reduce rest (density)
4. Increase difficulty or intensity

Never progress to Step 4 while actively progressing Steps 1–3. One variable changes per step.

---

### 2.3 Deload Protocol Parameters

Deloads serve two functions: scheduled recovery periods built into the mesocycle structure, and readiness-triggered resets when symptom signals breach the tier threshold. Both are covered here.

---

#### Scheduled Deload Frequency

Default calendar-based deload cadence. The existing 12-week plans fix deloads at Weeks 4 and 8; this frequency governs readiness-triggered deloads within mesocycles and planning for program extensions or repeats.

| Tier | Frequency |
|---|---|
| 1 – Developing | Every 3 weeks |
| 2 – Building | Every 3–4 weeks |
| 3 – Established | Every 4 weeks |
| 4 – Experienced | Every 4 weeks |
| 5 – Seasoned | Every 4–5 weeks |

---

#### Volume Reduction During Deload

Percentage reduction in total session volume (sets × reps × duration). Intensity is handled separately below. Both must be applied during deload weeks.

| Tier | Volume Reduction |
|---|---|
| 1 – Developing | 55% |
| 2 – Building | 50% |
| 3 – Established | 45% |
| 4 – Experienced | 40% |
| 5 – Seasoned | 35% |

---

#### Intensity During Deload

Whether to maintain or reduce working intensity during deload weeks. Higher tiers maintain intensity because detraining risk outweighs recovery benefit at low deload volumes; lower tiers reduce intensity because the primary goal is tissue recovery and accumulated fatigue clearance.

| Tier | Intensity Handling |
|---|---|
| 1 – Developing | Reduce by 15% of current working load |
| 2 – Building | Reduce by 10% of current working load |
| 3 – Established | Maintain current working intensity |
| 4 – Experienced | Maintain current working intensity |
| 5 – Seasoned | Maintain current working intensity |

---

#### Early Deload Trigger (Symptom-Based)

Threshold for triggering an unscheduled deload regardless of calendar position. When this condition is met, the current week becomes a deload week and the scheduled deload counter resets.

| Tier | Trigger Condition |
|---|---|
| 1 – Developing | Any A2 or pulley-region pain during or after climbing |
| 2 – Building | Morning stiffness in finger joints on 2 or more consecutive days |
| 3 – Established | Morning stiffness in finger joints on 3 or more consecutive days |
| 4 – Experienced | Standard red flags only (sharp pain, pop, significant swelling) |
| 5 – Seasoned | Standard red flags only |

Standard red flags (all tiers): sharp or sudden pain during climbing, audible or felt pop in a finger, visible swelling in a joint within 24 hours of training. These always trigger an immediate session stop and clinical evaluation recommendation, regardless of tier.

---

### 2.4 Recovery Parameters

---

#### Minimum Days Between High-Intensity Finger Sessions

Applies to any session containing max hangs, campus board work, or high-intensity repeaters above approximately 75% MVC. Sessions below this threshold (ARC-style aerobic climbing, technique work, antagonist circuits) do not count against this minimum.

| Tier | Minimum Gap |
|---|---|
| 1 – Developing | 3 days |
| 2 – Building | 3 days |
| 3 – Established | 2–3 days |
| 4 – Experienced | 2 days |
| 5 – Seasoned | 2 days |

For the 4-day plan, the Monday/Thursday layout (3-day gap) satisfies Tiers 1–4. Tier 1–2 athletes on the 4-day plan should default to Tuesday/Saturday layout (4-day gap) as a safety adjustment.

---

#### Weekly sRPE Ceiling

Maximum acceptable total weekly training load, calculated as the sum of (session RPE × session duration in minutes) across all sessions in the week. If projected weekly sRPE approaches the ceiling, the highest-RPE remaining session of the week is reduced in volume.

| Tier | Weekly sRPE Ceiling |
|---|---|
| 1 – Developing | 800 |
| 2 – Building | 950 |
| 3 – Established | 1,100 |
| 4 – Experienced | 1,300 |
| 5 – Seasoned | 1,500 |

The existing 4-day plan targets a weekly sRPE of 1,000–1,400. This range is appropriate for Tiers 4–5. Tier 3 athletes on the 4-day plan should expect to work near the top of their ceiling by Mesocycle 2; this is a signal to monitor closely rather than a hard stop.

---

## Part 3: The Performance Axis

### 3.1 Overview

The Performance Axis determines where training begins within the framework defined by the Profile Score tier. It has three components, each derived from a specific Week 0 assessment test:

| Assessment Test | Derived Score | Sets |
|---|---|---|
| Max hang %BW | Finger Strength Score (FSS) | Starting intensity (exact % MVC within tier range) |
| Intermittent endurance reps | Endurance Score (ES) | Starting repeater set count for Mesocycle 2 |
| Crux-after-fatigue baseline | CAFS baseline | Initial ELS for Mesocycle 1 |

---

### 3.2 Finger Strength Score (FSS) → Starting Intensity

Derived from the max hang test: maximum load held for 7 seconds on a 20–22mm half-crimp edge, expressed as a percentage of body weight (bodyweight ± added/removed load).

| Max Hang %BW | FSS Band | Percentile Within Tier Range |
|---|---|---|
| Less than 50% BW | Very Low | 0th (floor of range) |
| 50–75% BW | Low | 25th |
| 75–100% BW | Moderate | 50th |
| 100–125% BW | High | 75th |
| Greater than 125% BW | Very High | 100th (ceiling of range) |

**Resolution formula:**

```
tierRange = tierCeiling − tierFloor
startingIntensity = tierFloor + (tierRange × fssPercentile)
```

**Example:** Tier 3 athlete (range 82–87% MVC), FSS band = High (75th percentile).

```
tierRange = 87 − 82 = 5
startingIntensity = 82 + (5 × 0.75) = 85.75% → rounded to 86% MVC
```

The FSS and Profile Score tier operate independently. A Tier 1 athlete with a Very High FSS starts at the ceiling of their tier range (82% MVC) — not above it. The tier ceiling is a hard upper bound on starting intensity, regardless of assessment results.

---

### 3.3 Endurance Score (ES) → Starting Repeater Volume

Derived from the intermittent endurance test: number of successful 7-second hangs at 60% MVC, using 7-on/3-off rhythm, before form failure or force drop.

| Reps Completed | ES Band | Starting Repeater Sets (Mesocycle 2) |
|---|---|---|
| Fewer than 10 reps | Very Low | 3 sets |
| 10–20 reps | Low | 4 sets |
| 20–35 reps | Moderate | 5 sets |
| 35–50 reps | High | 6 sets |
| More than 50 reps | Very High | 7 sets |

This starting set count is used at the beginning of Mesocycle 2 intermittent hang sessions. Progression from that point follows the Volume Increment defined by the athlete's Profile Score tier. The two parameters combine: if a Tier 2 athlete starts at 4 sets (Low ES band), their first volume step is +12% (≈ 0.48 sets, rounded to the next whole set at 5 sets after 3 confirmation sessions).

---

### 3.4 CAFS Baseline → Initial ELS

Derived from the crux-after-fatigue baseline test at Week 0: Entry Load Score (ELS) + Crux Difficulty Score (CDS), averaged across 2–3 attempts. This establishes the starting complexity of Mesocycle 1 crux-after-fatigue drills.

| Baseline CAFS | Initial ELS (Mesocycle 1 Week 1) | Entry Grade |
|---|---|---|
| Less than 30 | 15 entry moves | Current on-sight grade |
| 30–50 | 20 entry moves | Current on-sight grade |
| 50–70 | 25 entry moves | 1 grade above on-sight |
| 70–90 | 30 entry moves | 1 grade above on-sight |
| Greater than 90 | 35+ entry moves | 2 grades above on-sight |

The crux grade at program start is always set to the crux grade *achieved* in the baseline test, regardless of CAFS band. The CAFS band governs entry-load complexity only. The crux difficulty is athlete-confirmed from baseline performance, not algorithmically assigned.

---

## Part 4: Combining the Two Axes

### 4.1 How They Interact

The Profile Score and Performance Axis are completely independent at calculation time. They combine only at the point of deriving the athlete's complete starting state.

| Axis | Question It Answers | Input Data |
|---|---|---|
| Profile Score → tier | How fast can this athlete progress? | Onboarding questionnaire |
| Performance Axis | Where does training start? | Week 0 assessment |

Neither axis modifies the other's output. The tier does not change based on assessment results. The starting intensity does not change based on tier (only its ceiling is bounded by the tier).

---

### 4.2 Worked Example: Complete Starting State Derivation

**Onboarding profile:**

| Question | Answer | Points |
|---|---|---|
| Years climbing consistently | 10–20 years | C1 = 38 |
| Age | 35–40 | C2 = 20 |
| Structured training history | Consistent, 1+ year | C3 = 22 |
| Finger injury history | Grade 2 pulley, fully healed | Ceiling = 70 |

```
Raw Score = 38 + 20 + 22 = 80
FPS = min(80, 70) = 70 → Tier 4 (Experienced)
```

**Week 0 assessment results:**

| Test | Result | Derived |
|---|---|---|
| Max hang | 110% BW | FSS band = High (75th percentile) |
| Intermittent endurance | 28 reps | ES band = Moderate → 5 starting sets |
| CAFS baseline | 58 | Initial ELS = 25 moves at 1 grade above on-sight |

**Starting intensity resolution:**

```
Tier 4 range = 85–90% MVC
tierRange = 90 − 85 = 5
startingIntensity = 85 + (5 × 0.75) = 88.75% → 89% MVC
```

**Complete derived starting state:**

- Starting working intensity: 89% MVC
- Repeater starting sets (Mesocycle 2): 5
- Initial ELS (Mesocycle 1): 25 entry moves at 1 grade above on-sight
- Initial crux grade: confirmed from baseline test

**Active progression parameters (from Tier 4 table):**

| Parameter | Value |
|---|---|
| Load increment per step | 4.5% |
| Sessions to confirm advance | 2 |
| Minimum time per step | 2 weeks |
| Hold threshold | RPE ≥ 8.5 |
| Regression trigger | RPE > 9.0 for 2 sessions |
| Volume increment per step | 17% |
| Rest reduction per step | 30 sec |
| Rest confirmation sessions | 2 |
| Deload frequency | Every 4 weeks |
| Deload volume reduction | 40% |
| Deload intensity | Maintain |
| Symptom deload trigger | Standard red flags only |
| Min days between finger sessions | 2 days |
| Weekly sRPE ceiling | 1,300 |

---

### 4.3 Firestore Data Model

The two axes are stored independently for auditability and future recalculation. The plan engine reads only `progressionParams` and `startingState` at runtime.

```json
users/{userId}/trainingProfile {

  "profileScore": {
    "c1_climbingAge": 38,
    "c2_ageRecovery": 20,
    "c3_trainingStructure": 22,
    "rawScore": 80,
    "injuryCeiling": 70,
    "finalScore": 70,
    "tier": 4,
    "tierLabel": "Experienced",
    "injuryHistory": "grade2_healed",
    "calculatedAt": "<timestamp>"
  },

  "performanceAxis": {
    "maxHangBW": 1.10,
    "fssBand": "high",
    "fssPercentile": 0.75,
    "enduranceReps": 28,
    "esBand": "moderate",
    "repeaterStartSets": 5,
    "cafBaseline": 58,
    "cafsBand": "mid",
    "initialCruxGrade": "V4",
    "setAt": "<Week 0 assessment timestamp>"
  },

  "startingState": {
    "startingIntensityPct": 0.89,
    "repeaterStartSets": 5,
    "initialELS": 25,
    "initialELSGrade": "5.10c",
    "initialCruxGrade": "V4",
    "derivedAt": "<timestamp>"
  },

  "progressionParams": {
    "loadIncrementPct": 0.045,
    "sessionsToConfirm": 2,
    "minWeeksPerStep": 2,
    "holdThresholdRPE": 8.5,
    "regressionThresholdRPE": 9.0,
    "regressionSessionCount": 2,
    "volumeIncrementPct": 0.17,
    "restReductionSec": 30,
    "restConfirmSessions": 2,
    "deloadFrequencyWeeks": 4,
    "deloadVolumeReductionPct": 0.40,
    "deloadIntensityReductionPct": 0.0,
    "symptomDeloadTrigger": "standard_red_flags",
    "minRestDaysBetweenFingerSessions": 2,
    "weeklySRPECeiling": 1300
  }

}
```

`deloadIntensityReductionPct` of 0.0 means maintain. Tiers 1–2 would have values of 0.15 and 0.10 respectively.

The performance axis is updated at each assessment point (Weeks 4, 8, 12). Updated assessment data refines `performanceAxis` and recalculates `startingState` for the next mesocycle. `profileScore` and `progressionParams` do not change unless a mid-program injury event occurs.

---

## Part 5: System Rules

### 5.1 Progression Counter Reset Rules

The session confirmation counter resets to zero when any of the following occur:

- The athlete misses 2 or more consecutive scheduled sessions
- A deload week begins (scheduled or symptom-triggered)
- The hold threshold is triggered during a confirmation session
- A regression occurs (counter resets at the prior, lower load)
- A mid-program injury downgrade occurs (counter resets at the new tier's lower load)

The minimum time gate is tracked separately (wall-clock weeks since last load change) and is not reset by confirmation counter resets.

---

### 5.2 Mid-Program Tier Downgrade

If a finger injury occurs mid-program:

1. Apply the new injury ceiling to the current FPS. If the ceiling drops the FPS into a lower tier, the athlete moves to that tier immediately.
2. The new tier's parameters take effect at the next session.
3. If the current working load exceeds the new tier's starting intensity ceiling, the load is reduced to the new tier's floor before resuming.
4. The confirmation counter resets to zero.

Tier upgrades never occur mid-program. A higher-tier assignment requires re-enrollment in a new 12-week cycle, where the updated C1/C2/C3 are recalculated from current onboarding inputs.

---

### 5.3 Score Recalculation Triggers

The Profile Score should be recalculated at the start of each new program cycle. Within a cycle, it recalculates only when:

- A new injury is reported (injury ceiling may drop)
- The athlete returns from a break of 3 or more months (C3 may reset to reflect detraining)

The Performance Axis updates at every testing week (Weeks 4, 8, 12) automatically through the assessment flow. Updated performance data does not change the tier — it only adjusts starting-state values for subsequent mesocycles.

---

### 5.4 Plan Engine Reading Order

At each session start, the plan engine evaluates in this exact order:

1. **Check for active red flags or unresolved symptom triggers.** If present, override to deload session regardless of schedule. No other checks proceed.
2. **Read `progressionParams`** from the athlete's profile document.
3. **Read current step** (current load, current volume, current rest) from the most recent session log.
4. **Check confirmation counter.** If `sessions_at_current_load < sessionsToConfirm`, hold at current load. Do not advance.
5. **Check minimum time gate.** If `weeks_since_last_load_change < minWeeksPerStep`, hold. Do not advance.
6. **Check hold threshold.** If most recent session RPE ≥ `holdThresholdRPE`, hold and reset counter.
7. **Check regression trigger.** If RPE exceeded `regressionThresholdRPE` for `regressionSessionCount` consecutive sessions, apply regression: load − one step, counter reset to 0.
8. **If all gates clear:** propose next increment to the athlete for confirmation before applying.
9. **Post-session:** log RPE, update counter, recalculate weekly sRPE total, check against `weeklySRPECeiling`. If ceiling is breached, flag to reduce the next session's volume.

The athlete confirms proposed increments — the system never silently applies them. This keeps the athlete informed and maintains agency over their own progression.

---

## Appendix: Full Parameter Reference

### A.1 Finger Load Parameters by Tier

| Parameter | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|---|---|---|---|---|---|
| Starting intensity range | 78–82% | 80–84% | 82–87% | 85–90% | 87–92% |
| Load increment | 1.5% | 2.5% | 3.5% | 4.5% | 5.0% |
| Sessions to confirm | 3 | 3 | 2 | 2 | 2 |
| Minimum time per step | 3 weeks | 2–3 weeks | 2 weeks | 2 weeks | 1–2 weeks |
| Hold threshold | RPE ≥ 7.5 | RPE ≥ 8.0 | RPE ≥ 8.0 | RPE ≥ 8.5 | RPE ≥ 8.5 |
| Regression trigger | RPE > 8.0 × 2 | RPE > 8.5 × 2 | RPE > 9.0 × 2 | RPE > 9.0 × 2 | RPE > 9.5 × 2 |

### A.2 Volume & Interval Parameters by Tier

| Parameter | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|---|---|---|---|---|---|
| Volume increment | 10% | 12% | 15% | 17% | 20% |
| Rest reduction | 15 sec | 20 sec | 25 sec | 30 sec | 30–45 sec |
| Sessions to confirm rest change | 3 | 3 | 2 | 2 | 2 |

### A.3 Deload Protocol by Tier

| Parameter | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|---|---|---|---|---|---|
| Scheduled frequency | Every 3 wks | Every 3–4 wks | Every 4 wks | Every 4 wks | Every 4–5 wks |
| Volume reduction | 55% | 50% | 45% | 40% | 35% |
| Intensity during deload | −15% | −10% | Maintain | Maintain | Maintain |
| Symptom trigger | Any pulley pain | 2+ days stiffness | 3+ days stiffness | Red flags only | Red flags only |

### A.4 Recovery Parameters by Tier

| Parameter | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|---|---|---|---|---|---|
| Min days between finger sessions | 3 | 3 | 2–3 | 2 | 2 |
| Weekly sRPE ceiling | 800 | 950 | 1,100 | 1,300 | 1,500 |

### A.5 Performance Axis Reference

| Max Hang %BW | FSS Band | Percentile | Starting Intensity (within tier range) |
|---|---|---|---|
| < 50% BW | Very Low | 0th | Floor of tier range |
| 50–75% BW | Low | 25th | Floor + 25% of range |
| 75–100% BW | Moderate | 50th | Midpoint of range |
| 100–125% BW | High | 75th | Floor + 75% of range |
| > 125% BW | Very High | 100th | Ceiling of tier range |

| Endurance Reps | ES Band | Starting Repeater Sets |
|---|---|---|
| < 10 | Very Low | 3 |
| 10–20 | Low | 4 |
| 20–35 | Moderate | 5 |
| 35–50 | High | 6 |
| > 50 | Very High | 7 |

| CAFS Baseline | Initial ELS | Entry Grade |
|---|---|---|
| < 30 | 15 moves | On-sight grade |
| 30–50 | 20 moves | On-sight grade |
| 50–70 | 25 moves | 1 grade above on-sight |
| 70–90 | 30 moves | 1 grade above on-sight |
| > 90 | 35+ moves | 2 grades above on-sight |
