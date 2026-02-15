# Power Route Training Module — Design Document
## Part of Training Center (One of Four 12-Week Training Programs)

---

## 1. Module Overview

The **Power Route Training Module** targets climbers focused on short, hard sport routes (1-3 minute efforts). It is one of four goal-based programs in the Training Center. When users select "Route Power" at `/training-center`, they enter a 12-week periodized cycle that develops the ability to sustain near-maximal climbing intensity with incomplete recovery — the defining quality for short, hard route performance.

### Core Value Props (Same as Bouldering Module)
- **Guided workouts**: Step-by-step drill execution with route-specific focus
- **Automatic calculations**: sRPE, load progression %, PE interval capacity trends — no manual math
- **Smart safety**: Red/yellow flag detection with route-power-specific thresholds
- **Education at milestones**: Contextual explanations at mesocycle transitions
- **Visual progress**: Charts showing max hang, PE interval capacity, benchmark route performance, and load trends

### What Makes This Module Different from Bouldering
| Aspect | Bouldering Module | Power Route Module |
|---|---|---|
| Primary KPI | Max hang load, send rate | PE interval work capacity, benchmark route time |
| Key stimulus | Max hangs + limit bouldering | Power-endurance intervals + route practice |
| Assessment focus | Finger strength, campus reach | Finger strength, intermittent endurance, benchmark PE route |
| Drill emphasis | Power, contact strength | Sustained intensity, pump management, pacing |
| Session structure | Strength-first every session | Varies by day: strength / PE intervals / technique / route performance |
| Mesocycle 2 focus | Power & RFD (campus board) | Power-endurance intervals (primary training stimulus) |
| Mesocycle 3 focus | Performance bouldering | Route-specific performance + taper for send day |

### Integration with Existing System
Same as bouldering — uses existing Firebase Auth, Firestore, AuthProvider, Next.js App Router, Tailwind CSS v4, and path aliases.

### Component Reuse from Bouldering Module
The bouldering module is built first. The power route module reuses the following **directly or with minimal adaptation**:

**Reuse As-Is (No Changes):**
- `WorkoutProvider.tsx` — Active workout state context
- `RestTimer.tsx` — Between-set rest countdown
- `HangTimer.tsx` — 10s hang countdown with audio
- `SafetyInterrupt.tsx` — Pain/warning overlay
- `Timer.tsx` — General timer component
- `ProgressBar.tsx` — Week/mesocycle/program completion
- `SafetyBanner.tsx` — Red/yellow flag alerts
- `MorningCheckin.tsx` — Daily check-in flow
- `EducationCard.tsx` — Education content cards
- `MilestoneModal.tsx` — Full-screen education at milestones
- `AssessmentFlow.tsx` — Assessment flow shell (step-by-step navigation)
- `MaxHangTest.tsx` — Max hang assessment (identical protocol)
- `InjuryScreen.tsx` — Injury baseline screen (identical)
- All safety calculation logic (`safety.ts`)
- All sRPE calculation logic (`srpe.ts`)
- All metric derivation logic (`metrics.ts`)
- Plan engine architecture (`planEngine.ts` pattern)
- All Firestore operation patterns (CRUD for workouts, assessments, check-ins)

**Reuse with Adaptation (Parameterized or Extended):**
- `DrillCard.tsx` — Same shell, new drill types rendered inside
- `SetLogger.tsx` — Same UI, extended for PE interval round logging
- `WorkoutSummary.tsx` — Same structure, different metric emphasis (PE capacity vs send rate)
- `ProgressComparison.tsx` — Same "last time vs now" pattern, different metrics
- `MaxHangChart.tsx` — Identical chart, shared across modules
- `LoadChart.tsx` — Same weekly sRPE chart, shared
- `RecoveryChart.tsx` — Same daily check-in charts, shared
- `RadarComparison.tsx` — Different axes (PE capacity replaces campus reach)
- `progression.ts` — Same max hang progression logic, plus new PE interval progression rules

**New Components Needed (Power Route Specific):**
- `PEIntervalLogger.tsx` — Round-by-round interval logging with pump tracking
- `PEIntervalTimer.tsx` — Work/rest interval timer with round counter
- `RouteAttemptLogger.tsx` — Redpoint/project burn logging
- `BenchmarkRouteTest.tsx` — PE benchmark route assessment
- `IntermittentHangTest.tsx` — 7:2 endurance assessment
- `ARCLogger.tsx` — Aerobic capacity session logging
- `TechniqueLogger.tsx` — Technical volume session logging
- `PECapacityChart.tsx` — Interval work capacity progression chart
- `BenchmarkRouteChart.tsx` — Benchmark route time/pump trend chart
- `RouteProgressChart.tsx` — Project route high-point trend

---

## 2. Information Architecture

### Page Structure

Uses the **same page structure** as bouldering. No new routes needed — the existing training center routes handle all goal types:

```
/training-center                        → Hub (select goal or view active program)
/training-center/onboarding             → Goal selection + training profile setup
/training-center/dashboard              → Active program dashboard
/training-center/workout/[sessionId]    → Active workout flow (step-by-step)
/training-center/assessment             → Baseline / retest assessment flow
/training-center/history                → Past workout logs
/training-center/history/[workoutId]    → Individual workout detail
/training-center/progress               → Charts + progress comparison
/training-center/education              → Education library
/training-center/education/[slug]       → Individual education piece
```

