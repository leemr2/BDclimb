# Change Summary: Profile Score System Integration into Power-Endurance Plans

**Date:** June 17, 2026  
**Source documents reviewed:**
- `docs/PowerEndurance_Trainer/load_progression_for_Power_endurance.md`
- `docs/CruxTracker_Profile_Score_System.md`

**Documents updated:**
- `docs/PowerEndurance_Trainer/Power-Endurance 2 DaysWeek.md`
- `docs/PowerEndurance_Trainer/Power-Endurance Plan 3 days a Week.md`
- `docs/PowerEndurance_Trainer/Power-Endurance 4 DaysWeek.md`
- `docs/PowerEndurance_Trainer/Comprehensive_Tracking_Sheet_Template_ Power-Endurance.md`

---

## Why These Changes Were Made

The load progression research document established that the original "+2-3kg after 2 perfect sessions" rule has two documented weaknesses: it expresses progression in absolute kg (a larger relative jump for lighter/weaker athletes), and it uses a binary "perfect session" gate instead of a validated RPE/readiness gate. The research recommended replacing this with percentage-based progression keyed to structural readiness, and autoregulating via RPE/RIR gates.

The CruxTracker Profile Score System formalized this into a concrete, implementable model: a 0-100 profile score derived from climbing age, chronological age, and training history (plus an injury ceiling), mapping to five tiers, each with fully specified progression parameters. The plans and tracking sheet needed to be updated to reference and apply this system.

---

## Change 1: Profile Score Onboarding Block (All Three Plans)

**What changed:** A new "Step 0: Profile Score Onboarding" section was added to each plan, placed immediately before the Week 0 Assessment Battery.

**What it contains:**
- The four onboarding inputs (C1 climbing age, C2 age/recovery, C3 training history, injury ceiling)
- The FPS calculation formula
- The tier assignment table (5 tiers, 0-100 range)
- A directive to record tier before reading further
- Frequency-specific notes for 40+ athletes and Tier 1-2 athletes

**Why it matters:** Previously, athletes entered the plan with no structured readiness profile. The onboarding block makes the athlete's tier the foundation of everything that follows — without it, the tier-specific progression tables in the Progression Rules section have no anchor.

**4-day specific note added:** Tier 1-2 athletes on the 4-day plan are directed to use a Tuesday/Saturday session layout (4-day gap between high-intensity finger sessions) rather than the default Monday/Thursday layout (3-day gap). This reflects the Profile Score System's minimum days between finger sessions parameter for Tiers 1-2 (3 days; Tiers 3-5 need only 2 days).

---

## Change 2: Hangboard Progression Rules (All Three Plans)

**What changed:** The old "+2-3kg after 2 consecutive perfect sessions" rule was replaced throughout all plans.

**Old rule:** "Add 2-3kg only when 2 consecutive sessions are perfect."

**New rule (integrated):**
- Load increment expressed as a **percentage of current working load** (Tier 1: 1.5%, Tier 2: 2.5%, Tier 3: 3.5%, Tier 4: 4.5%, Tier 5: 5.0%), not a fixed kilogram value
- Confirmation sessions required before advancing: Tiers 1-2 require 3 sessions; Tiers 3-5 require 2 sessions
- A **minimum calendar time gate** must also clear (Tier 1: 3 weeks; Tier 5: 1-2 weeks) — session count meeting sooner does not override this
- **Hold gate**: if session RPE ≥ tier hold threshold (Tier 1: RPE ≥ 7.5; Tier 5: RPE ≥ 8.5), the confirmation counter resets and the advance is blocked
- **Regression gate**: if session RPE exceeds the regression threshold for 2 consecutive sessions (Tier 1: RPE > 8.0; Tier 5: RPE > 9.5), the athlete drops one step and the counter resets at the lower load

**Why this matters:** A fixed "+2.5 kg" step represents approximately 8% for a lighter athlete but only 3.5% for a stronger one. The evidence base (López-Rivera effort margin; connective tissue lag research; 2025 APRE/RPE superiority network meta-analysis) strongly supports percentage-based progression with RPE gates over fixed kilogram increments. The dual gate (session count + calendar time) captures both the neural/muscular adaptation rate (faster) and the connective tissue remodeling rate (slower, time-dependent).

