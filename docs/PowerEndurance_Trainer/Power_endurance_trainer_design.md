# Power-Endurance Training Module — Design Document
## Part of Training Center (One of Four 12-Week Training Programs)

---

## 1. Module Overview

The **Power-Endurance Training Module** is the fourth goal-based training program in the Training Center. When users select "Route Power/Endurance" on `/training-center`, they start a 12-week training cycle targeting routes with sustained climbing demands and late crux sequences — routes where you climb at moderate intensity for several minutes, then must execute a hard crux when already fatigued.

This module provides a guided, step-by-step workout experience that automatically calculates load metrics, tracks the primary KPI (crux-after-fatigue success rate), monitors recovery and injury signals, flags overtraining risks, and surfaces targeted education at every mesocycle transition.

### Core Value Props
- **Crux simulation as primary metric**: Every session tracks crux success rate under fatigue — the only metric that directly reflects goal-route performance
- **Fluency and silent feet quantification**: Converts low-intensity ARC sessions into skill-development sessions with objective tracking (stop counts, slip counts)
- **Three energy system layers**: Aerobic base, anaerobic capacity (4×4 + intervals), and specific threshold training (intermittent hang endurance + critical-force blocks) — all tracked automatically
- **Guided redpoint progression**: Meso 3 route-linking sessions are structured as guided burn-by-burn experiences with fluency constraint toggling
- **Smart safety**: Higher injury risk than pure endurance or pure strength — weekly sRPE monitoring, shoulder symptom tracking, and >20% load-spike detection run after every session

### Integration with Existing System
- Uses existing **Firebase Auth** (`/src/lib/firebase/auth.tsx`) — no new auth system
- Uses existing **Firestore database** (`/src/lib/firebase/`)
- Extends the existing `users` collection with `powerEnduranceWorkouts`, `powerEnduranceAssessments` subcollections
- Uses existing **Next.js App Router** (`/training-center/` routing already in place)
- Uses existing **Tailwind CSS v4** styling and all existing `training/` components

### Difference from Bouldering Module
The bouldering module is oriented around max strength development (hangboard loads, campus reach, boulder sends). The power-endurance module adds an entire new training layer: sustained aerobic climbing with technique constraints, anaerobic capacity blocks, and crux-specific simulation drills. The primary outcome is not "max load on a hang" — it's **crux success rate when pre-fatigued**.

---

## 2. Information Architecture

### Page Structure (Shared with Bouldering Module)

The power-endurance module uses the same routing shell as bouldering. No new routes are needed at the App Router level. The differentiation happens inside components based on `goalType`.

```
/training-center                    → Hub: goal selection or active program dashboard
/training-center/onboarding         → Goal + frequency setup (existing, supports all 4 goals)
/training-center/dashboard          → Active program dashboard (adapted for PE metrics)
/training-center/workout/[sessionId] → Active workout flow (step-by-step, new PE drill types)
/training-center/assessment         → Baseline / retest (Week 0, 4, 8, 12)
/training-center/history            → Past workout logs
/training-center/history/[workoutId] → Individual workout detail
/training-center/progress           → Charts + progress comparison (PE-specific charts)
/training-center/education          → Education library
/training-center/education/[slug]   → Individual education piece
```

### User Flow (Power-Endurance)

```
[User already authenticated]
  → Visits /training-center → selects "Route Power/Endurance"
  → Training onboarding: age / weight / experience / frequency (2/3/4 day)
  → Week 0 Assessment (guided):
      Max Hang → Intermittent Endurance → Crux-After-Fatigue Simulation → Injury Baseline
  → Dashboard: Week 1 schedule appears
  → Sessions follow mesocycle structure:
      Meso 1 (Wks 1-3): Aerobic Base + Max Force Foundation
      Week 4: Deload + Retest
      Meso 2 (Wks 5-7): Power-Endurance Build + Crux Simulations
      Week 8: Deload + Retest
      Meso 3 (Wks 9-11): Specific Linking + Redpoint Focus
      Week 12: Taper + Performance
  → Education modal at each mesocycle transition
  → Week 12: Final assessment + progress report
  → Returns to /training-center to select new goal
```

---

## 3. Data Model (Firebase Firestore)

### Integration with Existing Collections

Extends the same `users/{userId}` document. The existing fields (`trainingProfile`, `activeProgram`, `programHistory`, `dailyCheckins`) are shared across all training modules. Power-endurance adds two new subcollections.

```
users/
  {userId}/
    // Existing shared fields (unchanged)
    trainingProfile: {
      age, weight, weightUnit, experienceLevel, currentLimitGrade, currentRouteGrade, goalRouteGrade,
      // --- Profile Score System (CruxTracker) — PE foundation layer ---
      profileScore: { c1ClimbingAge, c2AgeRecovery, c3TrainingStructure, rawScore, injuryCeiling, finalScore, tier, tierLabel, ... },
      progressionParams: { loadIncrementPct, sessionsToConfirm, minWeeksPerStep, holdThresholdRPE, regressionThresholdRPE, volumeIncrementPct, restReductionSec, deloadVolumeReductionPct, deloadIntensityReductionPct, symptomDeloadTrigger, minRestDaysBetweenFingerSessions, weeklySRPECeiling, startingIntensityFloorPct, startingIntensityCeilingPct, ... },
      performanceAxis: { maxHangPctBW, fssBand, fssPercentile, enduranceReps, esBand, repeaterStartSets, cafBaseline, cafsBand, initialELS, initialCruxGrade },
      startingState: { startingIntensityPct, repeaterStartSets, initialELS, initialCruxGrade },
      ...
    }
    activeProgram: {
      goalType: "route_power_endurance"   // NEW value
      frequency: 2 | 3 | 4
      startDate: Timestamp
      currentWeek: number             // 1-12
      currentMesocycle: 1 | 2 | 3
      status: "assessment" | "active" | "deload" | "complete"
    }
    programHistory/ { ... }           // Shared (unchanged)
    dailyCheckins/ { ... }            // Shared (unchanged)
    boulderingAssessments/ { ... }    // Bouldering module only
    boulderingWorkouts/ { ... }       // Bouldering module only

    // --- POWER-ENDURANCE: ASSESSMENTS (Week 0, 4, 8, 12) ---
    powerEnduranceAssessments/
      {assessmentId}/
        programId: string
        week: number                  // 0, 4, 8, 12
        date: Timestamp

        fingerMaxStrength: {
          attempts: [{
            load: number              // total (BW ± added/removed)
            addedWeight: number
            heldFull7s: boolean
            notes: string
          }]
          bestLoad: number            // auto-calculated
          percentBodyweight: number   // auto-calculated
          edgeSize: number            // mm (typically 20-22)
          gripType: "half_crimp" | "open_hand" | "other"
        }

        intermittentEndurance: {
          workingLoad: number         // 60% of max hang (auto-calculated)
          protocol: "7on_3off" | "7on_2off" | "other"
          sets: [{
            repsCompleted: number
            stoppingReason: "force_drop" | "form_fail" | "pain" | "time_limit"
            forceQuality: number      // 1-10
          }]
          totalReps: number           // auto-sum
          totalTimeSeconds: number    // auto-calculated
        }

        cruxAfterFatigue: {
          attempts: [{
            // Entry (lead-in) inputs
            entryMoves: number              // user input: number of entry moves
            entryGrade: string              // user input: "5.9", "5.10b", etc.
            entryGradeMultiplier: number    // auto: lookup from grade table
            els: number                     // auto: entryMoves × entryGradeMultiplier

            // Crux inputs
            cruxDescription: string
            cruxGrade: string               // "V0"–"V6+" etc.
            cruxTotalMoves: number          // total moves in crux sequence
            cruxGradeMultiplier: number     // auto: V_grade + 1 (V0=1, V1=2, V2=3 ...)
            movesCompleted: number          // user input: moves completed before fall/top
            cds: number                     // auto: movesCompleted × cruxGradeMultiplier
            success: boolean                // auto: movesCompleted === cruxTotalMoves

            // Round score
            roundScore: number              // auto: els + cds

            // Context
            leadInCompleted: boolean
            pumpBeforeCrux: number          // 1-10
            executionQuality: number        // 1-5
            notes: string
          }]
          // Auto-calculated session totals
          sessionCAFScore: number           // auto: sum of all roundScores
          avgRoundScore: number             // auto
          successRate: number               // auto: successes / attempts %
          avgMovesCompleted: number         // auto
          avgPumpBeforeCrux: number         // auto
          limitingFactor: "forearm_pump" | "finger_strength" | "technique" | "mental" | "power"
        }

        optionalTests: {
          weightedPullup: {
            maxLoad: number
            reps: number
          } | null
          campusMaxReach: {
            highestRung: number
            movesIn10RM: number
          } | null
          routePowerEnduranceTest: {
            routeDescription: string
            timeToCompletion: number  // seconds
            fallsHangs: number
            pumpAtFinish: number      // 1-10
          } | null
        }

        injuryBaseline: {
          fingers: {
            [key: string]: {          // "r_index", "l_middle", etc.
              painAtRest: number      // 0-10
              painWithPressure: number
              stiffness: number
            }
          }
          elbowPain: { left: number, right: number }
          shoulderPain: { left: number, right: number }
          shoulderSymptomScore: number  // 0-10 composite (key PE-specific field)
          morningStiffness: number
          concerns: string
        }

    // --- POWER-ENDURANCE: WORKOUTS ---
    powerEnduranceWorkouts/
      {workoutId}/
        programId: string
        date: Timestamp
        week: number
        mesocycle: 1 | 2 | 3
        sessionLabel: string          // "A", "B", "C", "D" (4-day) or "A", "B", "C" (3-day)
        sessionType: string           // "max_hangs_aerobic", "4x4_crux_simulation", etc.
        status: "in_progress" | "completed" | "skipped"
        duration: number              // minutes (auto from start/end)
        startedAt: Timestamp
        completedAt: Timestamp | null
        rpe: number                   // 0-10
        srpe: number                  // auto: duration × RPE
        sessionQuality: number        // 1-5

        drills: [{
          drillId: string
          drillType: DrillType        // see type list below
          order: number
          completed: boolean
          data: object                // shape varies by drill type
          completedAt: Timestamp
        }]

        // PE-specific post-session fields
        cruxSuccessRateThisSession: number | null   // if CAF drill present
        fluencyStopCount: number | null              // if ARC drill present
        silentFootSlipCount: number | null           // if ARC drill present
        shoulderSymptomScore: number                 // 0-10 (tracked every session)
        fingerPainDuring: number                     // 0-10
        skinCondition: "good" | "fair" | "poor"
        notes: string
```

