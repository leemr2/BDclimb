# Crux-After-Fatigue: Assessment, Scoring, and Progress Tracking

## What It Is

Crux-after-fatigue (CAF) is the central training drill and primary performance metric of the Power-Endurance program. The premise is simple: on a hard route, you rarely arrive at the crux fresh. You climb through moderate terrain for a minute or two — or more — and then you have to execute the hardest moves while already partially pumped. The question CAF training answers is: *how well can you perform under that specific condition, and is that ability improving?*

Every power-endurance session includes a CAF block. You do a controlled entry — a set number of moves at a defined grade — then immediately attempt a crux sequence before your arms have a chance to recover. You log what happened, rest fully, and repeat. Five rounds per session. The numbers from every round feed into a session score. That score, tracked across weeks, is your primary measure of progress.

---

## Why Move Count Beats Time

Earlier versions of this training used minutes of climbing as the entry variable. The problem: two minutes of 5.9 climbing and two minutes of 5.11 climbing produce very different fatigue states. Time tells you nothing about how hard you were working.

Move count paired with grade solves this. Twenty moves of 5.9 is a defined, repeatable unit of work. Fifteen moves of 5.10c is a heavier one. Using move count makes every entry comparable session to session and lets you control the fatigue load precisely as the program progresses.

---

## The Scoring System

Each round produces three numbers:

**ELS — Entry Load Score**
Measures the fatigue accumulated during the entry section.

```
ELS = entry moves × entry grade multiplier
```

**CDS — Crux Demand Score**
Measures the performance on the crux itself — how many moves you completed, weighted by how hard the crux is.

```
CDS = crux moves completed × crux grade multiplier
```

**Round Score**
```
Round Score = ELS + CDS
```

**Session CAF Score**
```
Session CAF Score = (Round 1 + Round 2 + Round 3 + Round 4 + Round 5) / number of rounds
```

The session CAF score is the **total round score divided by the number of rounds** — an average round score that stays comparable regardless of how many rounds you logged. This is the number you track across the program. (The raw sum of round scores is retained internally but the tracked KPI is this per-round average.)

**Crux success rate** — the percentage of rounds you sent (all crux moves completed) — is shown alongside the CAF score as a secondary metric.

---

## Grade Multiplier Tables

### Entry Grade Multipliers

Linear scale anchored at 5.9 = 1.0, increasing 0.1 per sub-grade.

| Grade  | Multiplier |
|--------|------------|
| 5.8    | 0.9        |
| 5.9    | 1.0        |
| 5.10a  | 1.1        |
| 5.10b  | 1.2        |
| 5.10c  | 1.3        |
| 5.10d  | 1.4        |
| 5.11a  | 1.5        |
| 5.11b  | 1.6        |
| 5.11c  | 1.7        |
| 5.11d  | 1.8        |
| 5.12a  | 1.9        |
| 5.12b  | 2.0        |
| 5.12c  | 2.1        |
| 5.12d  | 2.2        |
| 5.13a  | 2.3        |

### Crux Grade Multipliers

Linear scale: V-grade + 1.

| Crux Grade | Multiplier |
|------------|------------|
| V0         | 1          |
| V1         | 2          |
| V2         | 3          |
| V3         | 4          |
| V4         | 5          |
| V5         | 6          |
| V6         | 7          |

---

## A Worked Example

**Round setup:** 20 moves of 5.9 entry, V2 crux with 8 total moves.

| Round | Entry Moves | Grade | ELS | Crux Moves Completed | Crux Grade | CDS | Round Score |
|-------|-------------|-------|-----|----------------------|------------|-----|-------------|
| 1     | 20          | 5.9   | 20.0 | 4 / 8              | V2         | 12.0 | 32.0       |
| 2     | 20          | 5.9   | 20.0 | 5 / 8              | V2         | 15.0 | 35.0       |
| 3     | 20          | 5.9   | 20.0 | 4 / 8              | V2         | 12.0 | 32.0       |
| 4     | 20          | 5.9   | 20.0 | 6 / 8              | V2         | 18.0 | 38.0       |
| 5     | 20          | 5.9   | 20.0 | 3 / 8              | V2         | 9.0  | 29.0       |

**Session CAF Score: 166.0/5 = 33.2**

