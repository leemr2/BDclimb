# CruxTracker — Bouldering Training Web App
## Complete Design & Architecture Document

---

## 1. App Overview

**CruxTracker** is a guided bouldering training app that walks users through evidence-based 12-week periodized programs. It replaces paper tracking sheets with an interactive, step-by-step workout experience that automatically calculates load metrics, monitors recovery, flags injury risks, and surfaces educational content at key training milestones.

### Core Value Props
- **Guided workouts**: Step-by-step drill execution (not just a list of exercises)
- **Automatic calculations**: sRPE, load progression %, week-over-week trends — no manual math
- **Smart safety**: Red/yellow flag detection from logged data with automatic warnings
- **Education at milestones**: When a user hits a new mesocycle or deload week, explain *why*
- **Visual progress**: Charts showing max hang, campus, send rates, and load trends over 12 weeks

---

## 2. Information Architecture

### Page Structure

```
/                         → Landing (training center)
/onboarding               → Profile setup + plan selection
/dashboard                → Main hub (progress overview + start workout)
/workout/[sessionId]      → Active workout flow (step-by-step)
/assessment               → Baseline / retest assessment flow
/history                  → Past workout logs + detailed data
/history/[workoutId]      → Individual workout detail
/progress                 → Charts + progress testing comparison
/education                → Library of training articles
/education/[slug]         → Individual education piece
/settings                 → Profile, plan changes, preferences
```

### User Flow (High Level)

```
Sign Up → Onboarding (age/weight/experience) → Select Plan (2/3/4 day)
  → Week 0 Assessment (guided step-by-step)
  → Dashboard appears with Week 1 schedule
  → User taps "Start Workout" → guided session → logs each drill → summary
  → Repeats across the week
  → Week 4: Education modal ("Why deload?") → Deload week + Retest
  → Week 5: Education ("Power/RFD phase") → New mesocycle begins
  → ... continues through Week 12
  → Final assessment + progress report
```

---

## 3. Data Model (Firebase Firestore)

### Why Firestore?
Firestore's document/collection model maps well to this app: each user has nested collections for workouts, assessments, and daily check-ins. Real-time listeners let the dashboard update live as workout data flows in.

### Collections & Documents

```
users/
  {userId}/
    profile: {
      displayName: string
      age: number
      weight: number          // in lbs or kg (store unit preference)
      weightUnit: "lbs" | "kg"
      experienceLevel: "beginner" | "intermediate" | "advanced"
      currentLimitGrade: string   // e.g., "V6"
      createdAt: Timestamp
      updatedAt: Timestamp
    }

    plan: {
      frequency: 2 | 3 | 4           // days per week
      startDate: Timestamp
      currentWeek: number             // 1-12
      currentMesocycle: 1 | 2 | 3
      status: "assessment" | "active" | "deload" | "complete"
      planVersion: string             // for future plan updates
    }

    // --- ASSESSMENTS (Week 0, 4, 8, 12) ---
    assessments/
      {assessmentId}/
        week: number                  // 0, 4, 8, 12
        date: Timestamp
        maxHang: {
          attempts: [{
            load: number              // total load (BW + added)
            addedWeight: number
            heldFull7s: boolean
            notes: string
          }]
          bestLoad: number            // auto-calculated
          percentBodyweight: number   // auto-calculated
          edgeSize: number            // mm
          gripType: "half_crimp" | "open_hand" | "other"
        }
        campusBoard: {
          maxReach: {
            attempts: [{ rung: number, controlled: boolean }]
            bestRung: number
          }
          movesToFailure: {
            totalMoves: number
            stoppingReason: "grip_fail" | "power" | "exhaustion"
          }
          rungSpacing: number         // mm
        } | null                      // null if skipped
        limitBoulders: [{
          problemDescription: string
          grade: string
          attemptsToSend: number
          sent: boolean
          highPoint: string | null
          style: "power" | "technical" | "compression"
          notes: string
        }]
        pullingStrength: {
          attempts: [{
            addedWeight: number
            repsCompleted: number
            quality: "clean" | "ok" | "struggle"
          }]
          bestWeightXReps: string     // e.g., "45 lbs × 4 reps"
        } | null
        injuryBaseline: {
          fingers: {
            [key: string]: {          // e.g., "r_index", "l_middle"
              painAtRest: number      // 0-10
              painWithPressure: number
              stiffness: number
            }
          }
          elbowPain: { left: number, right: number }
          shoulderPain: { left: number, right: number }
          morningStiffness: number
          concerns: string
        }

    // --- WORKOUTS ---
    workouts/
      {workoutId}/
        date: Timestamp
        week: number
        mesocycle: 1 | 2 | 3
        sessionLabel: string          // "A", "B", "C", "D"
        sessionType: string           // "max_hangs_limit_bouldering", etc.
        status: "in_progress" | "completed" | "skipped"
        duration: number              // minutes (auto from start/end)
        startedAt: Timestamp
        completedAt: Timestamp | null
        rpe: number                   // 0-10 (logged at end)
        srpe: number                  // auto: duration × RPE
        sessionQuality: number        // 1-5

        // Drill results stored as array of completed drills
        drills: [{
          drillId: string             // references drill definition
          drillType: string           // "max_hang", "limit_boulder", "campus", etc.
          order: number
          completed: boolean
          data: object                // shape varies by drill type (see below)
          completedAt: Timestamp
        }]

        notes: string
        fingerPainDuring: number      // 0-10
        skinCondition: "good" | "fair" | "poor"

    // --- DAILY CHECK-INS ---
    dailyCheckins/
      {date-string}/                  // e.g., "2026-02-16"
        date: Timestamp
        fingerStiffness: number       // 0-10
        fingerPain: number            // 0-10
        energyLevel: number           // 1-5 (or 1-10)
        sleepQuality: number          // 1-5
        sleepHours: number
        motivation: number            // 1-5
        sorenessLocations: string[]
        readinessForTraining: number  // 1-5
        notes: string
```