### Profile Score System integration (foundation layer)

The CruxTracker Profile Score System (`docs/CruxTracker_Profile_Score_System.md`) is integrated into the PE module as a **foundation layer**:

- **Onboarding** captures climbing age (C1), structured-training history (C3), and finger-injury history; C2 is derived from the existing `age`. `calcProfileScore` produces the tier and the `progressionParams` are stored once on `trainingProfile`.
- **Week 0 assessment** derives the `performanceAxis` (FSS / ES / CAFS bands) and resolves the `startingState` (starting intensity bounded by the tier range, repeater start sets, initial ELS) — stored on `trainingProfile`.
- **Drill targets** are tier-aware (display): starting intensity, percentage load increment, volume increment, and rest-reduction steps are read from `startingState` + `progressionParams` (see `src/lib/plans/power-endurance/profileScore.ts` and `drills.ts`). A read-only tier reference card surfaces the parameters on the dashboard.

**Scheduled for Phase 7 — Profile Score Autoregulation Engine (see §14):**

- The Section 5.4 runtime autoregulation engine: per-session confirmation counters, hold-threshold/regression gates, increment proposal+confirm flow, and weekly sRPE-ceiling enforcement.
- The Section 5.2 mid-program tier downgrade and Section 5.3 score-recalculation triggers.
- Applying tiers to the bouldering module (PE-only through Phase 7).

### Drill Data Shapes — Power-Endurance Specific

The following are **new** drill types. All existing bouldering drill shapes (`MaxHangData`, `PullUpData`, `CampusDrill`, `AntagonistData`, `MobilityData`, `CoreData`) are **reused unchanged**.

```typescript
// ARC / Continuous Climbing Drill (Workouts B in 4-day; Workout A in 3-day Meso 1)
type ARCClimbingData = {
  sets: [{
    durationMinutes: number
    terrainStyle: string              // "traversing", "circuits", "up-down"
    targetRPE: number                 // 4-6
    actualRPE: number
    pumpLevel: number                 // 1-10 (should stay 3-5)
    breathing: "easy" | "moderate" | "hard"
    silentFootSlips: number           // per set — key tracking metric
    fluencyStops: number              // stops >2 seconds — key tracking metric
    fluencyStopLocations: string      // notes on where stops occurred
    restAfterMinutes: number
  }]
  constraintsActive: {
    silentFeet: boolean
    fluency: boolean
  }
  totalClimbingMinutes: number        // auto
  sessionSilentFootSlipsTotal: number // auto-sum
  sessionFluencyStopsTotal: number    // auto-sum
  movementQuality: "smooth_relaxed" | "good" | "ok" | "tense_inefficient"
  targetIntensityMet: boolean         // RPE stayed 4-6
}

// Bouldering 4×4 Drill (Workout C Meso 1 in 4-day; Workout B Meso 1 in 3-day/2-day)
type FourByFourData = {
  problems: [{
    description: string
    grade: string
    gradesbelowLimit: number          // should be 2-4
  }]
  rounds: [{
    problemFalls: [number, number, number, number]  // falls per problem in the round
    totalFalls: number                // auto-sum
    recoveryFeel: number              // 1-5 (between rounds)
    restAfterMinutes: number
  }]
  roundsCompleted: number             // auto
  totalFalls: number                  // auto
  lateRoundQuality: "maintained_form" | "slight_degradation" | "significant_degradation" | "broke_down"
  problemSelectionFeedback: "too_easy" | "good" | "too_hard"
  pumpByRound: number[]               // RPE/10 at end of each round
  progressionDecision: "increase_rounds" | "increase_difficulty" | "maintain" | "reduce"
}

// Route-Style Intervals Drill (Workout C Meso 1 in 4-day; threshold work Meso 3)
type IntervalsData = {
  sets: [{
    intervals: [{
      workTimeSeconds: number
      terrainRoute: string
      intensityRPE: number            // should be 8-9
      pumpLevel: number               // 1-10
      completed: boolean
      restAfterSeconds: number
      notes: string
    }]
    restBetweenSetsMinutes: number
  }]
  totalIntervalsAttempted: number     // auto
  totalIntervalsCompleted: number     // auto
  completionRate: number              // auto %
  pacingAssessment: "started_too_hard" | "good_pacing" | "started_conservative_finished_strong" | "other"
  recoveryBetweenIntervals: "adequate" | "borderline" | "insufficient" | "too_much"
  powerMaintenance: "explosive_throughout" | "good_early_slight_decline" | "moderate_decline" | "significant_dropoff"
  progressionDecision: "add_interval" | "increase_duration" | "reduce_rest" | "increase_difficulty" | "maintain" | "reduce"
}

// Intermittent Hang Endurance (IHE) at 60% MVC (Workout C Meso 2, alternating weeks)
type IntermittentHangData = {
  maxHangReference: number            // from most recent assessment (auto-filled)
  workingLoad: number                 // 60% of max (auto-calculated: maxHang × 0.60)
  protocol: "7on_3off" | "7on_2off"
  sets: [{
    targetLoad: number
    actualLoad: number
    repsCompleted: number
    stoppingReason: "target_reached" | "force_drop" | "form_fail" | "pain"
    forceQuality: number              // 1-10
    restAfterMinutes: number
  }]
  totalReps: number                   // auto-sum
  totalTimeUnderTensionSeconds: number // auto: reps × 7s
  avgRepsPerSet: number               // auto
  forceConsistency: "maintained" | "slight_drop" | "moderate_drop" | "significant_drop"
  trendVsLastSession: {
    lastTotal: number
    change: number                    // percentage
  } | null
}

// Critical-Force Blocks (CFB) — Workout C Meso 2, alternating with IHE on Week 6
type CriticalForceData = {
  maxHangReference: number            // auto-filled from latest assessment
  edgeSize: number
  gripType: "half_crimp" | "open_hand"
  targetIntensityDescription: string  // "slightly below all-out test intensity, RPE 8-9"
  rhythm: string                      // "7s on / 3s off"
  blocks: [{
    targetLoad: number
    actualLoad: number
    repsCompleted: number
    finalFormMaintained: boolean
    forceStableLate: boolean
    rpeDuringBlock: number
    restAfterMinutes: number
    notes: string
  }]
  totalBlocksCompleted: number        // auto
  totalReps: number                   // auto
  totalTimeUnderTensionSeconds: number // auto
  intensityCalibration: "correct" | "too_easy" | "too_hard" | "inconsistent"
  forceConsistencyBlockToBlock: "very_consistent" | "slight_decline" | "significant_decline" | "major_drop"
  comparedToIHE: "harder" | "similar" | "easier" | "different"
  progressionDecision: "increase_load" | "maintain" | "reduce_load" | "reduce_to_2_blocks"
}

// Crux-After-Fatigue Drill (CAF) — THE PRIMARY METRIC across all plans/mesocycles
//
// Scoring system:
//   ELS (Entry Load Score)  = entryMoves × entryGradeMultiplier
//   CDS (Crux Demand Score) = movesCompleted × cruxGradeMultiplier
//   Round Score             = ELS + CDS
//   Session CAF Score       = sum of all round scores (5 rounds standard)
//
// Entry grade multipliers (linear, +0.1 per sub-grade from 5.9 base):
//   5.8=0.9, 5.9=1.0, 5.10a=1.1, 5.10b=1.2, 5.10c=1.3, 5.10d=1.4,
//   5.11a=1.5, 5.11b=1.6, 5.11c=1.7, 5.11d=1.8, 5.12a=1.9, 5.12b=2.0 ...
//
// Crux grade multipliers (V_grade + 1):
//   V0=1, V1=2, V2=3, V3=4, V4=5, V5=6, V6=7 ...

type CruxAfterFatigueData = {
  rounds: [{
    // Entry (lead-in) — user inputs
    entryMoves: number              // number of moves in the entry section
    entryGrade: string              // route grade: "5.9", "5.10b", "5.11a", etc.
    entryGradeMultiplier: number    // auto: lookup from entry grade table
    els: number                     // auto: entryMoves × entryGradeMultiplier

    // Crux — user inputs
    cruxDescription: string         // e.g. "Red V3 on the 45-degree wall, 8 moves"
    cruxGrade: string               // "V0"–"V6+" etc.
    cruxTotalMoves: number          // total moves in crux sequence
    cruxGradeMultiplier: number     // auto: V_grade + 1
    movesCompleted: number          // moves completed before fall/top
    cds: number                     // auto: movesCompleted × cruxGradeMultiplier
    success: boolean                // auto: movesCompleted === cruxTotalMoves

    // Round score
    roundScore: number              // auto: els + cds

    // Context
    leadInCompleted: boolean
    leadInRPE: number
    pumpBeforeCrux: number          // 1-10 — key readiness indicator
    executionQuality: number        // 1-5
    restAfterMinutes: number
    mentalState: "focused" | "distracted" | "anxious" | "confident"
    notes: string
  }]

  // Auto-calculated session totals
  totalRounds: number
  sessionCAFScore: number           // sum of all roundScores — primary tracking number
  avgRoundScore: number             // auto
  successRate: number               // % (sent / rounds)
  avgMovesCompleted: number
  avgPumpBeforeCrux: number
  avgExecutionQuality: number       // 1-5
  trendVsLastSession: {
    lastSessionCAFScore: number
    lastSuccessRate: number
    scoreTrend: "improving" | "stable" | "declining"
  } | null

  // Detailed analysis
  leadInPacing: "too_fast" | "good" | "too_slow" | "inconsistent"
  shakeRestManagement: "excellent" | "good" | "fair" | "poor"
  limitingFactor: "forearm_pump" | "finger_strength" | "power_explosiveness" | "technical_execution" | "mental_focus" | "pacing_errors"
}

// Route Practice / Redpoint Burns (Workout D Meso 3 in 4-day; Workout A Meso 3 in 3-day/2-day)
type RoutePracticeData = {
  sessionFocus: "learning_beta" | "linking_sections" | "redpoint_attempts" | "fluency_rehearsal"
  fluencyConstraintActive: boolean    // toggled off on genuine send attempts
  routes: [{
    routeName: string
    grade: string
    lengthMinutes: number
    style: "power_endurance" | "endurance" | "technical"
    result: "send" | "fall" | "hang"
    attempts: number
    highPoint: string
    falls: number
    pumpAtCrux: number               // 1-10
    fluencyStopCount: number         // stops >2s on rehearsal burns
    energyAtCrux: number             // 1-10
    keyObservations: string
    betaChanges: string
  }]
  projectTracking: {
    projectName: string
    totalAttemptsToDate: number
    whereFailingConsistently: "early_section" | "middle" | "late_crux" | "after_crux" | "inconsistent"
    currentBottleneck: "finger_strength" | "power_endurance" | "pacing" | "rest_position_inefficiency" | "technical" | "mental_tactical" | "beta_not_dialed"
  } | null
}
```