The pages render different content based on `activeProgram.goalType === "route_power"`. The dashboard, workout flow, and assessment flow all branch on goal type to show the correct drills, metrics, and education.

### User Flow

```
[User already authenticated]
  → Visits /training-center (first time: sees 4 goal options)
  → Selects "Route Power (Short, Hard Routes)"
  → Training onboarding (age/weight/experience/frequency: 2/3/4 day)
  → Week 0 Assessment (2-3 sessions: strength tests, endurance tests, performance baseline)
  → Dashboard appears with Week 1 schedule
  → User taps "Start Workout" → guided session → logs each drill → summary
  → Repeats across the week (session types vary by day)
  → Week 4: Education ("Why Deload?") → Deload + Retest
  → Week 5: Education ("Power-Endurance Phase") → PE intervals become primary
  → ... continues through Week 12
  → Week 12: Taper → SEND DAY on goal route
  → Final assessment + progress report
  → Returns to /training-center to select new goal
```

---

## 3. Data Model (Firebase Firestore)

### Reused from Bouldering Module
- `users/{userId}/trainingProfile` — Shared across all modules (identical)
- `users/{userId}/activeProgram` — Same structure, `goalType: "route_power"`
- `users/{userId}/programHistory/{programId}` — Same structure
- `users/{userId}/dailyCheckins/{date}` — Shared across all modules (identical)

### New Subcollections (Power Route Specific)

```
users/
  {userId}/
    // --- POWER ROUTE: ASSESSMENTS (Weeks 0, 4, 8, 12) ---
    routePowerAssessments/
      {assessmentId}/
        programId: string
        week: number                    // 0, 4, 8, 12
        date: Timestamp
        maxHang: {                      // SAME SHAPE as bouldering
          attempts: [{
            load: number
            addedWeight: number
            heldFull7s: boolean
            notes: string
          }]
          bestLoad: number
          percentBodyweight: number
          edgeSize: number
          gripType: "half_crimp" | "open_hand" | "other"
        }
        intermittentEndurance: {        // NEW: 7:2 hang test
          load: number                  // 60% of max hang
          protocol: "7on_2off" | "7on_3off"
          totalReps: number
          totalTimeSeconds: number
          stoppingReason: "force_drop" | "form_fail" | "pain" | "time_limit"
          forceQuality: number          // 1-10
          notes: string
        }
        benchmarkRoute: {               // NEW: PE route test
          routeDescription: string
          grade: string
          timeToComplete: number        // seconds
          fallsOrHangs: number
          pumpAtFinish: number          // 1-10
          restQuality: number           // 1-5
          movementQuality: number       // 1-5
          primaryLimitation: "forearm_pump" | "finger_strength" | "contact_strength" | "technique" | "sustained_intensity"
          pacing: "too_fast" | "good" | "too_slow"
          shakeoutEfficiency: "good" | "moderate" | "poor"
          notes: string
        }
        pullingStrength: {              // SAME SHAPE as bouldering
          attempts: [{
            addedWeight: number
            repsCompleted: number
            quality: "clean" | "ok" | "struggle"
          }]
          bestWeightXReps: string
        } | null
        limitBoulders: [{               // SAME SHAPE as bouldering (optional for route power)
          problemDescription: string
          grade: string
          attemptsToSend: number
          sent: boolean
          highPoint: string | null
          style: "power" | "technical" | "compression"
          notes: string
        }] | null
        injuryBaseline: { ... }         // SAME SHAPE as bouldering (identical)

    // --- POWER ROUTE: WORKOUTS ---
    routePowerWorkouts/
      {workoutId}/
        programId: string
        date: Timestamp
        week: number
        mesocycle: 1 | 2 | 3
        sessionLabel: string            // "A", "B", "C", "D"
        sessionType: string             // see Session Types below
        status: "in_progress" | "completed" | "skipped"
        duration: number                // minutes
        startedAt: Timestamp
        completedAt: Timestamp | null
        rpe: number                     // 0-10
        srpe: number                    // auto: duration × RPE
        sessionQuality: number          // 1-5

        drills: [{                      // SAME ARRAY STRUCTURE as bouldering
          drillId: string
          drillType: string
          order: number
          completed: boolean
          data: object                  // shape varies by drill type
          completedAt: Timestamp
        }]

        notes: string
        fingerPainDuring: number        // 0-10
        skinCondition: "good" | "fair" | "poor"
```

### Session Types (Power Route Specific)

The power route module has more session variety than bouldering. Session types change based on frequency and mesocycle:

| Session Type | Code | When Used |
|---|---|---|
| Max Finger Strength | `max_strength` | M1: Session A (all frequencies) |
| Upper Body Strength + ARC | `strength_arc` | M1: Session B (3-4 day) |
| Easy Mileage + Antagonist | `easy_mileage_antagonist` | M1: Session B (3-day) |
| Technical Volume | `technical_volume` | M1: Session C (4-day) |
| Light PE + Route Practice | `light_pe_routes` | M1: Session C (3-day), Session D (4-day) |
| Strength Maintenance + PE Intervals | `strength_maintenance_pe` | M2: Session A (all frequencies) |
| High-Intensity PE Intervals | `high_intensity_pe` | M2: Session B (4-day) |
| Active Recovery + Technical | `active_recovery_tech` | M2: Session C (4-day) |
| Route Performance | `route_performance` | M2-M3: Session C (3-day), Session D (4-day) |
| Light Intervals + Project | `light_intervals_project` | M3: Session A (all frequencies) |
| Strength Maintenance Only | `strength_maintenance` | M3: Session B (3-day) |
| Light Technical | `light_technical` | M3: Session C (4-day) |
| Performance Day | `performance_day` | M3: Session D (4-day), Week 12 send day |