### Drill Data Shapes (the `data` field in each drill)

Each drill type has a specific shape. This is important because the workout flow renders different UI for each type.

```typescript
// Max Hang Drill
type MaxHangData = {
  sets: [{
    targetLoad: number
    actualLoad: number
    targetPercent: number
    duration: number          // seconds held
    heldClean: boolean
    pain: number              // 0-10
    restAfter: number         // seconds
    notes: string
  }]
  totalQualityReps: number    // auto-counted
  edgeSize: number
  gripType: string
}

// Limit Boulder Drill
type LimitBoulderData = {
  problems: [{
    description: string
    grade: string
    style: "power" | "technical" | "compression" | "mixed"
    attempts: number
    result: "send" | "highpoint" | "working"
    quality: number           // 1-5
    restMinutes: number
    notes: string
  }]
  totalAttempted: number      // auto
  totalSent: number           // auto
  sendRate: number            // auto: sent/attempted
}

// Campus Board Drill
type CampusDrill = {
  exercise: string            // "1-4-7-10", "max_reach", etc.
  sets: [{
    result: string            // rung number or moves completed
    quality: "clean" | "ok" | "struggle"
    restMinutes: number
    notes: string
  }]
  overallPowerFeel: "explosive" | "good" | "sluggish" | "grinding"
  formQuality: "maintained" | "slight_decline" | "significant_decline"
}

// Weighted Pull-up Drill
type PullUpData = {
  sets: [{
    addedWeight: number
    reps: number
    quality: "clean" | "ok" | "struggle"
    restMinutes: number
  }]
  bestSet: string             // auto: "45 lbs × 5 reps"
}

// Antagonist Circuit Drill
type AntagonistData = {
  exercises: [{
    name: string
    setsCompleted: number
    reps: number
    notes: string
  }]
}

// Easy Climbing / ARC Drill
type EasyClimbingData = {
  duration: number            // minutes
  intensity: "very_easy" | "easy" | "moderate"
  drillFocus: string[]        // ["silent_feet", "straight_arm", etc.]
  pumpLevel: "none" | "light" | "moderate"
  movementQuality: "excellent" | "good" | "fair" | "struggled"
}

// Core Work Drill
type CoreData = {
  exercises: [{
    name: string
    sets: number
    reps: number | string     // number or "30s" for timed
    quality: "clean" | "ok" | "struggle"
  }]
}

// Mobility Drill
type MobilityData = {
  duration: number
  areasAddressed: string[]
  notes: string
}
```

---

## 4. Plan Engine — How the App Knows What Workout to Show

This is the brain of the app. Based on the user's selected frequency (2/3/4 day) and current week, the app generates the correct session.

### Plan Definition Structure