Four weeks later, the same athlete on the same setup:

| Round | ELS  | Moves Completed | CDS  | Round Score |
|-------|------|-----------------|------|-------------|
| 1     | 20.0 | 7 / 8           | 21.0 | 41.0        |
| 2     | 20.0 | 8 / 8 ✓ SEND   | 24.0 | 44.0        |
| 3     | 20.0 | 6 / 8           | 18.0 | 38.0        |
| 4     | 20.0 | 8 / 8 ✓ SEND   | 24.0 | 44.0        |
| 5     | 20.0 | 7 / 8           | 21.0 | 41.0        |

**Session CAF Score: 208.0/5 = 41.6**

Same entry load. 25% higher session score. That's the improvement — not estimated, not subjective, directly counted.

---

## What You Log Each Round

For each of the five rounds you enter:

**Entry section:**
- Number of entry moves
- Route grade of the entry

**Crux:**
- Crux description (what the sequence is)
- V-grade of the crux
- Total moves in the crux
- Moves you completed before falling or topping

**Context (supports limiting factor analysis):**
- Pump level immediately before the crux (1–10)
- Execution quality (1–5)
- Mental state (focused / distracted / anxious / confident)
- Notes

The app calculates ELS, CDS, round score, and running session total automatically.

---

## How Progress Works

### Phase 1: Increase Crux Completion at Fixed Entry Load

Start with an entry load you can do consistently — typically 15–25 moves of 5.9 or low 5.10. Keep that fixed for several sessions. Watch your crux moves completed climb across rounds and across sessions.

Going from averaging 4/8 crux moves to 7/8 crux moves at the same entry load is meaningful fitness progress — your anaerobic capacity and crux execution under fatigue are improving.

### Phase 2: Increase Entry Load

Once you're consistently completing the crux (success rate above 60%, or averaging 7–8/8 moves), increase the entry load. You have two levers:

- **More entry moves** — same grade, longer entry
- **Higher entry grade** — same move count, harder entry (multiplier increases)

The session score will dip when you increase entry load because the crux gets harder to execute. That's expected and correct — you've raised the floor.

### Phase 3: Raise the Crux

When success rate is consistently high AND entry load has been increased, raise the crux grade. The CDS multiplier increases so each completed move is worth more. Progress is now happening on both axes.

---

## What the Session Score Tells You

The session score captures both dimensions of CAF performance in a single trackable number:

- A higher score at the **same difficulty** means your fitness improved — you're completing more crux moves despite the same accumulated fatigue.
- A higher score at **increased difficulty** means your ceiling has risen — you're performing at a harder level and executing better under that greater load.
- A stable score when you **increased entry load or crux grade** is actually progress — you maintained output as the demand went up.

The score only becomes misleading if you change the crux mid-session without logging the grade change. The crux grade is stored per round, so the app can flag when the multiplier shifted.

---

## Assessment Use (Weeks 0, 4, 8, 12)

At each assessment point, you run 2–3 CAF rounds using a consistent benchmark setup — the same entry grade and crux you've been training on. The assessment score feeds the comparison table:

| | Week 0 | Week 4 | Week 8 | Week 12 |
|---|---|---|---|---|
| Entry config | 20 moves / 5.9 | 20 moves / 5.9 | 25 moves / 5.9 | 25 moves / 5.10a |
| ELS per round | 20.0 | 20.0 | 25.0 | 27.5 |
| Avg crux moves | 4/8 | 6/8 | 7/8 | 7/8 |
| Avg CDS | 12.0 | 18.0 | 21.0 | 21.0 |
| Avg round score | 32.0 | 38.0 | 46.0 | 48.5 |

The progression across test weeks tells you whether the training is transferring. If crux completion is stalling at the same entry load, that's a signal to look at aerobic base, pacing, or recovery. If it's climbing, the training is working.

---

## The Bigger Picture

Every other metric in the Power-Endurance program — max hang load, IHE reps, fluency stops, silent foot slips — feeds into CAF performance. A stronger aerobic base means you arrive at the crux less pumped. Better movement economy means you waste less energy on the entry. Higher finger strength means the crux moves themselves are less taxing relative to your max.

The session CAF score is where all of that upstream training either shows up or doesn't. It's the one number that tells you whether the full system is working.