---

## Change 3: Volume and Interval Progression Rules (All Three Plans)

**What changed:** Volume and interval progression steps were updated to reference tier-specific parameters.

**Specifically:**
- Volume increments now reference the tier's volume increment percentage (Tier 1: 10%; Tier 5: 20%) rather than generic "add 1 set" language
- Rest reduction steps now reference the tier's rest reduction per step (Tier 1: 15 sec; Tier 5: 30-45 sec) rather than generic "reduce rest slightly"
- Confirmation sessions before each step explicitly reference the tier (same 2-3 session logic as hangboard)
- The ordered progression hierarchy (reps → sets → rest → difficulty) is preserved unchanged; only the magnitude of each step becomes tier-keyed

---

## Change 4: Safety Guidelines — Tier-Specific Deload Triggers (All Three Plans)

**What changed:** Each plan's Safety Guidelines section was updated to include tier-specific early deload triggers alongside the universal red flags.

**Universal red flags (unchanged, all tiers):** Sharp/sudden pain during climbing; audible or felt pop in a finger; visible swelling within 24 hours. These always trigger immediate session stop and clinical evaluation.

**New tier-specific early deload triggers:**
- Tier 1: Any A2 or pulley-region pain during or after climbing
- Tier 2: Morning stiffness in finger joints on 2 or more consecutive days
- Tier 3: Morning stiffness in finger joints on 3 or more consecutive days
- Tiers 4-5: Standard red flags only

**Why this matters:** A Tier 1 developing athlete with 1-2 years of climbing has a narrow load-tolerance window. The same morning stiffness signal that a 15-year veteran (Tier 5) can train through represents a genuine tissue overload for a newer climber. Tier-stratified triggers make safety thresholds proportionate to structural readiness.

---

## Change 5: Deload Protocols Updated (All Three Plans)

**What changed:** Deload volume reduction and intensity handling during deload weeks were updated to reflect tier-specific parameters.

**New parameters by tier:**
- Volume reduction during deload: Tier 1: 55%, Tier 2: 50%, Tier 3: 45%, Tier 4: 40%, Tier 5: 35%
- Intensity handling: Tiers 1-2 also reduce working load (Tier 1: -15%, Tier 2: -10%); Tiers 3-5 maintain working intensity

**Why this matters:** A Tier 1 athlete needs more aggressive deload depth because their accumulated fatigue tolerance is lower and their tissue recovery takes longer. Higher tiers maintain intensity during deloads because the detraining risk of dropping both volume and intensity simultaneously outweighs the recovery benefit at their volume reduction level.

---

## Change 6: Weekly Monitoring — sRPE Ceiling by Tier (All Three Plans)

**What changed:** The weekly monitoring / review sections in all three plans now reference the tier-specific sRPE ceiling rather than a single generic warning.

**Tier sRPE ceilings:** Tier 1: 800 / Tier 2: 950 / Tier 3: 1,100 / Tier 4: 1,300 / Tier 5: 1,500

**4-day plan specific:** The Quick Reference Card's "Weekly total sRPE: 1,000-1,400" target was annotated to clarify this range applies to Tiers 4-5. Tier 3 athletes on the 4-day plan will reach their ceiling (1,100) during Mesocycle 2 and should monitor closely.

---

## Change 7: Mid-Cycle Injury Tier Downgrade (All Three Plans)

**What changed:** A new note was added to each plan's Safety Guidelines describing how to handle a mid-cycle finger injury that changes the athlete's injury ceiling.

**New procedure:**
1. Apply the new injury ceiling to the current FPS
2. If the ceiling drops the FPS into a lower tier, that tier's parameters take effect immediately
3. If the current working load exceeds the new tier's floor, reduce load to the new tier's floor before resuming
4. The confirmation counter resets to zero