Store these as static JSON (not in Firestore — they're config, not user data). Put them in `/lib/plans/`.

```typescript
// /lib/plans/types.ts
type PlanDefinition = {
  frequency: 2 | 3 | 4
  weeks: WeekDefinition[]
}

type WeekDefinition = {
  weekNumber: number          // 1-12
  mesocycle: 1 | 2 | 3
  isDeload: boolean
  isTestWeek: boolean
  educationSlug: string | null  // triggers education content
  sessions: SessionDefinition[]
}

type SessionDefinition = {
  label: string               // "A", "B", "C", "D"
  suggestedDay: string        // "Monday", "Tuesday", etc.
  title: string               // "Max Hangs + Limit Bouldering"
  intent: string              // "High neural output; freshest day"
  estimatedDuration: number   // minutes
  drills: DrillDefinition[]
}

type DrillDefinition = {
  id: string
  type: DrillType
  name: string
  description: string         // what to do
  instructions: string[]      // step-by-step
  sets?: number
  reps?: number | string
  intensity?: string          // "85-90% of max hang"
  restSeconds?: number
  notes: string[]             // coaching cues, safety notes
  isOptional: boolean
  safetyWarnings: string[]    // shown in red
  progressionRules: string[]  // shown as tips
}
```

### Example: 4-Day Plan, Mesocycle 1, Week 1, Session A

```json
{
  "label": "A",
  "suggestedDay": "Monday",
  "title": "Max Hangs + Limit Bouldering (Power Focus)",
  "intent": "High neural output — your freshest day of the week",
  "estimatedDuration": 90,
  "drills": [
    {
      "id": "warmup_progressive",
      "type": "warmup",
      "name": "Progressive Warm-Up",
      "description": "15-20 min easy climbing, then progressive hangs",
      "instructions": [
        "Start with 10-15 min of easy climbing (3-4 grades below max)",
        "Progressive hangs: bodyweight → 50% → 75% of your target work load",
        "Arm circles, scapular activation, finger flexion/extension"
      ],
      "isOptional": false,
      "safetyWarnings": ["Never skip warm-up before max hangs — injury risk is significantly higher"]
    },
    {
      "id": "max_hang_strength",
      "type": "max_hang",
      "name": "Max Hangs",
      "description": "6 sets × 10 seconds at 85-90% of your tested max",
      "sets": 6,
      "reps": "10 seconds",
      "intensity": "85-90%",
      "restSeconds": 120,
      "instructions": [
        "Use 20mm edge, half-crimp grip",
        "Set scapulae DOWN and BACK before loading",
        "Hold for full 10 seconds — stop if position breaks",
        "Rest exactly 2 minutes between sets"
      ],
      "safetyWarnings": [
        "Stop immediately if pain > 2/10",
        "Never progress load AND volume in the same week"
      ],
      "progressionRules": [
        "Complete all 6 sets clean for 2 consecutive sessions → add 2-3% load",
        "Failed a set? Stay at same weight next session"
      ]
    },
    {
      "id": "limit_bouldering_power",
      "type": "limit_boulder",
      "name": "Limit Bouldering (Steep/Powerful)",
      "description": "5-6 problems at your current limit",
      "instructions": [
        "Focus: steep angles, powerful moves, compression",
        "3-5 high-quality attempts per problem",
        "Rest 4-5 minutes between attempts",
        "Stop when movement quality degrades noticeably"
      ],
      "safetyWarnings": [
        "Stop after 5 tries per problem (unless project session)",
        "Never boulder through finger pain > 2/10"
      ]
    }
  ]
}
```

### How Intensity Auto-Calculates

When a drill says "85-90% of max hang," the app looks up the user's most recent assessment `maxHang.bestLoad` and computes the target:

```typescript
function getTargetLoad(user: User, percentage: number): number {
  const latestAssessment = getLatestAssessment(user.id)
  const maxLoad = latestAssessment.maxHang.bestLoad
  return Math.round(maxLoad * percentage)
}
```

This means the user sees: **"Target load: 162 lbs (87% of your 186 lb max)"** — no manual math needed.

---

## 5. Education System — Milestone Content

### When Education Triggers

Education content appears at specific points in the 12-week cycle. These are defined in the plan definitions via `educationSlug`:

| Trigger Point | Slug | Title |
|---|---|---|
| Before Week 0 assessment | `intro-why-test` | "Why We Test Before Training" |
| Start of Week 1 | `meso1-max-strength` | "Mesocycle 1: Building Your Strength Foundation" |
| Week 4 deload | `why-deload` | "Why Deload Weeks Make You Stronger" |
| Start of Week 5 | `meso2-power-rfd` | "Mesocycle 2: Developing Power & Explosiveness" |
| Week 5 campus intro | `campus-safety` | "Campus Board: High Reward, High Risk" |
| Week 8 deload | `mid-program-check` | "Halfway Check: Reading Your Data" |
| Start of Week 9 | `meso3-performance` | "Mesocycle 3: Time to Perform" |
| Week 12 taper | `taper-peak` | "Tapering: Less Is More" |
| After Week 12 | `program-complete` | "What Your Numbers Mean & What's Next" |

### Education Content Structure

Store as MDX files in `/content/education/` for rich formatting:

```typescript
type EducationPiece = {
  slug: string
  title: string
  subtitle: string
  readTimeMinutes: number
  content: MDX               // rich content with diagrams
  keyTakeaways: string[]     // bullet summary at bottom
  relatedMetrics: string[]   // which user metrics to show alongside
}
```

### Example: "Why Deload Weeks Make You Stronger"

This would explain:
- **What's happening**: You've done 3 weeks of progressively harder max hangs and limit bouldering. Your fingers, tendons, and nervous system need time to consolidate those gains.
- **The science**: Overuse injuries (especially finger pulleys) are the #1 climbing injury. The research shows load management is the most controllable risk factor. Deload = injury prevention.
- **What you'll do this week**: Volume drops 40-50%, but you keep *some* intensity. You'll retest your max hang and benchmark boulders to measure progress.
- **What to expect**: You might feel antsy or "too rested." That's normal. Trust the process — your Week 5 power work needs this foundation.

### Delivery UX

Education pieces appear as:
1. **Modal on dashboard** when the user first opens the app on the trigger week (dismissible, with "Read later" option)
2. **Card in the education library** (always accessible)
3. **Contextual tips** during workouts (mini-versions embedded in drill instructions)

---

## 6. Dashboard Design

The dashboard is the app's home screen. It needs to answer three questions instantly:

1. **What do I do today?** → Next workout card
2. **How am I doing?** → Key metrics at a glance
3. **Am I healthy?** → Recovery/safety indicators

### Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Week 6 of 12 · Mesocycle 2: Power/RFD     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  50% complete                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  TODAY'S WORKOUT                             │    │
│  │  Session A: Campus Board + Power Bouldering  │    │
│  │  ~100 min · RPE target: 8-9                  │    │
│  │                                              │    │
│  │  [ START WORKOUT →  ]                        │    │
│  │                                              │    │
│  │  or: Mark as Rest Day / Skip                 │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌──── MORNING CHECK-IN ────┐                       │
│  │ Quick daily check:       │  (shows if not done)  │
│  │ Fingers · Energy · Sleep │                       │
│  └──────────────────────────┘                       │
│                                                     │
│  ┌──── KEY METRICS ─────────────────────────────┐   │
│  │                                               │   │
│  │  Max Hang        Campus Reach    Send Rate    │   │
│  │  186 lbs (+8%)   Rung 7 (+2)    62% (+15%)   │   │
│  │  ▁▂▃▄▅▆▇        ▁▂▃▅▇          ▁▃▅▆▇        │   │
│  │  (sparklines showing trend across test weeks) │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── THIS WEEK ───────────────────────────────┐   │
│  │  Mon: Session A ✓ (sRPE: 900)                │   │
│  │  Tue: Session B ✓ (sRPE: 280)                │   │
│  │  Wed: REST                                    │   │
│  │  Thu: Session C ← TODAY                       │   │
│  │  Fri: REST                                    │   │
│  │  Sat: Session D (upcoming)                    │   │
│  │  Sun: REST                                    │   │
│  │                                               │   │
│  │  Weekly sRPE so far: 1,180 / ~2,400 target   │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── SAFETY MONITOR ──────────────────────────┐   │
│  │  ● Finger status: 2/10 (OK)                  │   │
│  │  ● Load trend: +12% vs last week (OK)        │   │
│  │  ● Recovery: 4/5 avg (Good)                  │   │
│  │                                               │   │
│  │  ⚠️ No flags this week                        │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── RECENT EDUCATION ────────────────────────┐   │
│  │  📖 "Developing Power & Explosiveness"        │   │
│  │  Why this mesocycle matters...                │   │
│  │  [Read →]                                     │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 7. Active Workout Flow — The Core UX

This is the most important part of the app. When the user taps "Start Workout," they enter a focused, step-by-step flow.

### Workout Flow Architecture

```
Start Workout
  → Pre-workout safety check (auto: checks morning check-in data)
  → Drill 1: Warm-Up
    → Instructions screen
    → Timer (if applicable)
    → Log completion
  → Drill 2: Max Hangs
    → Instructions + target load displayed
    → Set 1 → timer (10s) → log result
    → Rest timer (2 min)
    → Set 2 → timer → log
    → ... repeat for all sets
    → Auto-summary: "5/6 sets clean at 162 lbs"
  → Drill 3: Limit Bouldering
    → Instructions screen
    → Problem 1 → log attempts + result
    → Problem 2 → log
    → ... (user adds problems dynamically)
    → "Done with bouldering" button
  → ... more drills ...
  → Post-Workout Summary
    → Rate session RPE (0-10 slider)
    → Rate session quality (1-5)
    → Finger pain check (0-10)
    → Skin condition
    → Notes (free text)
    → Auto-calculated: sRPE, total problems, send rate
    → Safety check: any flags triggered?
  → Save & Return to Dashboard
```

### Key UX Principles for Workout Flow

1. **One thing at a time**: Each screen shows one drill or one set. No scrolling through a giant workout list.

2. **Smart defaults**: Pre-fill target loads from assessment data. Pre-fill rest timers. Show "last time you did this" for comparison.

3. **Built-in timers**: Hang timers (10s countdown with audio cue), rest timers (2 min with notification), session timers (total duration tracked automatically).

4. **Safety interrupts**: If user logs pain > 2/10 on a max hang set, show a yellow warning: *"Pain detected. The protocol says to stop finger loading if pain > 2/10. Would you like to: (a) Skip remaining sets, (b) Reduce load 10%, (c) Continue anyway (not recommended)"*

5. **Progress context**: On each drill, show a small comparison: *"Last session: 158 lbs × 6 sets. Today's target: 162 lbs × 6 sets (+2.5%)"*

### Workout Screen States

```typescript
type WorkoutState = {
  workoutId: string
  currentDrillIndex: number
  currentSetIndex: number | null  // for multi-set drills
  status: "instructions" | "active" | "logging" | "resting" | "summary"
  startTime: Timestamp
  elapsedMinutes: number
  completedDrills: CompletedDrill[]
  safetyFlags: SafetyFlag[]
}
```

---

## 8. Automatic Calculations & Smart Features

### Auto-Calculated Metrics

| Metric | Formula | Where Used |
|---|---|---|
| sRPE | `duration_minutes × RPE` | Every session → weekly totals |
| Weekly sRPE | Sum of all session sRPEs | Dashboard, load monitoring |
| Week-over-week change | `((thisWeek - lastWeek) / lastWeek) × 100` | Dashboard safety monitor |
| Max hang % BW | `(totalLoad / bodyweight) × 100` | Assessment comparisons |
| Target load | `latestMaxHang × targetPercent` | Workout drill instructions |
| Send rate | `(sent / attempted) × 100` | Bouldering drill summaries |
| Attempts-to-send trend | Compare across weeks | Progress charts |
| Avg morning metrics | Weekly averages of daily check-ins | Dashboard recovery section |

### Safety Flag Auto-Detection

These run after every workout log and daily check-in:

```typescript
type SafetyRule = {
  id: string
  severity: "red" | "yellow"
  condition: (userData: UserData) => boolean
  message: string
  action: string
}

const safetyRules: SafetyRule[] = [
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
    message: `Weekly load increased ${weekOverWeekChange(d)}% — exceeds 15-20% guideline`,
    action: "Consider reducing volume next week"
  },
  {
    id: "stiffness_trend",
    severity: "yellow",
    condition: (d) => isIncreasingTrend(d.checkins, "fingerStiffness", 3),
    message: "Finger stiffness rising for 3+ consecutive days",
    action: "Insert extra rest day or reduce intensity"
  },
  {
    id: "recovery_poor",
    severity: "yellow",
    condition: (d) => avgRecovery(d.checkins, 2) < 3,
    message: "Recovery below 3/5 for two consecutive training days",
    action: "Insert extra rest day"
  },
  {
    id: "energy_sustained_low",
    severity: "yellow",
    condition: (d) => avgEnergy(d.checkins, 14) < 3,
    message: "Average energy below 3/5 for 2 consecutive weeks",
    action: "Reduce volume 20-30%"
  }
]
```

### Progression Logic

The app should suggest (not auto-apply) load changes:

```typescript
function evaluateMaxHangProgression(
  recentSessions: MaxHangData[]
): ProgressionSuggestion {
  const lastTwo = recentSessions.slice(-2)

  // Check: all sets clean for 2 consecutive sessions?
  const bothClean = lastTwo.every(s =>
    s.sets.every(set => set.heldClean && set.pain <= 2)
  )

  if (bothClean) {
    const currentLoad = lastTwo[0].sets[0].actualLoad
    const increment = Math.round(currentLoad * 0.025) // 2.5%
    return {
      type: "increase",
      message: `Two clean sessions in a row! Consider adding ${increment} lbs (2.5%) next session.`,
      suggestedLoad: currentLoad + increment
    }
  }

  const anyFailed = lastTwo.some(s =>
    s.sets.some(set => !set.heldClean)
  )

  if (anyFailed) {
    return {
      type: "maintain",
      message: "Not all sets were clean. Stay at current load."
    }
  }

  return { type: "maintain", message: "Keep building consistency." }
}
```

---

## 9. Progress Visualization

### Charts to Build (use Recharts or Chart.js)

**1. Max Hang Progression (Line Chart)**
- X-axis: Test weeks (0, 4, 8, 12)
- Y-axis: Added weight (lbs/kg)
- Secondary line: % of bodyweight
- Annotations: mesocycle boundaries

**2. Weekly sRPE Load (Bar Chart)**
- X-axis: Weeks 1-12
- Y-axis: Total weekly sRPE
- Color-coded by mesocycle
- Deload weeks visually distinct (lighter color)
- Horizontal line showing 15-20% threshold from prior week

**3. Send Rate Trend (Line Chart)**
- X-axis: Weeks
- Y-axis: % of limit problems sent
- Overlaid with attempts-to-send average

**4. Campus Board Progress (if used, Bar Chart)**
- Max reach (rung #) at Weeks 5, 8, 12
- Moves to failure at same timepoints

**5. Recovery Dashboard (Area Chart)**
- Daily finger stiffness, energy, sleep quality over time
- Smoothed 7-day rolling average
- Flag markers where safety rules triggered

**6. Radar/Spider Chart (Assessment Comparison)**
- Axes: Max Hang, Campus Reach, Send Rate, Pull-up Strength, Recovery Score
- Overlay: Week 0 vs Week 4 vs Week 8 vs Week 12
- Great for the "big picture" view at program end

---

## 10. Tech Stack & Project Structure

### Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR for SEO pages, client components for app |
| Auth | Firebase Auth | Email/password + Google. Simple, reliable |
| Database | Cloud Firestore | Real-time listeners, offline support, scales |
| State | Zustand or React Context | Lightweight; Firestore handles persistence |
| Styling | Tailwind CSS + custom design tokens | Rapid iteration, consistent design system |
| Charts | Recharts | React-native, composable, good for dashboards |
| Animations | Framer Motion | Polish for workout flow transitions |
| MDX | next-mdx-remote | Education content with rich formatting |
| Deployment | Vercel | Zero-config Next.js hosting |
| PWA | next-pwa | Offline workout logging (critical for gyms) |

### Project Structure

```
/app
  /layout.tsx                    # Root layout with auth provider
  /page.tsx                      # Landing page
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(app)                         # Authenticated routes
    /layout.tsx                  # App shell with nav
    /dashboard/page.tsx
    /workout/[sessionId]/page.tsx
    /assessment/page.tsx
    /history/page.tsx
    /history/[workoutId]/page.tsx
    /progress/page.tsx
    /education/page.tsx
    /education/[slug]/page.tsx
    /settings/page.tsx
    /onboarding/page.tsx

/components
  /ui                            # Design system primitives
    /Button.tsx
    /Card.tsx
    /Input.tsx
    /Slider.tsx                  # For RPE input
    /Timer.tsx                   # Countdown timer component
    /ProgressBar.tsx
    /Badge.tsx
    /Modal.tsx
    /SafetyBanner.tsx            # Red/yellow flag alerts
  /dashboard
    /TodayWorkoutCard.tsx
    /WeekSchedule.tsx
    /KeyMetrics.tsx
    /SafetyMonitor.tsx
    /MorningCheckin.tsx
  /workout
    /WorkoutProvider.tsx          # Context for active workout state
    /DrillCard.tsx               # Renders drill instructions
    /SetLogger.tsx               # Log individual set results
    /RestTimer.tsx               # Between-set rest countdown
    /HangTimer.tsx               # 10s hang countdown with audio
    /BoulderLogger.tsx           # Log problem attempts
    /SafetyInterrupt.tsx         # Pain/warning overlay
    /WorkoutSummary.tsx          # Post-workout stats + RPE entry
    /ProgressComparison.tsx      # "Last time vs now" mini-display
  /assessment
    /AssessmentFlow.tsx
    /MaxHangTest.tsx
    /CampusTest.tsx
    /BoulderBenchmark.tsx
    /InjuryScreen.tsx
  /progress
    /MaxHangChart.tsx
    /LoadChart.tsx
    /SendRateChart.tsx
    /CampusChart.tsx
    /RecoveryChart.tsx
    /RadarComparison.tsx
  /education
    /EducationCard.tsx
    /MilestoneModal.tsx          # Full-screen education at milestones

/lib
  /firebase
    /config.ts                   # Firebase init
    /auth.ts                     # Auth helpers
    /firestore.ts                # Firestore helpers + typed queries
  /plans
    /types.ts                    # Plan type definitions
    /2day.ts                     # 2-day plan definition
    /3day.ts                     # 3-day plan definition
    /4day.ts                     # 4-day plan definition
    /drills.ts                   # Drill definition catalog
    /planEngine.ts               # Logic: user state → next workout
  /calculations
    /srpe.ts                     # sRPE calculations
    /progression.ts              # Load progression suggestions
    /safety.ts                   # Safety flag detection
    /metrics.ts                  # Derived metrics (send rate, trends)
  /hooks
    /useAuth.ts
    /useWorkout.ts               # Active workout state management
    /usePlan.ts                  # Current plan/week/session
    /useMetrics.ts               # Dashboard metrics
    /useSafety.ts                # Real-time safety monitoring
    /useTimer.ts                 # Timer hook with audio

/content
  /education                     # MDX files for education pieces
    /intro-why-test.mdx
    /meso1-max-strength.mdx
    /why-deload.mdx
    /meso2-power-rfd.mdx
    /campus-safety.mdx
    /mid-program-check.mdx
    /meso3-performance.mdx
    /taper-peak.mdx
    /program-complete.mdx
```

---

## 11. Implementation Priority (Build Order)

### Phase 1: Foundation (Week 1-2 of dev)
1. Firebase setup (auth + Firestore rules)
2. Auth flow (signup/login)
3. Onboarding (profile + plan selection)
4. Plan engine (generate correct workout from user state)
5. Basic dashboard (today's workout card + week schedule)

### Phase 2: Core Workout Flow (Week 3-4)
6. Workout flow shell (step-by-step navigation)
7. Drill components (MaxHangLogger, BoulderLogger, etc.)
8. Timer components (hang timer, rest timer)
9. Post-workout summary + RPE logging
10. Workout history list

### Phase 3: Assessment & Intelligence (Week 5-6)
11. Assessment flow (Week 0 baseline)
12. Auto-calculations (sRPE, target loads, send rates)
13. Safety flag detection system
14. Progression suggestions
15. Morning check-in flow

### Phase 4: Visualization & Education (Week 7-8)
16. Progress charts (max hang, load, send rate)
17. Assessment comparison (radar chart, before/after tables)
18. Education content (MDX pages)
19. Milestone modals (triggered at mesocycle transitions)

### Phase 5: Polish & PWA (Week 9-10)
20. Offline support (critical: gyms often have bad wifi)
21. Animations and transitions (Framer Motion)
22. Push notifications (rest timer done, morning check-in reminder)
23. Export/share progress report
24. Edge cases and error handling

---

## 12. Key Design Decisions Explained

### Why step-by-step instead of a workout list?

Most training apps show a list of exercises and let users check them off. This works for experienced athletes but fails for the target audience (intermediate climbers learning structured training). The step-by-step flow:
- Reduces cognitive load (one thing at a time)
- Ensures proper rest periods (timers are built in)
- Enables safety interrupts (can't ignore a pain warning)
- Captures higher-quality data (logging happens in context, not after the fact)

### Why Firestore over a SQL database?

The data is hierarchical (users → workouts → drills → sets) and the access patterns are user-scoped. You'll almost never query across users. Firestore's document model matches perfectly, and you get real-time listeners + offline support for free — critical since gyms often have poor connectivity.

### Why store plan definitions as static JSON, not in Firestore?

Plans are *configuration*, not user data. They change rarely and identically for all users on the same plan. Storing them as code:
- Makes version control easy (Git tracks changes)
- Avoids Firestore reads for every workout load
- Enables type safety (TypeScript enforces drill shapes)
- Makes testing simple (unit test plan generation logic)

### Why MDX for education content?

Education pieces need rich formatting (headers, bold, diagrams, embedded metric displays). MDX lets you write Markdown with React components inline — so an education piece about deload weeks can include the user's actual sRPE chart right in the article.

### Why PWA support matters

Climbing gyms frequently have poor or no wifi. The app needs to:
- Cache the current workout definition offline
- Let users log drills while offline
- Sync to Firestore when connectivity returns
- Show timers without network dependency

---

## 13. Firestore Security Rules (Starter)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // All subcollections inherit the same rule
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 14. UI/UX Design Direction

### Aesthetic: "Chalk & Stone"

Inspired by the texture of climbing — rough, tactile, confident. Not a fitness-bro neon app. Not a minimal corporate SaaS.

**Color Palette:**
- Background: Warm off-white (#F5F0EB) — like chalk-dusted limestone
- Primary surface: #FFFFFF with subtle warm shadows
- Accent: Deep terracotta (#C75B39) — like sandstone
- Secondary accent: Slate blue (#4A6274) — like granite
- Success: Sage green (#6B8F71)
- Warning: Amber (#D4A843)
- Danger: Deep red (#B33A3A)
- Text: Charcoal (#2C2C2C)

**Typography:**
- Display/Headers: **DM Serif Display** — authoritative, editorial, distinct
- Body: **Source Sans 3** — clean readability for data-heavy screens
- Mono (for numbers/metrics): **JetBrains Mono** — crisp metric display

**Components:**
- Cards with subtle texture (noise overlay, like rock grain)
- Progress bars that look like crack systems filling in
- Timers with a bold, confident countdown aesthetic
- Safety banners with clear visual hierarchy (red = stop, amber = caution)

**Motion:**
- Smooth page transitions in workout flow (slide left/right)
- Celebration micro-animation on sends and PRs
- Subtle pulse on active timers
- Staggered reveal on dashboard metrics

---

## 15. Sample Education Content Outline

### "Mesocycle 1: Building Your Strength Foundation" (Week 1)

**Shown to user when they start Week 1 after assessment.**

**Sections:**
1. **What you just learned from your assessment** — "Your max hang is X lbs (Y% of bodyweight). Here's what that tells us about where you are."
2. **Why max strength comes first** — "Think of finger strength as your 'ceiling.' Every other quality (power, endurance, efficiency) sits below it. If your ceiling is low, everything is harder."
3. **What the next 3 weeks look like** — "Two max hang sessions per week, plus limit bouldering. You'll add load conservatively — we're talking 2-3% when everything is clean."
4. **What to watch for** — "Finger tenderness is normal. Finger *pain* is a signal. Here's the difference..."
5. **Your targets** — "By Week 4, we're aiming for +5-10% on your max hang. That's [calculated number] lbs for you."

### "Why Deload Weeks Make You Stronger" (Week 4)

1. **You're not getting weaker** — "Your muscles and tendons don't get stronger *during* training. They get stronger during recovery."
2. **The injury equation** — "Climbing overuse injuries are almost always load-management problems. This week is your insurance policy."
3. **What deload looks like** — "Volume drops 40-50%. You keep some intensity. You retest your max hang and benchmark boulders."
4. **Reading your retest results** — "Here's how to interpret what the numbers say..."
5. **What's coming in Mesocycle 2** — "You've built the foundation. Next: power and explosiveness."

---

## Summary

This document gives you a complete blueprint:

- **Data model** that maps directly to the tracking templates in your training plans
- **Plan engine** that generates the correct workout for any user/week/day
- **Step-by-step workout flow** that guides users through each drill
- **Auto-calculations** for sRPE, load targets, progression, and safety flags
- **Education system** that explains the "why" at every milestone
- **Visual progress tracking** with charts showing real improvement
- **Practical tech stack** (Next.js + Firebase) with offline-first design for gym use

The next step would be to pick a phase from the build order and start implementing. Phase 1 (foundation) gets you auth, onboarding, and a working dashboard — enough to start testing the flow with real users.