### Drill Data Shapes (Power Route Specific)

Reused from bouldering (identical shapes):
- `MaxHangData` — Same
- `LimitBoulderData` — Same
- `CampusDrill` — Same (optional, used in M2 for 4-day)
- `PullUpData` — Same
- `AntagonistData` — Same
- `EasyClimbingData` — Same (used for ARC sessions)
- `CoreData` — Same
- `MobilityData` — Same

**New drill data shapes for Power Route:**

```typescript
// Power-Endurance Interval Drill (PRIMARY TRAINING STIMULUS)
type PEIntervalData = {
  sets: [{
    targetRounds: number
    completedRounds: number
    workSeconds: number             // e.g., 45, 60
    restSeconds: number             // e.g., 75, 90
    rounds: [{
      roundNumber: number
      intensity: number             // RPE 1-10
      pumpLevel: number             // 1-10
      completed: boolean
      formQuality: "maintained" | "slight_decline" | "poor"
      notes: string
    }]
    restBetweenSetsMinutes: number
    recoveryQuality: "complete" | "good" | "partial" | "insufficient"
  }]
  totalRoundsCompleted: number      // auto
  totalRoundsTarget: number         // auto
  completionRate: number            // auto: completed/target
  pacingAssessment: "started_hard_faded" | "started_hard_slight_fade" | "good_throughout" | "conservative_strong_finish" | "struggled_throughout"
  powerMaintenance: "strong" | "good_slight_decline" | "moderate_decline" | "significant_dropoff"
  movementQualityUnderFatigue: "maintained" | "slight_degradation" | "noticeable_breakdown" | "poor"
}

// Route Attempt / Redpoint Drill
type RouteAttemptData = {
  routeName: string
  grade: string
  routeStyle: "short_power" | "medium_pe" | "sustained" | "mixed"
  attempts: [{
    attemptNumber: number
    result: "send" | "fall" | "hang" | "working"
    highPoint: string | null         // move # or hold description
    timeClimbing: number             // minutes
    pumpAtCrux: number              // 1-10
    energyAtCrux: number            // 1-10
    betaChanges: "major" | "minor" | "none" | "dialed"
    quality: number                  // 1-5
    notes: string
  }]
  totalAttempts: number             // auto
  sent: boolean                     // auto
  sendAttemptNumber: number | null  // auto
  limitingFactor: "finger_strength" | "forearm_endurance" | "power_contact" | "technique_beta" | "mental_fear" | "tactics_pacing" | null
  progressVsLastWeek: "better" | "same" | "worse" | null
  videoAnalysisNotes: string
}

// Intermittent Hang Endurance Drill (Assessment & Training)
type IntermittentHangData = {
  load: number                      // 60% of max hang
  protocol: "7on_2off" | "7on_3off"
  sets: [{
    targetReps: number | null       // null = to failure
    completedReps: number
    stoppingReason: "target_reached" | "force_drop" | "form_fail" | "pain"
    forceQuality: number            // 1-10
    burnLevel: number               // 1-10
    restAfterMinutes: number
    notes: string
  }]
  totalReps: number                 // auto
  totalTimeUnderTension: number     // auto: seconds
  averageRepsPerSet: number         // auto
}

// Technical Volume Drill
type TechnicalVolumeData = {
  routes: [{
    grade: string
    style: "vertical" | "slab" | "overhang" | "technical"
    result: "send" | "fall" | "working"
    quality: "clean" | "ok" | "poor"
    pumpLevel: number               // 1-10
    notes: string
  }]
  totalRoutes: number               // auto
  totalSends: number                // auto
  techniqueFocusAreas: string[]     // e.g., ["silent_feet", "clipping", "pacing"]
  techniqueQuality: number          // 1-5
  efficiencyMarkers: {
    unnecessaryMoves: "more" | "same" | "fewer"
    shakeQuality: "poor" | "okay" | "good"
    paceControl: "rushed" | "good" | "too_slow"
  }
  keyLearning: string
}
```

---

## 4. Plan Engine

### Plan Definition Structure

Same TypeScript types as bouldering: `PlanDefinition`, `WeekDefinition`, `SessionDefinition`, `DrillDefinition`. Stored as static files in `/src/lib/plans/route-power/`.

```
src/lib/plans/route-power/
  types.ts                          // Can re-export from bouldering types (identical)
  2day.ts                           // 2-day plan definition
  3day.ts                           // 3-day plan definition
  4day.ts                           // 4-day plan definition
  drills.ts                         // Drill definition catalog (route-power specific)
  planEngine.ts                     // Logic: user state → next workout
  calculations.ts                   // Target load, PE progression logic
```

### Mesocycle Structure (All Frequencies)