---

## 4. Plan Engine — How the Module Knows What Workout to Show

### Plan Definition Structure

Store as static TypeScript files in `/src/lib/plans/power-endurance/`. Same structure as bouldering plans — configuration, not Firestore data.

```typescript
// /src/lib/plans/power-endurance/types.ts
// Reuses PlanDefinition, WeekDefinition, SessionDefinition, DrillDefinition
// from the bouldering types.ts (or extract to /src/lib/plans/shared/types.ts)

// PE-specific drill types extend the existing DrillType union:
type PEDrillType =
  | "warmup"
  | "max_hang"             // reused from bouldering
  | "pull_up"              // reused
  | "campus"               // reused (Meso 2 power work)
  | "antagonist"           // reused
  | "core"                 // reused
  | "mobility"             // reused
  | "arc_climbing"         // NEW: ARC/continuous with constraints
  | "four_by_four"         // NEW: bouldering 4×4
  | "intervals"            // NEW: route-style intervals
  | "intermittent_hang"    // NEW: IHE at 60% MVC
  | "critical_force"       // NEW: CFB blocks
  | "crux_after_fatigue"   // NEW: primary drill
  | "route_practice"       // NEW: Meso 3 burns
  | "threshold_intervals"  // NEW: Meso 3 sustained hard climbing
```

### Plan Files

```
/src/lib/plans/power-endurance/
  types.ts              PE-specific type extensions
  2day.ts               2-day plan (Sessions A + B, rest-day antagonist)
  3day.ts               3-day plan (Workouts A/B/C)
  4day.ts               4-day plan (Workouts A/B/C/D)
  drills.ts             PE drill definition catalog
  planEngine.ts         User state → next PE workout (reuses bouldering planEngine shape)
  calculations.ts       Target loads, 60% MVC calculation, fluency/stop trend logic
  educationTriggers.ts  Mesocycle/deload triggers → education slugs
```

### Example: 4-Day Plan, Mesocycle 1, Week 1, Sessions

```json
{
  "sessionA": {
    "label": "A",
    "suggestedDay": "Monday",
    "title": "Max Hangs + Pulling + Antagonist",
    "intent": "Highest intensity of the week — come in completely fresh",
    "estimatedDuration": 75,
    "drills": [
      { "id": "warmup_progressive", "type": "warmup", "name": "Progressive Warm-Up", ... },
      { "id": "max_hang_85pct", "type": "max_hang", "name": "Max Hangs", "sets": 6, "intensity": "85%", "reps": "10 seconds", "restSeconds": 120 },
      { "id": "pull_up_heavy", "type": "pull_up", "name": "Heavy Pulling", "sets": 4, "reps": "3-5", "restSeconds": 180 },
      { "id": "antagonist_circuit", "type": "antagonist", "name": "Antagonist + Shoulder Stability", "rounds": 2 }
    ]
  },
  "sessionB": {
    "label": "B",
    "suggestedDay": "Tuesday",
    "title": "ARC Aerobic Base + Silent Feet + Fluency",
    "intent": "Lowest intensity of the week — must feel like recovery",
    "estimatedDuration": 65,
    "drills": [
      { "id": "warmup_easy", "type": "warmup", ... },
      {
        "id": "arc_silent_fluency",
        "type": "arc_climbing",
        "name": "ARC with Silent Feet + Fluency Constraints",
        "sets": 2,
        "setDurationMinutes": 15,
        "restBetweenSetsMinutes": 7,
        "targetRPE": "4-6",
        "instructions": [
          "Silent feet rule: every foot placement must be silent and one-and-done (no scraping)",
          "Fluency rule: do not stop moving for more than 2 seconds unless at a designated rest hold",
          "Log stop count and location every set"
        ],
        "safetyWarnings": ["This must stay RPE 4-6. If you're getting pumped, you're going too hard."]
      }
    ]
  },
  "sessionC": {
    "label": "C",
    "suggestedDay": "Thursday",
    "title": "Bouldering 4×4 + Route Intervals",
    "intent": "Anaerobic capacity + repeatability under incomplete rest",
    "estimatedDuration": 80,
    "drills": [
      { "id": "warmup_progressive", "type": "warmup", ... },
      {
        "id": "four_by_four",
        "type": "four_by_four",
        "name": "Bouldering 4×4",
        "rounds": 2,
        "problemsPerRound": 4,
        "targetGradesbelowLimit": "2-4",
        "restBetweenRoundsMinutes": 11,
        "progressionRules": ["Add a round before raising problem difficulty", "Only raise difficulty after 3 clean rounds for 2 sessions"]
      },
      {
        "id": "route_intervals",
        "type": "intervals",
        "name": "Route-Style Intervals",
        "sets": 1,
        "intervalsPerSet": 4,
        "workTimeSeconds": 60,
        "restRatio": "1:1",
        "targetRPE": "8-9",
        "restBetweenSetsMinutes": 10
      },
      { "id": "core_circuit", "type": "core", "name": "Core Conditioning", ... }
    ]
  },
  "sessionD": {
    "label": "D",
    "suggestedDay": "Saturday",
    "title": "Crux-After-Fatigue Specificity",
    "intent": "Your most specific session — 2 rest days beforehand for full quality",
    "estimatedDuration": 85,
    "drills": [
      { "id": "warmup_with_silent_feet", "type": "warmup", ... },
      {
        "id": "crux_after_fatigue",
        "type": "crux_after_fatigue",
        "name": "Crux-After-Fatigue Drill",
        "rounds": 5,
        "leadInDurationMinutes": 2,
        "cruxMoves": "6-12",
        "restBetweenRoundsMinutes": 11,
        "instructions": [
          "Part A: 2 minutes continuous moderate climbing — do not fall, stay controlled",
          "Part B immediately: attempt the crux sequence (6-12 moves) at RPE 9",
          "Log pump level before crux, moves completed, success/fail, execution quality"
        ],
        "safetyWarnings": ["This is your primary KPI — log every round honestly, including failures"],
        "progressionRules": [
          "Increase lead-in duration first (2 → 2.5 → 3 min)",
          "Then increase round count (4 → 5 → 6)",
          "Only increase crux difficulty when success rate >60%"
        ]
      }
    ]
  }
}
```

### How Intensity Auto-Calculates (PE-Specific)

```typescript
// /src/lib/plans/power-endurance/calculations.ts

// Max hang target (reused from bouldering)
function getTargetLoad(userId: string, percentage: number): number {
  const latest = getLatestPEAssessment(userId)
  return Math.round(latest.fingerMaxStrength.bestLoad * percentage)
}

// IHE working load — always 60% of current max hang
function getIHEWorkingLoad(userId: string): number {
  const latest = getLatestPEAssessment(userId)
  return Math.round(latest.fingerMaxStrength.bestLoad * 0.60)
}

// --- CAF Scoring Tables ---

// Entry grade multipliers: linear +0.1 per sub-grade, anchored at 5.9 = 1.0
const ENTRY_GRADE_MULTIPLIERS: Record<string, number> = {
  "5.6":   0.7,
  "5.7":   0.8,
  "5.8":   0.9,
  "5.9":   1.0,
  "5.10a": 1.1,
  "5.10b": 1.2,
  "5.10c": 1.3,
  "5.10d": 1.4,
  "5.11a": 1.5,
  "5.11b": 1.6,
  "5.11c": 1.7,
  "5.11d": 1.8,
  "5.12a": 1.9,
  "5.12b": 2.0,
  "5.12c": 2.1,
  "5.12d": 2.2,
  "5.13a": 2.3,
  "5.13b": 2.4,
  "5.13c": 2.5,
  "5.13d": 2.6,
  "5.14a": 2.7,
}

// Crux grade multipliers: V_grade + 1
function getCruxGradeMultiplier(vGrade: string): number {
  const match = vGrade.match(/V(\d+)/)
  if (!match) return 1
  return parseInt(match[1]) + 1
}

// Per-round scoring
function calcRoundScore(round: {
  entryMoves: number
  entryGrade: string
  movesCompleted: number
  cruxGrade: string
}): { els: number; cds: number; roundScore: number } {
  const els = round.entryMoves * (ENTRY_GRADE_MULTIPLIERS[round.entryGrade] ?? 1.0)
  const cds = round.movesCompleted * getCruxGradeMultiplier(round.cruxGrade)
  return { els, cds, roundScore: els + cds }
}

// Session CAF Score — primary tracking number
function calcSessionCAFScore(rounds: ReturnType<typeof calcRoundScore>[]): number {
  return rounds.reduce((sum, r) => sum + r.roundScore, 0)
}

// Crux session score trend — the primary progress indicator
function getCruxSessionScoreTrend(userId: string, lastN: number = 3): CruxTrend {
  const recentCAF = getRecentCruxSessions(userId, lastN)
  const scores = recentCAF.map(s => s.data.sessionCAFScore)
  const rates = recentCAF.map(s => s.data.successRate)
  return {
    scores,
    rates,
    trend: isIncreasingTrend(scores) ? "improving" : isDecreasingTrend(scores) ? "declining" : "stable",
    latestScore: scores[scores.length - 1],
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
  }
}

// Fluency stop trend — technique improvement indicator
function getFluencyStopTrend(userId: string): FluencyTrend {
  const recentARC = getRecentARCSessions(userId, 6)
  return {
    stopsPerSet: recentARC.map(s => s.data.sessionFluencyStopsTotal / s.data.sets.length),
    trend: isDecreasingTrend(...) ? "improving" : "not_improving" // lower = better
  }
}
```