This mirrors the formal mid-program tier downgrade procedure defined in Section 5.2 of the Profile Score System document.

---

## Change 8: Quick Reference Tables Added (All Three Plans)

**What changed:** Each plan's Progression Rules section now includes a single-page "Quick Reference: Tier Progression Parameters" table covering all parameters needed during a session.

**Parameters in each table:** load increment, sessions to confirm, minimum time per step, hold threshold, regression trigger, volume increment, rest reduction per step, weekly sRPE ceiling, deload volume cut. The 4-day plan's table also includes minimum days between high-intensity finger sessions.

**Why this matters:** Athletes should not need to navigate to the Profile Score System document mid-session. The quick reference puts every decision parameter on one table within the plan itself.

---

## Change 9: Tracking Sheet — Template 0 Added

**What changed:** A new Template 0 ("Profile Score Onboarding") was inserted at the top of the tracking sheet, before Template 1.

**Contents of Template 0:**
- C1/C2/C3 scoring inputs with checkboxes for each band
- Raw Score and FPS calculation
- Injury ceiling table and tier assignment
- A "Derived Progression Parameters" table the athlete fills in once from their tier — covering all parameters they will need to reference each session (load increment, sessions to confirm, time gate, hold threshold, regression trigger, volume increment, rest reduction, deload protocol, symptom trigger, min session gap, sRPE ceiling)

**Why this matters:** The tracking sheet was previously stateless relative to the athlete's readiness profile. Template 0 anchors all subsequent tracking to a consistent set of athlete-specific parameters, making the session logs quantitatively meaningful across different athletes.

---

## Change 10: Tracking Sheet — Template 3A Progression Gate Updated

**What changed:** The "Progression decision" field in Template 3A (Max Strength / Hangboard Log) was expanded from a simple checkbox to a three-gate check.

**New gate structure:**
1. Sessions at current load vs. required confirmation sessions (from Template 0)
2. Weeks since last load change vs. minimum time gate (from Template 0)
3. Most recent session RPE vs. hold threshold (from Template 0)

**Advance action now reads:** "+___% = +___ lb, rounded to nearest 0.25 kg" (tier percentage applied to current load) rather than "+___ lb" (fixed increment).

---

## Change 11: Tracking Sheet — Weekly Red Flags Updated

**What changed:** The red flags checklist in Template 2 was updated to include the tier-specific symptom deload trigger alongside the universal red flags, and added a weekly sRPE ceiling check.

---

## Change 12: Tracking Sheet — Template 0 Referenced Throughout "How to Use" Section

**What changed:** Template 0 was inserted into the template selection guides for all three plan variants and into the minimum viable tracking list (as item 1, before Template 1).

The note for the 4-day plan specifically flags that "Template 0 is especially critical — the 4-day plan's sRPE target (1,000-1,400) only applies to Tiers 4-5."

---

## What Was Not Changed

- The 12-week mesocycle structure (3 × 4-week blocks with deload at Weeks 4 and 8) remains unchanged
- Session content, drill sequencing, and time targets are unchanged
- The CAFS scoring system (ELS + CDS → round score → session score) is unchanged
- The critical-force block and intermittent hang protocols are unchanged
- The ordered variable progression hierarchy (volume → density → intensity) is preserved — only the magnitude of each step is now tier-keyed
- The assessment battery (max hang, intermittent endurance, CAFS baseline) is unchanged; it feeds the Performance Axis of the Profile Score System as defined in the original design

---

## Alignment Notes

The changes are deliberately designed to align the plans with the two primary recommendations from `load_progression_for_Power_endurance.md`:

1. **Replace time-based triggers with readiness-based progression** (RPE + RIR + margin-to-failure gate) — addressed by the hold threshold, regression trigger, and confirmation session logic.
2. **Express finger load step as percentage, not fixed kg, and make finger-load the slowest-progressing variable** — addressed by the tier-keyed percentage increments and the minimum calendar time gate that operates independently of session count.

The CruxTracker Profile Score System is the implementation vehicle for both recommendations. The plans now reference it directly rather than containing their own informal approximations.