| Period | Focus | Max Hangs | PE Intervals | Route Work |
|---|---|---|---|---|
| **M1 (Weeks 1-4)** | Strength Foundation + Aerobic Base | 6 sets × 10s @ 85-90% (building) | Light intro: 2 sets × 4-5 rounds | Technique + variety |
| **Week 4** | Deload + Retest | 3 sets (reduced volume) | 1 set × 3 rounds | Retest benchmark route |
| **M2 (Weeks 5-8)** | Power-Endurance Development | 4 sets × 10s (maintenance) | **PRIMARY**: 2-3 sets × 6-7 rounds | Redpoint/project focus |
| **Week 8** | Deload + Retest | 3 sets (reduced) | 1 set × 4 rounds | Retest benchmark |
| **M3 (Weeks 9-12)** | Route Performance + Taper | 3 sets → 2 sets (tapering) | 1-2 sets × 4-5 rounds → none | **PRIMARY**: Send attempts |
| **Week 12** | Taper + Peak | 2 sets (touch stimulus) | None | SEND DAY |

### Frequency-Specific Session Layout

**2-Day Plan:**

| | Session 1 (e.g., Tuesday) | Session 2 (e.g., Saturday) |
|---|---|---|
| M1 | Max Hangs + Pulls + Easy Mileage | Light PE Intervals + Route Practice + Antagonist |
| M2 | Strength Maintenance + High PE Intervals + Recovery Climbing | Route Performance + Antagonist |
| M3 | Strength Maintenance + Light Intervals + Easy Volume | Performance Attempts / Send Day |

**3-Day Plan:**

| | Session A (Mon) | Session B (Wed) | Session C (Fri) |
|---|---|---|---|
| M1 | Max Hangs + Technical Bouldering | Easy Mileage (ARC) + Antagonist | Weighted Pulls + Route Practice |
| M2 | PE Intervals (primary stimulus) | Max Hangs Maintenance + Easy Tech | Redpoint Burns + Cool-down |
| M3 | Light Intervals + Project Burns | Strength Maintenance + Easy Movement | Route Practice + Strategy |

**4-Day Plan:**

| | Session 1 (Mon) | Session 2 (Tue) | Session 3 (Thu) | Session 4 (Fri) |
|---|---|---|---|---|
| M1 | Max Finger Strength + Limit Bouldering | Upper Body Strength + ARC | Technical Volume + Movement Skills | Light PE Intervals + Route Practice |
| M2 | Strength Maintenance + Power/Explosive Work | **HIGH-INTENSITY PE Intervals** | Active Recovery + Technical | Route Performance + Project Work |
| M3 | Minimal Strength + Project-Specific Drills | Light PE Maintenance | Light Technical Day | **PERFORMANCE DAY** |

### PE Interval Progression Logic

This is the most important auto-calculation in the module. PE intervals are the primary training stimulus for route power.

```typescript
// /src/lib/plans/route-power/calculations.ts

type PEProgressionConfig = {
  frequency: 2 | 3 | 4
  currentWeek: number
  mesocycle: 1 | 2 | 3
}

function getPEIntervalTarget(config: PEProgressionConfig): PEIntervalTarget {
  // Mesocycle 1: Light introduction
  if (config.mesocycle === 1) {
    if (config.currentWeek <= 2) {
      return { sets: 2, rounds: 4, workSeconds: 45, restSeconds: 90 }
    }
    return { sets: 2, rounds: 5, workSeconds: 50, restSeconds: 90 }
  }

  // Mesocycle 2: Primary stimulus — progression hierarchy:
  // 1. Add rounds (volume first)
  // 2. Reduce rest periods (10-15 sec reduction)
  // 3. Increase difficulty (steeper/smaller holds)
  // 4. Add sets (only in Week 6-7)
  if (config.mesocycle === 2) {
    const setsForFrequency = config.frequency === 2 ? 2 : 3
    if (config.currentWeek <= 6) {
      return { sets: setsForFrequency, rounds: 6, workSeconds: 60, restSeconds: 90 }
    }
    return { sets: setsForFrequency, rounds: 7, workSeconds: 60, restSeconds: 75 }
  }

  // Mesocycle 3: Maintenance taper
  if (config.currentWeek <= 10) {
    return { sets: config.frequency >= 3 ? 2 : 1, rounds: 5, workSeconds: 45, restSeconds: 90 }
  }
  if (config.currentWeek === 11) {
    return { sets: 1, rounds: 3, workSeconds: 45, restSeconds: 90 }
  }
  // Week 12: No intervals
  return null
}

// Progression suggestion (run after each PE session)
function evaluatePEProgression(
  recentSessions: PEIntervalData[]
): ProgressionSuggestion {
  const latest = recentSessions[0]

  // Check completion rate
  if (latest.completionRate >= 0.95 && latest.movementQualityUnderFatigue !== "poor") {
    // Ready to progress — suggest ONE variable change
    return {
      type: "progress",
      message: "Strong completion! Consider progressing next session.",
      suggestions: [
        "Add 1-2 rounds per set",
        "Reduce rest by 10-15 seconds",
        "Use steeper/smaller holds"
      ]
    }
  }

  if (latest.completionRate < 0.75) {
    return {
      type: "reduce",
      message: "Completion below 75%. Consider reducing volume or increasing rest."
    }
  }

  return { type: "maintain", message: "Good work. Stay at current level." }
}
```

### Modified Progression Rules by Frequency

```typescript
// Max Hang Progression
const maxHangProgressionRules = {
  // 2-day: More conservative (lower frequency = slower adaptation)
  2: { consecutiveCleanSessions: 3, loadIncrementPercent: 2.5 },
  // 3-day: Standard
  3: { consecutiveCleanSessions: 2, loadIncrementPercent: 2.5 },
  // 4-day: Standard but careful due to higher weekly volume
  4: { consecutiveCleanSessions: 2, loadIncrementPercent: 2.5 }
}

// PE Interval Progression
const peProgressionRules = {
  // 2-day: Progress every 2 weeks
  2: { progressionFrequencyWeeks: 2 },
  // 3-day: Progress weekly (one variable)
  3: { progressionFrequencyWeeks: 1 },
  // 4-day: Progress weekly (one variable)
  4: { progressionFrequencyWeeks: 1 }
}
```