---

## 5. Education System — Milestone Content

### When Education Triggers (PE-Specific)

| Trigger Point | Slug | Title |
|---|---|---|
| Before Week 0 assessment | `pe-intro-why-test` | "Why We Test Before Power-Endurance Training" |
| Start of Week 1 | `pe-meso1-aerobic-foundation` | "Mesocycle 1: Why Aerobic Base Comes First" |
| Week 1 ARC session | `pe-silent-feet-fluency` | "Silent Feet + Fluency: Free Speed Through Movement Economy" |
| Week 4 deload | `pe-why-deload` | "Why Deload Weeks Are Mandatory in Power-Endurance Training" |
| Start of Week 5 | `pe-meso2-threshold-work` | "Mesocycle 2: Building the Threshold + Crux Simulation" |
| Week 6 critical-force | `pe-critical-force-explained` | "Critical-Force Blocks: Your Intensity Anchor" |
| Week 8 deload | `pe-mid-program-check` | "Halfway: Reading Your Crux-Success and Fluency Data" |
| Start of Week 9 | `pe-meso3-redpoint-focus` | "Mesocycle 3: Translating Training to Route Sends" |
| Week 12 taper | `pe-taper-performance` | "Tapering for Power-Endurance: What to Do (and Not Do)" |
| After Week 12 | `pe-program-complete` | "Reading Your 12-Week Arc: What the Data Means" |

### Example: "Silent Feet + Fluency: Free Speed Through Movement Economy"

Shown the first time the user begins an ARC session.

1. **What silent feet actually does** — "Every foot scrape is wasted energy and time. On a route you'll be doing 60-100 foot placements. Silent feet reduces the micro-corrections that bleed your energy before the crux."
2. **What fluency does** — "Every stop >2 seconds is a pump spike. On a route, stopping to think costs you more than just the time — it's a partial pump ratchet you can't fully recover from mid-route. Fluency training builds the movement reading that keeps you moving."
3. **Why we track the numbers** — "We count slips and stops because without a number, 'pretty good feet today' means nothing across 12 weeks. You'll see this trend on your progress page."
4. **What to expect this week** — "High stop counts early are normal — this is a new constraint. Aim to reduce week-over-week, not to be perfect immediately."

### Example: "Why Deload Weeks Are Mandatory in Power-Endurance Training"

1. **The PE injury risk equation** — "PE training combines high finger loads, high metabolic stress, high neural demand, and (in 4-day plans) high weekly volume simultaneously. The cumulative fatigue is higher than pure endurance or pure strength blocks."
2. **What your sRPE data says** — Show the user's weekly sRPE chart for the past 3 weeks — "You've accumulated [X] total load units. This is by design. Now your body needs to consolidate it."
3. **The shoulder trap** — "Shoulder symptom scores that have been creeping up often normalize during deload. If your score was rising, watch it this week."
4. **Retest as data** — "Your Week 4 intermittent endurance and crux-after-fatigue tests are not 'just tests.' They set your Meso 2 working loads and tell you whether the aerobic work is transferring."

### Delivery UX

Same as bouldering module:
1. **Modal on dashboard** when user first opens the app on the trigger week (dismissible, "Read later" available)
2. **Card in education library** (always accessible at `/training-center/education`)
3. **Contextual tips** embedded in drill instructions during workout flow

---

## 6. Dashboard Design

The PE dashboard uses the same layout shell as the bouldering dashboard but surfaces PE-specific metrics.

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Week 6 of 12 · Mesocycle 2: Build Phase   │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░  50% complete              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  TODAY'S WORKOUT                             │   │
│  │  Workout C: IHE + Light Bouldering          │   │
│  │  ~70 min · RPE target: 8-9 (IHE)           │   │
│  │                                              │   │
│  │  [ START WORKOUT → ]                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── MORNING CHECK-IN ────┐                       │
│  │ Fingers · Energy · Sleep │  (shows if not done)  │
│  └──────────────────────────┘                       │
│                                                     │
│  ┌──── KEY METRICS ─────────────────────────────┐   │
│  │                                               │   │
│  │  Crux Success Rate  IHE Reps  Max Hang       │   │
│  │  67% (+14%)         38 (+6)   168 lb (+4%)   │   │
│  │  ▁▂▄▅▆▇             ▁▂▄▆▇     ▁▂▃▄▅          │   │
│  │  (sparklines — test weeks / CAF sessions)     │   │
│  │                                               │   │
│  │  Fluency Stops      Silent Foot Slips        │   │
│  │  8/set (↓ from 14)  3/session (↓ from 9)    │   │
│  │  ▇▆▅▄▃▂             ▇▆▅▄▃ (lower = better)  │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── THIS WEEK ───────────────────────────────┐   │
│  │  Mon: Workout A ✓ (sRPE: 720)               │   │
│  │  Tue: Workout B ✓ (sRPE: 260)               │   │
│  │  Wed: REST                                    │   │
│  │  Thu: Workout C ← TODAY                       │   │
│  │  Fri: REST                                    │   │
│  │  Sat: Workout D (upcoming)                    │   │
│  │                                               │   │
│  │  Weekly sRPE: 980 / ~1,200 target            │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── SAFETY MONITOR ──────────────────────────┐   │
│  │  ● Finger pain: 1/10 (OK)                   │   │
│  │  ● Shoulder score: 2/10 (OK)                │   │
│  │  ● Load trend: +8% vs last week (OK)        │   │
│  │  ● Recovery: 4/5 avg (Good)                 │   │
│  │                                               │   │
│  │  ✓ No flags this week                        │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── CRUX SUCCESS TREND ──────────────────────┐   │
│  │  Last 5 CAF sessions:                        │   │
│  │  33% → 40% → 50% → 60% → 67%  ↑ Improving  │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Key Difference from Bouldering Dashboard:**
- Primary metric display: **Crux Success Rate** (not max hang as headline)
- Fluency stops and silent foot slips shown as downward-trend sparklines
- **Shoulder symptom score** in safety monitor (PE-specific injury signal)
- **Crux success trend** mini-chart always visible (not buried in progress page)

---

## 7. Active Workout Flow — PE-Specific Drill UX

The workout flow shell (`WorkoutFlow.tsx`, `WorkoutProvider.tsx`, `DrillCard.tsx`) is **reused unchanged** from the bouldering module. Only the drill-specific logger components differ.

### Drill Logger Screen Designs

#### ARC Climbing Logger (`ARCClimbingLogger.tsx` — NEW)

```
┌─────────────────────────────────────────────────────┐
│  ARC Climbing — Set 1 of 2                         │
│  Target: 15 min · RPE 4-6 · Silent feet + Fluency  │
│                                                     │
│  [ ⏱ 08:32 / 15:00 ]  ██████████░░░░░░░           │
│                                                     │
│  ┌──── CONSTRAINTS ACTIVE ────────────────────┐    │
│  │  👣 Silent feet — tap each slip:            │    │
│  │  [ + Slip ]  Total slips this set: 2       │    │
│  │                                              │    │
│  │  🔄 Fluency — tap each stop >2s:            │    │
│  │  [ + Stop ]  Total stops: 5                 │    │
│  │  Where? [ Add location note ]               │    │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Current pump: [ 1 ][ 2 ][3][ 4 ][ 5 ]            │
│                   ↑ Should stay 3-5                 │
│                                                     │
│  ⚠️  Pump 6-7+? You're going too hard for ARC.      │
│      Back off — this session's value depends        │
│      on staying at RPE 4-6.                        │
│                                                     │
│  [ Done with Set — Log Set 1 ]                      │
└─────────────────────────────────────────────────────┘
```

#### Bouldering 4×4 Logger (`FourByFourLogger.tsx` — NEW)

```
┌─────────────────────────────────────────────────────┐
│  Bouldering 4×4 — Round 1 of 2                     │
│                                                     │
│  Problems this round:                               │
│  P1: [Green V3 overhang] P2: [Blue V4 slab]        │
│  P3: [Pink V3 traverse]  P4: [Yellow V4 steep]      │
│                                                     │
│  Falls per problem:                                  │
│  P1: [0][1][2][3+]   P2: [0][1][2][3+]             │
│  P3: [0][1][2][3+]   P4: [0][1][2][3+]             │
│                                                     │
│  Total falls this round: 2                          │
│                                                     │
│  [ Rest 10-12 min → Rest Timer ]                    │
│                                                     │
│  Recovery feel: [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]          │
│  (1=Desperate 3=Manageable-pumped 5=Easy)           │
│                                                     │
│  [ Start Round 2 ]  or  [ Done with 4×4 ]          │
└─────────────────────────────────────────────────────┘
```

#### Crux-After-Fatigue Logger (`CruxAfterFatigueLogger.tsx` — NEW, PRIMARY)

