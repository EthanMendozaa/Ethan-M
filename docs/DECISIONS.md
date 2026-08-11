# Plan review — issues found & resolutions

Review of `PLAN.md` before building. Each issue is resolved in code; nothing here
changes the plan's scope (still a mockup: no backend, no auth, no real APIs).

## 1. TDEE timing contradiction

The plan says TDEE "updates weekly, clamp step size," but the acceptance checklist
requires a weigh-in to *visibly* update the TDEE card immediately.

**Resolution** (mirrors how MacroFactor behaves): the displayed **expenditure
estimate** recomputes continuously over a trailing 14-day window of intake +
trend-weight change, so every weigh-in nudges it. The **coaching targets** only
move at the weekly check-in, clamped to ±100 kcal. Both plan statements hold.

## 2. Incoherent example numbers

TDEE 2,410 with ~2,000 intake is a ~410 kcal/day deficit ≈ −0.8 lb/wk, but the
check-in example says "trending −1.5 lb/wk vs −1.2 target." Also −1.5 lb/wk at
146 lb is >1% bodyweight/week — aggressive for a lean lifter finishing a cut.

**Resolution:** the seed generates a coherent world — cut from ~158 → ~146 lb
across 90 days, intake ~2,050, true TDEE 2,480 → 2,620 (volume ramp), ≈ −0.9 to
−1.0 lb/wk — and every card **computes** its copy from the data instead of using
the plan's example strings. The weight curve is integrated from daily energy
balance, so weight, intake and TDEE can't disagree.

## 3. Only Recovery had a formula

Sleep, Strain and Stress scores were named but undefined.

**Resolution** (all in `src/lib/derived.js`):
- **Sleep** = duration vs 8h need (55%) + deep/REM share (30%) + continuity (15%)
- **Strain** = active kcal (45%) + zone minutes (25%) + working sets (30%) — a
  magnitude, not good/bad, and colored accordingly
- **Stress** = HRV depression (40%) + RHR elevation (30%) + sleep debt (20%) +
  skin-temp deviation (10%)
- **Recovery** = HRV vs 28-day baseline (45%) + RHR vs baseline (30%) + sleep (25%)

## 4. Insights must be baked into the seed

"Insight cards computed from the mock data, not hardcoded" only works if the
correlations actually exist in the data.

**Resolution:** the generator injects them — short-sleep nights (<6.5h) multiply
next-day top-set loads ×0.93; training block 2 (last ~6 weeks) adds sets while
true expenditure steps +140 kcal; protein noise centers on the 160g target;
deeper 7-day deficits depress HRV. `src/lib/insights.js` then *derives* the
numbers back out and returns `null` for any card the data doesn't support.

## 5. "TDEE vs volume overlay" implies a dual-axis chart

Two measures on two y-scales invite false correlation reading.

**Resolution:** rendered as two aligned small multiples sharing the weekly
x-axis (sets as bars, TDEE as a line, stacked).

## 6. localStorage staleness

Persisting the seeded world would make the demo one day stale every morning and
break on schema changes.

**Resolution:** the seed regenerates deterministically on every load, anchored
to *today*. Only user actions persist (weigh-ins, quick-added foods, today's
logged workout), under a versioned key. Profile has "Reset demo data." A logged
workout from a previous calendar day is dropped on load rather than pinned to
the wrong "today."

## 7. Determinism

`Math.random()` would reshuffle the world every refresh and the insight numbers
would wobble.

**Resolution:** mulberry32 PRNG with a fixed seed; noise is normal-ish
(Irwin–Hall). Same world on every load.

## 8. Small gaps filled with defaults

- **XP:** 10/set, +50 per PR; level = floor(√(XP/120)) + 1
- **Streak:** consecutive *scheduled* training days completed; rest days neutral
- **e1RM:** Epley on effective reps — load × (1 + (reps + RIR)/30)
- **MEV–MRV bands:** per-muscle weekly set ranges in `src/lib/programs.js`
- **Naming:** "Google Health API" branded as **Health Connect** in the UI
- **Muscle recovery decay:** exponential, τ = 26h (≈ fresh in 48–72h), with
  half-credit for secondary muscles
- **Readiness bands:** <55 → −20% volume / swap; 55–80 → as programmed; >80 →
  optional +1 set on the first lift (per plan)