---

## 5. Assessment System

### Assessment Schedule
Same as bouldering: Weeks 0, 4, 8, 12.

### Assessment Tests (Power Route Specific)

The power route assessment includes tests shared with bouldering plus route-specific tests:

**Shared with Bouldering (identical UI components):**
1. Finger Max Strength (7-second max hang, 20-22mm edge) — reuse `MaxHangTest.tsx`
2. Injury Baseline — reuse `InjuryScreen.tsx`
3. Pulling Strength (optional) — reuse from bouldering

**New for Power Route:**
4. Intermittent Finger Endurance (60% MVC, 7:2 work:rest) — new `IntermittentHangTest.tsx`
5. Power-Endurance Benchmark Route (2-3 min duration) — new `BenchmarkRouteTest.tsx`
6. Limit Boulder Session (optional, Week 0 only) — reuse `BoulderBenchmark.tsx`

### Assessment Flow (for 4-day plan — spread across 2-3 sessions)

```
Session 1: Strength Tests
  → Max Hang Test (guided progressive loading)
  → Weighted Pull-up 3-5RM Test
  → Optional: Campus max reach / standardized dyno test

Session 2: Endurance Tests
  → Intermittent Hang Test (7:2 at 60% MVC)
  → Benchmark PE Route/Circuit (2-3 min duration)
  → Optional: 30-second all-out finger test

Session 3: Performance Baseline
  → Limit Boulder Session (track max grade, attempts-to-send)
  → Current project route assessment
  → Movement efficiency notes
  → Complete Injury Screen
```

For 2-day and 3-day plans, tests are compressed into fewer sessions with the same content.

---

## 6. Education System

### When Education Triggers (Power Route Specific)

| Trigger Point | Slug | Title |
|---|---|---|
| Before Week 0 assessment | `route-power-intro-why-test` | "Why We Test Before Training" |
| Start of Week 1 | `route-power-meso1-strength-base` | "Building Your Strength Foundation + Aerobic Base" |
| Week 4 deload | `route-power-why-deload` | "Why Deload Weeks Make You Stronger" |
| Start of Week 5 | `route-power-meso2-pe-development` | "Power-Endurance: Training for Short, Hard Routes" |
| Week 5 PE intro | `route-power-pe-intervals-guide` | "How to Execute PE Intervals for Maximum Benefit" |
| Week 8 deload | `route-power-mid-program-check` | "Halfway Check: Reading Your Data" |
| Start of Week 9 | `route-power-meso3-performance` | "Performance Phase: Converting Fitness to Sends" |
| Week 11 taper | `route-power-taper-peak` | "Tapering: Less Is More — Preparing for Send Day" |
| After Week 12 | `route-power-program-complete` | "What Your Numbers Mean & What's Next" |

### Education Content Structure

Same as bouldering: MDX files in `/src/content/training/route-power/`. Same `EducationPiece` type with `goalType: "route_power"`.

### Key Education Topics (Unique to Power Route)

**"Power-Endurance: Training for Short, Hard Routes" (Week 5):**
1. What PE intervals actually train — the ability to sustain near-maximal output with incomplete recovery
2. Why short routes fail — not aerobic capacity, but inability to maintain power through 8-15 hard moves
3. How intervals map to real routes — 60s ON mimics a 1-2 minute route section
4. What to expect — pump progression, how to pace, when to stop a set
5. The strength ceiling concept — why max strength maintenance matters during PE phase

**"How to Execute PE Intervals" (Week 5, companion piece):**
1. Wall selection — steep circuits that match project angle
2. Pacing strategy — don't blow up in round 1, build into it
3. Reading pump signals — when to push through vs. when to stop
4. Recovery between sets — what "complete recovery" means
5. Progression rules — only change one variable per week

---

## 7. Dashboard Design

Same layout as bouldering dashboard, but with different metric cards:

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Week 6 of 12 · Mesocycle 2: Power-Endurance│
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  50% complete                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  TODAY'S WORKOUT                             │    │
│  │  Session B: High-Intensity PE Intervals      │    │
│  │  ~90 min · RPE target: 8-9                   │    │
│  │                                              │    │
│  │  [ START WORKOUT →  ]                        │    │
│  │  or: Mark as Rest Day / Skip                 │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌──── KEY METRICS ─────────────────────────────┐   │
│  │                                               │   │
│  │  Max Hang     PE Capacity     Benchmark Route │   │
│  │  186 lbs (+5%)  21 rounds    2:15 (−18 sec)  │   │
│  │  ▁▂▃▄▅▆       ▁▃▅▆▇         ▇▆▅▃▂          │   │
│  │  (sparklines showing trend across test weeks) │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── THIS WEEK ───────────────────────────────┐   │
│  │  Mon: Session A ✓ (sRPE: 480)               │   │
│  │  Tue: Session B ← TODAY                      │   │
│  │  Wed: REST                                    │   │
│  │  Thu: Session C (upcoming)                    │   │
│  │  Fri: Session D (upcoming)                    │   │
│  │  Sat-Sun: REST                                │   │
│  │                                               │   │
│  │  Weekly sRPE so far: 480 / ~2,800 target     │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── SAFETY MONITOR ──────────────────────────┐   │
│  │  ● Finger status: 2/10 (OK)                  │   │
│  │  ● Load trend: +15% vs last week (OK)        │   │
│  │  ● Recovery: 4/5 avg (Good)                  │   │
│  │  ● Forearm recovery from Tuesday: ✓ Complete  │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Key Differences from Bouldering Dashboard
- **PE Capacity metric** replaces Campus Reach
- **Benchmark Route time** replaces Send Rate
- **Forearm recovery indicator** added to safety monitor (critical for PE training)
- **Weekly sRPE targets** are higher for 4-day plans