```
┌─────────────────────────────────────────────────────┐
│  Crux-After-Fatigue — Round 2 of 5                 │
│                                                     │
│  ── PART A: ENTRY ─────────────────────────────    │
│  Entry grade: [ 5.9 ▾ ]   Entry moves: [ 20 ]     │
│  ELS: 20 × 1.0 = 20.0  (auto)                      │
│                                                     │
│  [ ⏱ 00:00 ]  [ Start Entry ]  → auto-timer runs  │
│  Lead-in completed? [ ✓ Yes ]  [ ✗ No ]            │
│                                                     │
│  ── PART B: CRUX (immediately after entry) ────    │
│  Crux grade: [ V2 ▾ ]   Total moves: [ 8 ]        │
│  Description: [ Red V2, 8 moves, 45° wall ]        │
│                                                     │
│  Pump before crux: [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][ 10 ]
│                                                     │
│  Moves completed: [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
│  CDS: 5 × 3.0 = 15.0  (auto)                       │
│                                                     │
│  ── ROUND SCORE ───────────────────────────────    │
│  ELS 20.0 + CDS 15.0 = 35.0  ✓ logged             │
│                                                     │
│  Execution quality: [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]     │
│  Mental state: [ Focused ][ Distracted ][ Anxious ][ Confident ]
│                                                     │
│  [ Rest 10-12 min → Timer ]                         │
│                                                     │
│  Session so far:                                    │
│  R1: 38.0  R2: 35.0  R3: —  R4: —  R5: —          │
│  Running score: 73.0                                │
│                                                     │
│  [ Start Round 3 ]                                  │
└─────────────────────────────────────────────────────┘
```

#### Critical-Force Blocks Logger (`CriticalForceLogger.tsx` — NEW)

```
┌─────────────────────────────────────────────────────┐
│  Critical-Force Blocks — Block 1 of 3              │
│                                                     │
│  Working load: 101 lb (60% of 168 lb max)          │
│  Rhythm: 7s on / 3s off                            │
│  Target intensity: RPE 8-9, stable — not maximal   │
│                                                     │
│  [ Rep 1: 7s ] ██████████ Done → [ 3s off ]        │
│  [ Rep 2: 7s ] ████░░░░░░                          │
│                                                     │
│  Reps completed this block: 5                       │
│  Force quality: [ 1 ]...[ 10 ]                      │
│  Form maintained? [ Yes ] [ No ]                    │
│  Force stable late in block? [ Yes ] [ No ]         │
│                                                     │
│  [ End Block 1 → 6-8 min Rest ]                    │
│                                                     │
│  Intensity calibration:                             │
│  [ Correct ] [ Too easy ] [ Too hard ] [ Inconsistent ]
└─────────────────────────────────────────────────────┘
```

### Safety Interrupts (PE-Specific Additions)

In addition to the existing bouldering safety interrupts (pain > 2/10), PE adds:

- **ARC session pump spike**: If user logs pump ≥ 7 during ARC → warning: *"Pump 7+/10 is too high for aerobic work. This session's benefit depends on staying at RPE 4-6. Back off or the session doesn't serve its purpose."*
- **Shoulder symptom rising**: If shoulder score > last session + 2 → *"Shoulder score rising. Review antagonist circuit completeness this week. Consider reducing campus/power volume."*
- **CFB too hard**: If user selects "too hard" on intensity calibration → *"Reduce load 5-10% for the remaining blocks. Critical-force blocks should feel like RPE 8-9 sustainable, not maximal."*
- **4×4 failing round 1**: If falls in round 1 are ≥ 4 → *"High falls in round 1 suggest problems are too hard. Next session: drop 1 grade."*

---

## 8. Automatic Calculations & Smart Features

### Auto-Calculated Metrics

| Metric | Formula | Where Used |
|---|---|---|
| sRPE | `duration_minutes × RPE` | Every session → weekly totals |
| Weekly sRPE | Sum of all session sRPEs | Dashboard, load monitoring |
| Week-over-week sRPE change | `((this - last) / last) × 100` | Dashboard safety monitor |
| Max hang % BW | `(totalLoad / bodyweight) × 100` | Assessment comparisons |
| IHE working load | `latestMaxHang × 0.60` | Drill instructions (auto-filled) |
| Target max hang load | `latestMaxHang × targetPercent` | Workout A instructions |
| Entry grade multiplier | Lookup: 5.9=1.0, 5.10a=1.1, +0.1/sub-grade | CAF round scoring |
| Crux grade multiplier | `V_grade + 1` (V0=1, V1=2, V2=3 ...) | CAF round scoring |
| ELS (Entry Load Score) | `entryMoves × entryGradeMultiplier` | Per CAF round |
| CDS (Crux Demand Score) | `movesCompleted × cruxGradeMultiplier` | Per CAF round |
| Round Score | `ELS + CDS` | Per CAF round |
| Session CAF Score | `sum of all roundScores` | Primary CAF tracking number |
| Crux success rate | `(successes / totalRounds) × 100` | Secondary KPI dashboard |
| Avg moves completed | `sum(movesCompleted) / rounds` | CAF session summary |
| Fluency stops per set | `totalStops / sets` | ARC session tracking |
| Silent foot slips per session | Count logged during ARC | ARC session tracking |
| IHE total time under tension | `totalReps × 7` (seconds) | IHE session summary |
| Shoulder symptom trend | 3-session rolling average | Safety monitor |

### Safety Flag Rules (PE-Specific)

```typescript
const peSafetyRules: SafetyRule[] = [
  // Inherited from bouldering (reused)
  {
    id: "finger_pain_acute",
    severity: "red",
    condition: (d) => d.latestWorkout.fingerPainDuring >= 4,
    message: "Finger pain ≥4/10 during session",
    action: "Stop finger loading. If sharp/sudden, seek evaluation."
  },
  {
    id: "srpe_spike",
    severity: "yellow",
    condition: (d) => weekOverWeekChange(d) > 20,
    message: `Weekly load increased ${weekOverWeekChange(d)}% — exceeds 20-25% guideline`,
    action: "PE training carries elevated injury risk at this load increase. Reduce volume next week."
  },
  {
    id: "stiffness_trend",
    severity: "yellow",
    condition: (d) => isIncreasingTrend(d.checkins, "fingerStiffness", 3),
    message: "Finger stiffness rising 3+ consecutive days",
    action: "Insert extra rest day or reduce intensity"
  },
  // PE-specific rules
  {
    id: "shoulder_score_rising",
    severity: "yellow",
    condition: (d) => {
      const scores = getRecentShoulderScores(d, 3)
      return isIncreasingTrend(scores) && scores[scores.length - 1] >= 4
    },
    message: "Shoulder symptom score rising over last 3 sessions",
    action: "Increase antagonist circuit to 3 rounds. Review campus/power volume. If score reaches 6+, reduce power work."
  },
  {
    id: "crux_success_declining",
    severity: "yellow",
    condition: (d) => {
      const trend = getCruxSuccessRateTrend(d.userId, 3)
      return trend.trend === "declining" && trend.latest < 30
    },
    message: "Crux success rate declining over last 3 sessions and below 30%",
    action: "Check recovery quality. If sRPE is trending high, volume may be too great to absorb. Consider inserting an extra rest day."
  },
  {
    id: "arc_intensity_creeping",
    severity: "yellow",
    condition: (d) => {
      const recentARC = getRecentARCSessions(d.userId, 2)
      return recentARC.some(s => s.data.sets.some(set => set.actualRPE >= 7))
    },
    message: "ARC sessions trending above RPE 7",
    action: "Aerobic sessions must stay RPE 4-6. Turning them hard undermines the recovery and aerobic base functions they serve."
  },
  {
    id: "high_intensity_monotony",
    severity: "yellow",
    condition: (d) => {
      const weeklyRPEs = getWeekSessionRPEs(d)
      const avg = mean(weeklyRPEs)
      const sd = stdDev(weeklyRPEs)
      return (avg / sd) > 2.0 && avg > 7
    },
    message: "Training monotony high (Avg÷SD > 2.0) with elevated average RPE",
    action: "Add variation — ensure Workout B stays genuinely easy to create intensity contrast."
  }
]
```

### Progression Logic

```typescript
// Max hang progression (reused from bouldering, same logic)
function evaluateMaxHangProgression(recentSessions: MaxHangData[]): ProgressionSuggestion { ... }

// 4×4 progression
function evaluateFourByFourProgression(recentSessions: FourByFourData[]): ProgressionSuggestion {
  const lastTwo = recentSessions.slice(-2)
  const bothClean = lastTwo.every(s => s.roundsCompleted >= 3 && s.totalFalls < 4)
  if (bothClean && lastTwo[0].roundsCompleted < 3) {
    return { type: "increase_rounds", message: "3 clean rounds for 2 sessions → add 1 round." }
  }
  if (bothClean && lastTwo[0].roundsCompleted >= 3) {
    return { type: "increase_difficulty", message: "Good consistency. Consider raising problem grade by 1." }
  }
  return { type: "maintain", message: "Keep building consistency at current round count and grade." }
}

// CAF progression — only one variable changes per week
function evaluateCAFProgression(recentSessions: CruxAfterFatigueData[]): ProgressionSuggestion {
  const latest = recentSessions[recentSessions.length - 1]
  if (latest.successRate > 60 && latest.roundsCompleted < 6) {
    // Priority order: lead-in duration → rounds → crux difficulty
    return { type: "increase_lead_in", message: `Success rate ${latest.successRate}% — extend lead-in by 30 seconds next session.` }
  }
  if (latest.successRate < 30) {
    return { type: "maintain_or_reduce", message: "Success rate below 30%. Do not increase difficulty. Check recovery." }
  }
  return { type: "maintain", message: "Good progress. Maintain current protocol." }
}
```

---

## 9. Progress Visualization

### Charts to Build (Recharts — same library as bouldering)

**1. Crux-After-Fatigue Success Rate (Line Chart) — PRIMARY**
- X-axis: Session dates (all CAF sessions, not just test weeks)
- Y-axis: Success rate % (0-100)
- Annotations: mesocycle boundaries, deload weeks
- Color changes per mesocycle (harder crux = separate line segment)
- Sub-line: average moves completed (secondary axis)

**2. Max Hang Progression (Line Chart) — reused from bouldering**
- X-axis: Test weeks (0, 4, 8, 12)
- Y-axis: Added weight (lbs/kg)
- Secondary: % of bodyweight

**3. Intermittent Endurance Trend (Bar/Line Chart)**
- X-axis: Test weeks (0, 4, 8, 12) + individual IHE sessions in Meso 2
- Y-axis: Total reps
- Shows capacity growth through Meso 2

**4. Weekly sRPE Load (Bar Chart) — reused from bouldering with PE context**
- X-axis: Weeks 1-12
- Y-axis: Total weekly sRPE
- Color coded: Meso 1 (base), Meso 2 (build), Meso 3 (peak)
- Target: 1000-1400 sRPE/week for 4-day plan; proportionally lower for 2/3-day

**5. Fluency + Silent Feet Trend (Line Chart, inverted — lower is better)**
- X-axis: Weeks
- Y-axis: Stops per ARC set / slips per session
- Downward trend = improvement
- Annotations: personal bests (lowest stop count)

**6. Shoulder Symptom Score (Area Chart)**
- X-axis: Session dates
- Y-axis: Shoulder score (0-10)
- Shaded band: 0-3 = green, 4-5 = yellow, 6+ = red
- Early warning system for shoulder overuse

**7. Assessment Radar / Spider Chart (reused from bouldering)**
- Axes: Max Hang, Intermittent Endurance, Crux Success Rate, Pull-up Strength, Recovery Score
- Overlay: Week 0 vs Week 4 vs Week 8 vs Week 12

**8. Recovery Dashboard (Area Chart) — reused from bouldering**
- Daily finger stiffness, energy, sleep quality over time
- 7-day rolling averages
- Flag markers where safety rules triggered

---

## 10. Tech Stack & Project Structure

### Reuse Inventory — Existing Components

All components from the bouldering module are evaluated here for reuse.

#### Fully Reusable (Zero Changes)
| Component | Path | Notes |
|---|---|---|
| `WorkoutFlow.tsx` | `training/workout/` | Shell unchanged; PE drill components plug in |
| `WorkoutProvider.tsx` | `training/workout/` | State management unchanged |
| `DrillCard.tsx` | `training/workout/` | Renders any drill type |
| `RestTimer.tsx` | `training/workout/` | Between-set rest |
| `HangTimer.tsx` | `training/workout/` | 7s/10s hang countdown |
| `RepeaterTimer.tsx` | `training/workout/` | Repeater rhythm (7:3, 7:2) |
| `Timer.tsx` | `training/shared/` | General timer |
| `MaxHangLogger.tsx` | `training/workout/` | Used in Workout A (all mesocycles) |
| `AntagonistLogger.tsx` | `training/workout/` | Same circuit, permanent in all plans |
| `PullUpLogger.tsx` | `training/workout/` | Workout A Part 2 (Meso 1) |
| `CampusLogger.tsx` | `training/workout/` | Workout A Part 2 (Meso 2 power work) |
| `WarmupLogger.tsx` | `training/workout/` | All sessions |
| `CoreLogger.tsx` | `training/workout/` | Workout C core conditioning |
| `MobilityLogger.tsx` | `training/workout/` | Optional sessions |
| `WorkoutSummary.tsx` | `training/workout/` | Post-session RPE + quality |
| `SafetyInterrupt.tsx` | `training/workout/` | Extended with PE-specific rules |
| `ProgressComparison.tsx` | `training/workout/` | "Last session vs. today" |
| `MaxHangTest.tsx` | `training/assessment/` | Finger max strength unchanged |
| `InjuryScreen.tsx` | `training/assessment/` | Extends with `shoulderSymptomScore` |
| `PullingStrengthTest.tsx` | `training/assessment/` | Optional test |
| `CampusBoardTest.tsx` | `training/assessment/` | Optional test |
| `AssessmentFlow.tsx` | `training/assessment/` | Shell reused; PE-specific steps added |
| `MorningCheckin.tsx` | `training/checkin/` | Unchanged |
| `DashboardHeader.tsx` | `training/dashboard/` | Unchanged |
| `WeekSchedule.tsx` | `training/dashboard/` | Unchanged |
| `TodayWorkoutCard.tsx` | `training/dashboard/` | Unchanged |
| `ProfileCard.tsx` | `training/dashboard/` | Unchanged |
| `ProgressionCard.tsx` | `training/dashboard/` | Unchanged |
| `MaxHangChart.tsx` | `training/progress/` | Used in PE progress page |
| `LoadChart.tsx` | `training/progress/` | sRPE chart reused |
| `RadarComparison.tsx` | `training/progress/` | PE axes substituted |
| `AssessmentComparisonSection.tsx` | `training/progress/` | PE metrics substituted |
| `AssessmentComparisonTable.tsx` | `training/progress/` | PE metrics substituted |
| `ChartCard.tsx` | `training/progress/` | Reused as wrapper |
| `MilestoneModal.tsx` | `training/education/` | Reused with PE slugs |
| `EducationCard.tsx` | `training/education/` | Reused |
| `EducationArticle.tsx` | `training/education/` | Reused |
| `TrainingAuthRedirect.tsx` | `training/` | Unchanged |
| `TrainingProfileForm.tsx` | `training/onboarding/` | Unchanged |
| `FrequencySelector.tsx` | `training/onboarding/` | Unchanged |
| `OnboardingConfirmation.tsx` | `training/onboarding/` | Unchanged |
| `NumberSlider.tsx` | `training/ui/` | Unchanged |

#### Adapted (Minor Changes)
| Component | Change Needed |
|---|---|
| `KeyMetrics.tsx` | Swap bouldering metrics for PE metrics (crux rate, fluency stops, IHE reps) |
| `AssessmentFlow.tsx` | Add `IntermittentEnduranceTest` and `CruxAfterFatigueTest` steps |
| `InjuryScreen.tsx` | Add `shoulderSymptomScore` field (PE-critical tracking) |
| `BoulderBenchmark.tsx` | Optional: reuse as `CruxAfterFatigueTest.tsx` baseline shell |
| `AssessmentResultsView.tsx` | Add PE-specific result sections |

### New Components Needed (PE-Only)

```
src/components/training/
  workout/
    ARCClimbingLogger.tsx         ARC/continuous climbing with silent feet + fluency tracking
    FourByFourLogger.tsx          4×4 boulder rounds — falls per problem, per round
    IntervalsLogger.tsx           Route-style interval sets (work/rest/pump/completion)
    IntermittentHangLogger.tsx    IHE at 60% MVC — set-by-set reps, force quality
    CriticalForceLogger.tsx       CFB blocks — intensity calibration, cross-cycle compare
    CruxAfterFatigueLogger.tsx    PRIMARY drill — lead-in timer + crux attempt + round list
    RoutePracticeLogger.tsx       Route burns — fluency stops, beta notes, high point
    ThresholdIntervalsLogger.tsx  Meso 3 sustained hard climbing intervals
    EasyClimbingWithConstraints.tsx  Extends EasyClimbingLogger with silent feet/fluency (Meso 3 Workout B)

  assessment/
    IntermittentEnduranceTest.tsx  60% MVC repeater test protocol
    CruxAfterFatigueTest.tsx       Baseline crux-after-fatigue simulation (3 attempts)

  progress/
    CruxSuccessRateChart.tsx       Primary KPI — success rate over all CAF sessions
    FluencyStopChart.tsx           Stops per set trend (lower = better)
    IntermittentEnduranceChart.tsx IHE total reps trend across program
    ShoulderSymptomChart.tsx       Shoulder score over time with danger threshold lines
```

### New Plan Files

```
src/lib/plans/power-endurance/
  types.ts              PE DrillType extensions + shared plan types
  2day.ts               Sessions A + B + rest-day antagonist note
  3day.ts               Workouts A / B / C across all 3 mesocycles
  4day.ts               Workouts A / B / C / D across all 3 mesocycles
  drills.ts             PE drill definition catalog (CAF, IHE, CFB, ARC, 4×4, intervals)
  planEngine.ts         User state → next PE session
  calculations.ts       IHE load, CAF trend, fluency trend, target loads
  educationTriggers.ts  Week/mesocycle → education slug mappings

src/lib/firebase/training/
  power-endurance-assessments.ts   CRUD for PE assessments
  power-endurance-workouts.ts      CRUD for PE workout sessions

src/content/training/power-endurance/
  intro-why-test.mdx
  meso1-aerobic-foundation.mdx
  silent-feet-fluency.mdx
  why-deload.mdx
  meso2-threshold-work.mdx
  critical-force-explained.mdx
  mid-program-check.mdx
  meso3-redpoint-focus.mdx
  taper-performance.mdx
  program-complete.mdx
```

### Full Updated Project Structure (PE Additions Highlighted)

```
src/
  app/
    training-center/              ✅ existing shell; no new routes needed
      page.tsx                    ✅ already supports all 4 goal types
      layout.tsx                  ✅ existing
      dashboard/page.tsx          ✅ existing; PE metrics rendered via KeyMetrics
      workout/[sessionId]/page.tsx ✅ existing; PE drills plug in via DrillCard
      assessment/page.tsx         ✅ existing; PE assessment steps added
      progress/page.tsx           ✅ existing; PE charts added
      education/page.tsx          ✅ existing
      education/[slug]/page.tsx   ✅ existing

  components/training/
    [all existing bouldering components]   ✅ reused
    workout/
      ARCClimbingLogger.tsx        🆕 NEW
      FourByFourLogger.tsx         🆕 NEW
      IntervalsLogger.tsx          🆕 NEW
      IntermittentHangLogger.tsx   🆕 NEW
      CriticalForceLogger.tsx      🆕 NEW
      CruxAfterFatigueLogger.tsx   🆕 NEW (PRIMARY)
      RoutePracticeLogger.tsx      🆕 NEW
      ThresholdIntervalsLogger.tsx 🆕 NEW
      EasyClimbingWithConstraints.tsx  🆕 NEW (extends EasyClimbingLogger)
    assessment/
      IntermittentEnduranceTest.tsx  🆕 NEW
      CruxAfterFatigueTest.tsx       🆕 NEW
    progress/
      CruxSuccessRateChart.tsx     🆕 NEW
      FluencyStopChart.tsx         🆕 NEW
      IntermittentEnduranceChart.tsx  🆕 NEW
      ShoulderSymptomChart.tsx     🆕 NEW

  lib/
    plans/
      bouldering/                  ✅ existing (unchanged)
      power-endurance/             🆕 NEW
        types.ts
        2day.ts
        3day.ts
        4day.ts
        drills.ts
        planEngine.ts
        calculations.ts
        educationTriggers.ts
    firebase/training/
      profile.ts                   ✅ existing
      program.ts                   ✅ existing
      bouldering-assessments.ts    ✅ existing
      bouldering-workouts.ts       ✅ existing
      daily-checkins.ts            ✅ existing
      power-endurance-assessments.ts  🆕 NEW
      power-endurance-workouts.ts     🆕 NEW
    calculations/
      srpe.ts                      ✅ existing (reused)
      progression.ts               ✅ existing + PE additions
      safety.ts                    ✅ existing + PE-specific rules
      metrics.ts                   ✅ existing + crux rate, fluency, shoulder score

  content/training/
    bouldering/                    ✅ existing
    power-endurance/               🆕 NEW (9 MDX files)
```