---

## 8. Active Workout Flow

### Workout Flow Architecture

Same step-by-step shell as bouldering. The key difference is the variety of session types and drill types.

**Example Flow: High-Intensity PE Intervals Session (M2, 4-Day, Session B):**

```
Start Workout
  → Pre-workout safety check (auto: checks morning check-in + Tuesday recovery)
  → Drill 1: Progressive Warm-Up
    → Instructions screen
    → Timer (20 min)
    → Log completion
  → Drill 2: PE Intervals (PRIMARY STIMULUS)
    → Instructions + target displayed (3 sets × 6 rounds, 60s ON / 90s REST)
    → Set 1:
      → Round 1 → work timer (60s) → log intensity + pump level
      → Rest timer (90s)
      → Round 2 → work timer → log
      → ... repeat for all rounds
      → Set summary: "6/6 rounds, pump 3→8/10, form maintained"
    → Inter-set rest timer (10 min)
    → Set 2 → repeat
    → Set 3 → repeat
    → Overall summary: "18/18 rounds, good pacing, moderate power decline"
  → Drill 3: Cool-Down (easy routes)
    → Instructions + timer
    → Log completion
  → Post-Workout Summary
    → Rate session RPE (0-10 slider) — target 8-9
    → Rate session quality (1-5)
    → Finger pain check (0-10)
    → Forearm tightness (0-10)
    → Skin condition
    → Notes
    → Auto-calculated: sRPE, total rounds, completion rate, PE capacity trend
    → Safety check: any flags triggered?
    → Progression suggestion: "Consider adding 1 round per set next session"
  → Save & Return to Dashboard
```

**Example Flow: Route Performance Session (M3, 4-Day, Session D):**

```
Start Workout
  → Pre-workout safety check
  → Drill 1: Progressive Warm-Up (30-40 min)
    → Matching project style
    → Mental preparation
  → Drill 2: Redpoint Attempts (PRIMARY FOCUS)
    → Instructions: "3-5 burns, 20-30 min rest between"
    → Burn 1 → log result, high point, pump at crux, energy at crux, beta notes
    → Rest timer (20 min) + "Visualize next attempt" prompt
    → Burn 2 → log
    → ... dynamic (user adds burns)
    → "Done with project" button
    → Summary: "4 attempts, high point at move 22, best quality: burn 3"
  → Drill 3: Confidence Builder (optional)
    → 1-2 easier routes
    → Log sends
  → Post-Workout Summary
    → RPE, quality, pain
    → Limiting factor selection (finger/endurance/power/technique/mental/tactics)
    → Video analysis notes (free text)
    → Progress vs last week
    → Auto: send detection, high point tracking
  → Save & Return to Dashboard
```

### PE Interval Timer UX (New Component)

The PE interval timer is the most important new UI element. It needs to:

1. **Show the current state clearly**: "Set 2 of 3 · Round 4 of 6 · WORK (42s remaining)"
2. **Auto-advance**: Work → Rest → Work → Rest → Set break → repeat
3. **Audio cues**: Beep at 5s warning, different sound for work start vs rest start
4. **Round logging between rests**: Quick pump level slider (1-10) and form quality tap during rest period
5. **Set summary**: Auto-generated after each set
6. **Early stop**: "End set early" button if form degrades

---

## 9. Automatic Calculations & Smart Features

### Auto-Calculated Metrics (Extends Bouldering)

All bouldering calculations carry over (sRPE, weekly sRPE, week-over-week change, max hang % BW, target load). New calculations:

| Metric | Formula | Where Used |
|---|---|---|
| PE interval completion rate | `completedRounds / targetRounds × 100` | Every PE session summary |
| Total PE work capacity | Sum of all completed rounds × work seconds | Weekly dashboard, progress charts |
| Benchmark route improvement | `(week0Time - currentTime) / week0Time × 100` | Assessment comparison |
| Pump management score | Average pump at round N across sessions | Progress tracking |
| Intermittent endurance change | `(currentReps - baselineReps) / baselineReps × 100` | Assessment comparison |
| Route attempt quality trend | Average quality rating across weeks | Progress charts |
| Project high-point trend | Track high-point per week | Route progress chart |

### Safety Flag Rules (Extends Bouldering)

All bouldering safety rules carry over. Additional route-power-specific rules:

```typescript
const routePowerSafetyRules: SafetyRule[] = [
  // All bouldering rules (finger_pain_acute, srpe_spike, stiffness_trend, etc.)
  ...boulderingSafetyRules,

  // NEW: Route-power specific
  {
    id: "forearm_recovery_incomplete",
    severity: "yellow",
    condition: (d) => d.latestCheckin.forearmSoreness >= 6
      && d.nextSessionType === "high_intensity_pe",
    message: "Forearm soreness ≥6/10 before PE interval session",
    action: "Consider swapping to easy/recovery session today"
  },
  {
    id: "pe_completion_declining",
    severity: "yellow",
    condition: (d) => isPECompletionDeclining(d.recentPESessions, 3),
    message: "PE interval completion rate declining for 3+ sessions",
    action: "May indicate accumulated fatigue. Consider extra rest day or deload."
  },
  {
    id: "back_to_back_high_intensity",
    severity: "yellow",
    condition: (d) => d.frequency === 4
      && d.yesterdayRPE >= 8
      && d.todaySessionType === "high_intensity_pe",
    message: "Back-to-back high-intensity days detected",
    action: "Ensure sleep ≥8hrs and nutrition is dialed. Monitor closely."
  },
  {
    id: "monotony_high",
    severity: "yellow",
    condition: (d) => d.weeklyMonotony > 2.0 && d.consecutiveHighMonotony >= 2,
    message: "Training monotony score >2.0 for 2 consecutive weeks",
    action: "Consider unscheduled deload or more session variety"
  },
  {
    id: "strain_high",
    severity: "yellow",
    condition: (d) => d.weeklyStrain > 100 && d.consecutiveHighStrain >= 2,
    message: "Training strain score >100 for 2 consecutive weeks",
    action: "Mandatory deload recommended"
  }
]
```

### Deload Trigger Rules

Beyond scheduled deloads (Weeks 4, 8), auto-trigger deload if:
- Monotony score >2.0 for 2 consecutive weeks
- Strain score >100 for 2 consecutive weeks
- 3+ yellow flags on weekly check
- Performance declining 2+ weeks
- Motivation <3/5 for 2+ weeks
- Sleep quality <3/5 for full week

---

## 10. Progress Visualization

### Charts (Reused from Bouldering)
1. **Max Hang Progression** — Identical, shared component
2. **Weekly sRPE Load** — Identical, shared component
3. **Recovery Dashboard** — Identical, shared component

### Charts (New for Power Route)

**4. PE Interval Work Capacity (Bar + Line Chart)**
- X-axis: Weeks 1-12
- Y-axis (bars): Total rounds completed per week
- Y-axis (line): Average completion rate %
- Color-coded by mesocycle
- Deload weeks visually distinct
- This is the PRIMARY performance indicator

**5. Benchmark Route Progress (Line Chart)**
- X-axis: Test weeks (0, 4, 8, 12)
- Y-axis: Time to completion (seconds)
- Secondary line: Pump at finish (1-10)
- Tertiary line: Movement quality (1-5)
- Shows improvement in the KEY performance metric