---

## 11. Assessment Flow (Week 0, 4, 8, 12)

### PE Assessment Step Sequence

```
Step 1: Warm-Up Acknowledgment
  → User confirms 10+ min easy climbing + progressive hangs completed

Step 2: Finger Max Strength Test  [MaxHangTest.tsx — REUSED]
  → Same protocol as bouldering: 7s max hang, 20-22mm edge, half-crimp
  → Attempts tracked, best load auto-calculated
  → Auto-calculates: % bodyweight, IHE working load (60%)

Step 3: Intermittent Endurance Test  [IntermittentEnduranceTest.tsx — NEW]
  → Working load pre-filled: [calculated 60%] lbs
  → Protocol: 7s on / 3s off until failure
  → User logs reps; reason for stopping; force quality per set
  → Auto-totals: total reps, time under tension

Step 4: Crux-After-Fatigue Simulation  [CruxAfterFatigueTest.tsx — NEW]
  → User selects / describes their benchmark crux (fixed for all test weeks)
  → 2-3 attempts: lead-in → crux attempt
  → Logs: pump before crux, moves completed, success/fail, quality
  → Auto-calculates: success rate, avg moves completed

Step 5: Optional Tests  [PullingStrengthTest.tsx — REUSED; CampusBoardTest.tsx — REUSED]
  → Weighted pull-up 3-5RM
  → Campus max reach (if safe and available)
  → Route PE test (time/falls on known circuit)

Step 6: Injury Baseline  [InjuryScreen.tsx — ADAPTED]
  → Finger pain per digit (same as bouldering)
  → Elbow pain (same)
  → Shoulder pain (same)
  → Shoulder symptom score 0-10 (NEW — composite for PE tracking)
  → Morning stiffness, current concerns

Step 7: Assessment Summary
  → Max hang: X lbs (Y% BW)
  → IHE working load auto-set: Z lbs
  → Crux success rate baseline: W%
  → Injury status: any flags?
  → [ Confirm & Start Program ]
```

### Assessment Comparison (Weeks 4, 8, 12)

The `AssessmentComparisonSection.tsx` and `AssessmentComparisonTable.tsx` are reused. PE substitutes its own metric rows:

| Metric | Week 0 | Week 4 | Week 8 | Week 12 | Change |
|---|---|---|---|---|---|
| Max hang load | — | — | — | — | — |
| Max hang % BW | — | — | — | — | — |
| IHE total reps | — | — | — | — | — |
| Crux success rate | — | — | — | — | — |
| Avg moves completed | — | — | — | — | — |
| Fluency stops/set (trend) | — | — | — | — | ↓ better |
| Silent foot slips (trend) | — | — | — | — | ↓ better |
| Shoulder symptom score | — | — | — | — | ↓ better |

---

## 12. Firestore Security Rules (Updated for PE)

Extends the existing bouldering security rules — only the `trainingCollection` allowlist changes:

```javascript
match /{trainingCollection}/{docId} {
  allow read, write: if request.auth != null 
                     && request.auth.uid == userId
                     && trainingCollection in [
                       'programHistory',
                       'boulderingAssessments',
                       'boulderingWorkouts',
                       'powerEnduranceAssessments',    // NEW
                       'powerEnduranceWorkouts',       // NEW
                       'routeEnduranceWorkouts',
                       'routePowerWorkouts',
                       'dailyCheckins'
                     ];
}
```

No other rule changes needed. The existing pattern handles all new PE subcollections.

---

## 13. Key Design Decisions Explained

### Why crux-after-fatigue success rate is the primary KPI (not max hang)

The bouldering module's headline metric is max hang load because bouldering performance is primarily strength-limited at the intermediate level. Power-endurance performance is limited by the ability to execute hard moves *when already fatigued* — and the only way to measure that directly is the crux simulation. All other metrics (max hang, IHE reps, aerobic base) are upstream inputs that should show up in the crux rate. If they don't, the training isn't transferring, which is the most important thing to know.

### Why fluency stops and silent foot slips get their own tracking

Low-intensity ARC sessions are notoriously easy to waste. Without constraint-based metrics, users either go too hard (turning ARC into moderate tempo work) or improve nothing. The stop count and slip count turn each ARC session into skill-measurable training with zero added fatigue cost. Over 12 weeks the downward trend in these numbers is one of the clearest signals of improved movement economy — which shows up directly in pacing on goal routes.

### Why critical-force blocks alternate with IHE rather than replacing it

CFB and IHE target the same energy system (oxidative capacity of the finger flexors) but from different angles. IHE at 60% MVC builds rhythmic endurance — the ability to sustain sub-maximal contractions repeatedly. CFB trains the threshold between sustainable and non-sustainable output — the intensity ceiling above which fatigue accumulates non-linearly. Alternating them prevents accommodation, and cross-cycle comparison of CFB sessions gives the most objective measure of threshold adaptation across Meso 2.

### Why shoulder symptom score is tracked every session (not just assessments)

Shoulder injuries are the second most common climbing overuse injury after finger pulley strains, and they're particularly common in power-endurance programs where heavy pulling (weighted pull-ups) and dynamic movement (campus) are combined with high-volume aerobic work. The antagonist circuit is the primary prevention tool, but it only works if shoulder symptoms are caught early. Weekly or session-level tracking (rather than only at 4-week assessments) allows the app to flag rising symptom trends before they become injuries.

### Why deload weeks in PE are mandatory rather than optional

In the bouldering module, deloads are strongly recommended. In the power-endurance module, they are explicitly mandatory. The reason: PE training simultaneously generates high finger loading (max hangs, IHE, CFB), high metabolic fatigue (4×4, intervals, CAF), and high neuromuscular demand (campus, power work) in the same program. The cumulative fatigue is higher than any single modality. Without scheduled deloads, the compound fatigue accumulates silently until a structural limit is exceeded.

### Why the 3-day and 4-day plans have different Workout A structures

In the 4-day plan, high-intensity sessions can be split (Monday max strength; Thursday endurance/intervals). In the 3-day plan, the strength session (Workout C: max hangs + antagonist) is specifically separated from the endurance/specificity sessions (Workouts A and B) to prevent combining max-intensity finger work with high-volume aerobic work in the same session. Keeping the strength session on Wednesday (between Mon and Fri) provides maximal separation from both application days.

### Why the 2-day plan uses combined sessions

With only 2 days/week, there's no choice — each session must combine multiple stimuli. The order-within-session rule compensates: strength work always goes first (when freshest), followed by aerobic or specific work. The antagonist circuit moves to a rest day to protect shoulder structures without consuming one of the two scarce training days.

### Why the CAF drill parameters change week-over-week (not session-over-session)

CAF success rate fluctuates significantly between individual sessions based on fatigue state, crux familiarity, and psyche. Changing parameters (lead-in duration, crux difficulty, round count) within a week would make it impossible to attribute performance changes to training rather than parameter changes. The plan changes only one variable per week, and only when the trigger condition is met (success rate > 60% for lead-in extension; two clean sessions for round addition).

---

## 14. Implementation Priority (Build Order)

Most of the foundation (Phases 1-4 from bouldering) is already complete. The PE module can be built incrementally against the existing framework. The **Profile Score System** (CruxTracker) is layered into Phases 1-2 as a foundation (compute, store, display) with its runtime autoregulation engine scheduled as a dedicated later phase (Phase 7).

### Phase 1: Plan Engine + Assessment — ✅ COMPLETE

1. Create `/src/lib/plans/power-endurance/types.ts` extending bouldering types
2. Create PE drill catalog (`drills.ts`) — all CAF, IHE, CFB, ARC, 4×4, interval drills defined
3. Create plan definitions (`2day.ts`, `3day.ts`, `4day.ts`) — full 12-week week-by-week sessions
4. Create `planEngine.ts` (user state → current PE session)
5. Wire `goalType: "route_power_endurance"` into existing goal selection UI
6. Create `powerEnduranceAssessments.ts` Firestore operations
7. Build `IntermittentEnduranceTest.tsx` and `CruxAfterFatigueTest.tsx` assessment components
8. Extend `AssessmentFlow.tsx` to include PE-specific steps when goalType is PE
9. Create `educationTriggers.ts` for PE milestone triggers

**Profile Score System — foundation (onboarding + assessment):**

10. Create `profileScore.ts` — tier tables (`TIER_PARAMS`), `calcProfileScore`, Performance Axis band helpers, `deriveStartingState`/`deriveProfilePerformance`
11. Extend `TrainingProfile` (`profile.ts`) with `profileScore` / `progressionParams` / `performanceAxis` / `startingState` + `saveProfileScore` / `saveStartingState` helpers
12. `ProfileScoreStep.tsx` onboarding step (C1 climbing age, C3 training history, injury history; C2 from age) with live tier preview; wired into PE onboarding flow to compute + save score + params on confirm
13. Derive `performanceAxis` + `startingState` at the Week 0 assessment (`assessment/page.tsx`); surface starting intensity / FSS band / repeater sets in the assessment summary

### Phase 2: Core Workout Drills — ✅ COMPLETE

14. `ARCClimbingLogger.tsx` — ARC with silent feet + fluency counters + pump monitor
15. `CruxAfterFatigueLogger.tsx` — lead-in timer + crux logging + round tracking (PRIMARY)
16. `FourByFourLogger.tsx` — round/problem/falls matrix
17. `IntervalsLogger.tsx` — interval set/rest/completion tracking
18. `IntermittentHangLogger.tsx` — leverages `RepeaterTimer.tsx`; adds reps + force quality logging
19. `CriticalForceLogger.tsx` — block logging + intensity calibration + cross-cycle table
20. `RoutePracticeLogger.tsx` — burn-by-burn route logging with fluency toggle
21. `ThresholdIntervalsLogger.tsx` — Meso 3 sustained effort tracking
22. Wire all new drills into `DrillCard.tsx` switch/registry
23. Add PE-specific safety rules to `safety.ts`
24. Add PE-specific calculations to `calculations.ts` (IHE load, crux trends, fluency trends)

**Profile Score System — foundation (tier-aware display):**

25. Make drill targets tier-aware (`applyTierContext` in `drills.ts`, threaded through `resolveDrills` → `getSessionWithDrills` → workout page + `usePlan`): starting intensity, percentage load increment, IHE starting set count + volume increment, and rest-reduction steps resolved from `startingState` + `progressionParams` (display only)
26. `TierReferenceCard.tsx` — read-only Appendix quick-reference for the user's tier, surfaced on the dashboard

### Phase 3: Dashboard + Safety Monitor (1 week dev)

27. Adapt `KeyMetrics.tsx` for PE — crux success rate, fluency stops, IHE reps as headline metrics
28. Add shoulder symptom score to safety monitor section
29. Add crux trend mini-chart to dashboard
30. Extend `powerEnduranceWorkouts.ts` Firestore operations
31. Add PE-specific fields to daily check-in (or reuse existing check-in fields)

### Phase 4: Progress Visualization (1-2 weeks dev)

32. `CruxSuccessRateChart.tsx` — line chart across all CAF sessions
33. `FluencyStopChart.tsx` — stops/set trend (inverted — lower = better)
34. `IntermittentEnduranceChart.tsx` — IHE reps across program
35. `ShoulderSymptomChart.tsx` — session-by-session shoulder score
36. Wire PE metric rows into `AssessmentComparisonTable.tsx`
37. Adapt `RadarComparison.tsx` PE axes (max hang, IHE reps, crux rate, pull-up, recovery)

### Phase 5: Education Content (1 week dev)

38. Write 9 MDX education files in `/src/content/training/power-endurance/`
39. Wire PE education slugs into milestone modal system
40. Verify education triggers fire at correct mesocycle transitions
41. Wire why-your-program-is-built-around-you.mdx (created and currently in /docs folder) to fire at the onboarding of the PE program, before creating profile, and move file to education files

### Phase 6: Polish + Testing (1-2 weeks dev)

41. Edge case handling (first session before assessment, skipped sessions, early termination)
42. Progressive overload display in drill screens ("Last session: X; Today's target: Y")
43. Post-session summary PE metrics (crux rate, fluency summary alongside sRPE)
44. Real-device testing at gym (ARC session timers, rest timers between CAF rounds)
45. Load testing with simulated 12-week dataset

### Phase 7: Profile Score Autoregulation Engine (2-3 weeks dev)

Activates the runtime half of the Profile Score System. The foundation (Phases 1-2) computes, stores, and displays tier parameters and starting state; this phase makes the plan engine *enforce* them session-by-session. Depends on mature per-session workout logging (Phases 2-3) so that current load, RPE, and session counts are reliably persisted.

46. Persist per-session progression state on the max-strength drill log: current working load, `sessionsAtCurrentLoad` counter, `weeksSinceLastLoadChange`, and the recent-RPE window
47. Implement the Section 5.4 plan-engine reading order in `calculations.ts` / a new `progressionEngine.ts`:
    - Confirmation-counter gate (`sessionsAtCurrentLoad < progressionParams.sessionsToConfirm` → hold)
    - Minimum-time gate (`weeksSinceLastLoadChange < progressionParams.minWeeksPerStep` → hold)
    - Hold-threshold gate (session RPE ≥ `holdThresholdRPE` → hold and reset counter)
    - Regression gate (RPE > `regressionThresholdRPE` for `regressionSessionCount` sessions → drop one step, reset counter)
48. Increment proposal + athlete confirmation UI in the drill flow (system proposes the next `+loadIncrementPct` load; never auto-applies — Section 5.4)
49. Counter-reset rules (Section 5.1): reset on 2+ missed sessions, deload start, hold trigger, regression, or tier downgrade
50. Volume / rest-reduction autoregulation: apply `volumeIncrementPct` and `restReductionSec` steps to IHE / interval / 4×4 / threshold drills under the same confirmation-session gates
51. Weekly sRPE-ceiling enforcement (Section 2.4): track projected weekly sRPE vs `weeklySRPECeiling`; flag and reduce the highest-RPE remaining session's volume when the ceiling is approached
52. Tier-specific deload application (Section 2.3): apply `deloadVolumeReductionPct` + `deloadIntensityReductionPct`, and trigger symptom-based early deloads from `symptomDeloadTrigger` / tier-specific finger-symptom signals
53. Mid-program tier downgrade (Section 5.2): on a new finger injury, re-apply the injury ceiling, drop tier + parameters at the next session, reduce load to the new tier floor if exceeded, and reset the counter
54. Score-recalculation triggers (Section 5.3): recompute on new injury report or return from a 3+ month break (C3 detraining); Performance Axis refresh already runs at each testing week (Weeks 4/8/12)
55. (Optional, separate track) Apply the tier system to the bouldering module — deferred; PE-only through Phase 7

---

## 15. Sample Education Content Outline

### "Mesocycle 1: Why Aerobic Base Comes First"
Shown at start of Week 1 after assessment.

1. **What your assessment told us** — "Your crux success rate at baseline was X%. Your max hang is Y lbs. Here's what that means..."
2. **The power-endurance problem** — "You can probably do the crux moves fresh. The issue is doing them when you're 3 minutes into the route and your forearms are 70% pumped."
3. **Why aerobic base first** — "A stronger aerobic base means you arrive at the crux less pumped. Not 10% less — potentially 30-40% less. We build that base in Mesocycle 1 before we stress the anaerobic system."
4. **What silent feet and fluency actually do** — "They're not just form drills. They reduce the micro-energy leaks that add up to the 20% extra pump that makes you fall on the crux."
5. **Your Week 1-3 targets** — "ARC sessions stay RPE 4-6. Max hangs build toward 90% of your tested max. The crux simulation at the end of each Workout B is your weekly KPI — track it every session."

### "Halfway Check: Reading Your Crux-Success and Fluency Data"
Shown at Week 8 deload.

1. **Crux success rate arc** — Show the user's actual week-by-week success rate. "You went from X% at baseline to Y% after 8 weeks. Here's what that tells us..."
2. **Fluency stop trend** — "Your stop count went from X per set to Y per set. This is a [W%] reduction in movement hesitations — direct evidence of improved movement economy."
3. **Where improvement comes from** — If crux rate improved: "The threshold work is working." If it didn't: "Your aerobic base built but threshold training may need more volume."
4. **Meso 3 preview** — "The next phase shifts from building capacity to practicing the actual skill under competition-like conditions. Your goal-route crux will be used in every Workout D."

---

## Summary

This document provides a complete blueprint for the **Power-Endurance Training Module** as the fourth goal type in the Training Center.

### What's New vs. Bouldering Module

| Area | Bouldering | Power-Endurance |
|---|---|---|
| Primary KPI | Max hang load | Crux success rate (CAF) |
| Key new drills | Max hangs, campus, limit boulders | ARC (constrained), 4×4, IHE, CFB, CAF, route practice |
| Technique metrics | Boulder send rate | Silent foot slips, fluency stops per set |
| Safety focal point | Finger pulley (A2) | Finger + shoulder symptom compound tracking |
| Meso 3 | Performance bouldering | Route-specific redpoint linking burns |
| Plan options | 2/3/4 day | 2/3/4 day |
| Assessment additions | Max hang + campus + boulders | + Intermittent endurance test + CAF simulation |

### What's Reused from Bouldering Module (~80% of infrastructure)

- Entire routing shell and page structure
- All shared hooks: `useActiveProgram`, `useWorkout`, `usePlan`, `useMetrics`, `useSafety`, `useTimer`
- Workout flow architecture: `WorkoutFlow`, `WorkoutProvider`, `DrillCard`
- All timers: `HangTimer`, `RestTimer`, `RepeaterTimer`, `Timer`
- Drill loggers: `MaxHangLogger`, `AntagonistLogger`, `PullUpLogger`, `CampusLogger`, `WarmupLogger`, `CoreLogger`
- All assessment infrastructure: `AssessmentFlow` shell, `MaxHangTest`, `InjuryScreen`, `PullingStrengthTest`, `CampusBoardTest`
- Dashboard layout: `DashboardHeader`, `WeekSchedule`, `TodayWorkoutCard`, `ProfileCard`
- Progress shell: `ChartCard`, `RadarComparison`, `LoadChart`, `MaxHangChart`, comparison tables
- Education delivery: `MilestoneModal`, `EducationCard`, `EducationArticle`
- All onboarding: `TrainingProfileForm`, `FrequencySelector`, `OnboardingConfirmation`
- Firebase operations: `profile.ts`, `program.ts`, `daily-checkins.ts` (all unchanged)
- Safety + calculation engine: extended, not replaced

### Technical Integration

- Uses existing Firebase Auth from `/src/lib/firebase/auth.tsx`
- Uses existing Firestore from `/src/lib/firebase/client.ts`
- New subcollections follow identical pattern to `boulderingWorkouts`/`boulderingAssessments`
- Static plan files follow identical pattern to `/src/lib/plans/bouldering/`
- Education MDX follows identical pattern to `/src/content/training/bouldering/`
- Firestore security rules extend existing allowlist — one line change per new collection