**6. Route Progress Tracker (Scatter/Timeline Chart)**
- X-axis: Weeks
- Y-axis: High point on project route (move # or percentage)
- Annotations: Send markers, beta change markers
- Shows progress toward send

**7. Radar/Spider Chart (Assessment Comparison)**
- Axes: Max Hang, Intermittent Endurance, PE Capacity, Benchmark Route, Pull-up Strength, Recovery Score
- Overlay: Week 0 vs Week 4 vs Week 8 vs Week 12
- Different axes from bouldering (PE Capacity + Benchmark Route replace Campus Reach + Send Rate)

---

## 11. sRPE Targets by Frequency

### 2-Day Plan

| Period | Weekly sRPE Target |
|---|---|
| M1 Weeks 1-3 | 120-200 |
| M1 Week 4 (deload) | 60-100 |
| M2 Weeks 5-7 | 160-240 |
| M2 Week 8 (deload) | 80-120 |
| M3 Weeks 9-10 | 140-200 |
| M3 Week 11 | 100-140 |
| M3 Week 12 (taper) | 60-100 |

### 3-Day Plan

| Period | Weekly sRPE Target |
|---|---|
| M1 Weeks 1-3 | 180-280 |
| M1 Week 4 (deload) | 90-140 |
| M2 Weeks 5-7 | 240-340 |
| M2 Week 8 (deload) | 120-170 |
| M3 Weeks 9-10 | 200-280 |
| M3 Week 11 | 140-200 |
| M3 Week 12 (taper) | 80-120 |

### 4-Day Plan

| Period | Weekly sRPE Target |
|---|---|
| M1 Weeks 1-3 | 240-320 |
| M1 Week 4 (deload) | 140-180 |
| M2 Weeks 5-7 | 280-360 |
| M2 Week 8 (deload) | 160-200 |
| M3 Weeks 9-10 | 220-280 |
| M3 Week 11 | 180-220 |
| M3 Week 12 (taper) | 100-140 |

---

## 12. Project Structure (New Files Only)

Everything below is NEW. All shared components live in the bouldering module's directories and are imported by power route pages.

```
src/
  lib/
    plans/
      route-power/                       // 🆕 Power route plan definitions
        types.ts                         // Re-export from bouldering types
        2day.ts
        3day.ts
        4day.ts
        drills.ts                        // Route-power drill catalog
        planEngine.ts                    // User state → next workout
        calculations.ts                  // PE progression, benchmark calcs

    firebase/
      training/
        route-power-assessments.ts       // 🆕 Assessment CRUD
        route-power-workouts.ts          // 🆕 Workout CRUD

  components/
    training/
      workout/
        PEIntervalLogger.tsx             // 🆕 Round-by-round PE logging
        PEIntervalTimer.tsx              // 🆕 Work/rest interval timer
        RouteAttemptLogger.tsx           // 🆕 Redpoint burn logging
        IntermittentHangLogger.tsx       // 🆕 7:2 endurance drill logger
        ARCLogger.tsx                    // 🆕 Aerobic capacity logger
        TechniqueLogger.tsx              // 🆕 Technical volume logger

      assessment/
        IntermittentHangTest.tsx          // 🆕 7:2 endurance test
        BenchmarkRouteTest.tsx           // 🆕 PE benchmark route test

      progress/
        PECapacityChart.tsx              // 🆕 Interval work capacity chart
        BenchmarkRouteChart.tsx          // 🆕 Benchmark route trend
        RouteProgressChart.tsx           // 🆕 Project high-point trend

  content/
    training/
      route-power/                       // 🆕 Education MDX files
        intro-why-test.mdx
        meso1-strength-base.mdx
        why-deload.mdx
        meso2-pe-development.mdx
        pe-intervals-guide.mdx
        mid-program-check.mdx
        meso3-performance.mdx
        taper-peak.mdx
        program-complete.mdx
```

### Estimated New Component Count
- **New components**: ~12 (vs ~30+ for bouldering)
- **Reused components**: ~20+ directly from bouldering
- **Shared infrastructure**: 100% (Firebase operations, safety engine, sRPE, plan engine pattern)

---

## 13. Expected Outcomes by Frequency

### 2-Day Plan (12 Weeks)
- Max hang: +5-10%
- Intermittent endurance: +15-30%
- Benchmark route: Faster time or lower pump
- Route grade: 1 letter grade improvement
- Note: May need 16-20 weeks for results a 3-day plan achieves in 12

### 3-Day Plan (12 Weeks)
- Max hang: +5-15%
- Intermittent endurance: +20-40%
- PE interval capacity: +30-50% volume
- Route grade: 1-2 letter grade progression (e.g., 5.11d → 5.12b)

### 4-Day Plan (12 Weeks)
- Max hang: +8-15%
- Intermittent endurance: +25-45%
- PE interval capacity: +40-60% volume
- Pull-up strength: +10-20%
- Route grade: 1-2 letter grades (e.g., 5.11d → 5.12b/c)
- Movement efficiency: Measurably improved
- Attempts-to-send: Reduced by 20-40%

---

## 14. Implementation Priority

Since the bouldering module is built first, the power route module benefits from all shared infrastructure. Implementation focuses on new components only.

### Phase 1: Plan Definitions + Data Layer (1 week)
1. Plan definition files (2day.ts, 3day.ts, 4day.ts, drills.ts)
2. Plan engine (planEngine.ts, calculations.ts)
3. Firestore operations (route-power-assessments.ts, route-power-workouts.ts)
4. Wire goal type branching into existing dashboard and workout flow pages

### Phase 2: Assessment + New Drill Components (1 week)
5. IntermittentHangTest.tsx
6. BenchmarkRouteTest.tsx
7. PEIntervalLogger.tsx + PEIntervalTimer.tsx
8. RouteAttemptLogger.tsx
9. Wire new drill types into existing DrillCard.tsx routing

### Phase 3: Supporting Drill Components (1 week)
10. ARCLogger.tsx
11. TechniqueLogger.tsx
12. IntermittentHangLogger.tsx (for training use, not just assessment)
13. PE-specific safety rules
14. PE progression logic

### Phase 4: Visualization + Education (1 week)
15. PECapacityChart.tsx
16. BenchmarkRouteChart.tsx
17. RouteProgressChart.tsx
18. Radar chart with route-power axes
19. Education MDX content (9 articles)
20. Milestone modal triggers for route-power education slugs

### Estimated Total: ~4 weeks (vs ~8 weeks for bouldering from scratch)

---

## 15. Key Design Decisions

### Why separate PE interval tracking from generic set logging?
PE intervals are the primary training stimulus for route power. The round-by-round pump tracking, pacing assessment, and power maintenance metrics are unique to this drill type. A dedicated logger captures the granular data needed for meaningful progression analysis.

### Why include benchmark route testing?
The benchmark route is the closest proxy to actual route performance. Time to completion and pump rating on the same route across 12 weeks is the most direct measure of improvement for short, hard routes. It answers: "Can I sustain harder climbing for longer?"

### Why different session types per day (vs bouldering's uniform sessions)?
Short, hard route performance requires multiple training qualities that interfere with each other when combined: max strength (high neural demand), PE intervals (high metabolic stress), and technique (low intensity, high volume). Separating these across different days (especially in 3-4 day plans) allows each stimulus to be higher quality.

### Why is the PE interval timer a separate component from the existing HangTimer?
The PE interval timer manages a complex state machine: multiple rounds within multiple sets, with different work/rest durations, inter-set breaks, and per-round logging prompts. The hang timer is a simple countdown. Sharing code would create unnecessary complexity in the simpler component.

### Why track forearm recovery specifically?
Unlike bouldering where finger tendon stress is the primary injury vector, power route training produces significant forearm metabolic stress from PE intervals. Back-to-back high-intensity PE sessions without adequate forearm recovery leads to performance decline and potential overuse. Tracking forearm recovery status is a route-power-specific safety signal.

### Why do 2-day plans use more conservative progression?
With only 2 sessions per week, each session must serve multiple purposes (strength + PE + routes). This creates a more condensed stress/recovery cycle. Progression thresholds are raised (3 consecutive clean sessions for max hang progression instead of 2) to account for slower adaptation rates and the higher stakes of each session — missing one session is a 50% frequency loss.
