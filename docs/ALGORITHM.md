# The Prescription Engine — Methodology

How the app turns the data it collects (set history, HRV, resting HR, sleep,
energy balance, per-muscle training load) into concrete, explainable
recommendations. Implemented in `src/lib/engine.js`; every rule carries a
citation, and every prescription carries its rationale into the UI.

Design principles:

1. **Deterministic and explainable.** No black box. The same inputs always
   produce the same output, and the user can always tap "Why?" and see the
   chain of reasoning with sources.
2. **Conservative magnitudes.** Where the literature reports a range, we take
   the cautious end. A wrong "+5 lb" costs a missed lift; a wrong "−10%"
   costs a slightly easy day.
3. **One signal, one job.** Each input adjusts one thing (load expectation,
   progression permission, or volume) so effects don't silently compound.

---

## 1. Estimating strength: e1RM

Every completed set maps to an estimated one-rep max so different rep ranges
compare on a common scale:

```
e1RM = load × (1 + effectiveReps / 30),  effectiveReps = min(12, reps + RIR)
```

- The base formula is Epley (1985), the most widely used linear rep-max
  model.
- Adding **reps in reserve** to the count treats a submaximal set as the max
  effort it corresponds to — RIR-based RPE is a validated intensity measure
  in trained lifters (Zourdos et al. 2016; Helms et al. 2016).
- Rep-max formulas lose accuracy past ~10-12 reps, so effective reps are
  capped at 12.

## 2. Progression: double progression, autoregulated by RIR

For each exercise, the engine looks at the best set of the most recent
session and applies, in order:

| Last top set | Prescription | Basis |
|---|---|---|
| RIR ≥ 3 | load +~2.5% (min one plate step) | RPE-based prescription tracks true intensity well (Helms 2018) |
| Target reps hit at RIR ≥ 1 | load +1 plate step | ACSM (2009): increase 2-10% once target reps are exceeded |
| Missed target by ≥2 reps, or RIR 0 | hold load, consolidate | Avoid progressing off a grinder (ACSM 2009) |
| Otherwise | same load, +1 rep | classic double progression |

Plate steps use each exercise's real-world increment (2.5 / 5 / 10 lb), so a
prescription is always loadable.

## 3. Daily readiness: HRV, sleep, energy

The engine computes a **day readiness level** (`push / normal / hold /
back-off`) and a small load-expectation modifier, from three signals:

**HRV band (Plews 2013; Vesterinen 2016; Kiviniemi 2007).** The 7-day
rolling HRV mean is compared to a 28-day baseline ± a smallest-worthwhile-
change band of 0.5 × baseline SD. Below the band → progression is banked,
not spent (`hold`, −2.5% expectation). Above → cleared to push (optional
extra set). HRV-guided training outperformed fixed programming in
randomized trials, which is why it gets veto power over progression.

**Last night's sleep (Craven 2022 meta-analysis; Knowles 2018).** Acute
sleep loss reduces next-day performance by roughly 3-8% depending on
severity. The engine applies a deliberately conservative version: < 6h →
−4% load expectation and `back-off`; 6-6.5h → −2%. (This is also baked
into the demo data: short-sleep nights precede ~7% weaker top sets, so the
Stats insight rediscovers the literature effect from the "wearable" data.)

**Energy deficit (Murphy & Koehler 2022; Helms 2014).** Strength is largely
defensible in a moderate deficit; deep sustained deficits (> ~600 kcal/day)
impair training quality and lean-mass retention. The trailing 7-day deficit
(TDEE estimate minus mean intake) > 600 kcal → −2.5% expectation and a
caution note. Protein adherence targets (160 g ≈ 2.4 g/kg lean mass) follow
Helms (2014).

**Muscle-level recovery (Damas 2016; see §4).** If a primary mover for
today's session is still flagged fatigued, readiness caps at `hold`.

Modifiers sum but are floored at −6%; a single bad signal never produces a
dramatic swing (principle 2).

## 4. Muscle recovery kinetics

Each working set deposits fatigue on its primary (1.0) and secondary (0.5)
muscles. Fatigue decays exponentially with τ = 26 h, reaching "fresh"
roughly 48-72 h after a normal session — consistent with the time-course of
myofibrillar protein synthesis and performance restoration after resistance
training (Damas 2016). The body map, the week-ahead schedule check, and the
readiness gate all read this one model.

## 5. Volume targets

Weekly per-muscle set targets (the MEV-MRV band on the volume screen,
10-20 sets for most groups) follow the hypertrophy dose-response literature:
clear benefits up to ~10 weekly sets and further, diminishing returns in
the 12-20 range (Schoenfeld 2017; Baz-Valle 2022).

## 6. Energy expenditure (TDEE)

```
TDEE = mean(intake, 14d) − Δ(trendWeight, 14d)/day × 3500
```

- Trend weight is an exponentially weighted moving average (α = 0.25) of
  daily scale weights, damping water/glycogen noise.
- 3500 kcal/lb (Wishnofsky 1958) is a knowing simplification — dynamic
  models (Hall 2008) show the true value varies with composition — but over
  a 14-day window against a smoothed trend it is a serviceable estimator,
  and it is the approach adaptive-TDEE apps use in practice.
- Displayed expenditure updates continuously; **coaching targets** move only
  at the weekly check-in, clamped to ±100 kcal, so the plan never whipsaws
  on noise.

## Limitations (read before trusting it further)

- e1RM formulas are population averages; individual rep-max relationships
  vary by lift and fiber type.
- Daily wrist-derived HRV is noisier than the morning-supine rMSSD used in
  the cited studies; the SWC band absorbs some but not all of that.
- The sleep and deficit adjustments are *expectations*, not measurements —
  they shape targets, and the logged sets remain the ground truth.
- The recovery τ is fixed; real recovery varies with volume, proximity to
  failure, muscle group and training age.
- In this mockup the engine runs on simulated data; magnitudes were chosen
  so the engine's outputs are visibly coherent with the seeded world.

## References

- ACSM (2009). *Progression models in resistance training for healthy adults.* Med Sci Sports Exerc 41(3).
- Baz-Valle E et al. (2022). *A systematic review of the effects of different resistance training volumes on muscle hypertrophy.* J Hum Kinet 81.
- Craven J et al. (2022). *Effects of acute sleep loss on physical performance: a systematic and meta-analytical review.* Sports Med 52.
- Damas F et al. (2016). *Resistance training-induced changes in integrated myofibrillar protein synthesis.* J Physiol 594(18).
- Epley B (1985). *Poundage chart.* Boyd Epley Workout, Lincoln NE.
- Hall KD (2008). *What is the required energy deficit per unit weight loss?* Int J Obes 32(3).
- Helms ER et al. (2014). *Evidence-based recommendations for natural bodybuilding contest preparation.* J Int Soc Sports Nutr 11:20.
- Helms ER et al. (2016). *Application of the repetitions-in-reserve-based RPE scale for resistance training.* Strength Cond J 38(4).
- Helms ER et al. (2018). *Self-rated accuracy of RPE-based load prescription in powerlifters.* J Strength Cond Res 32(10).
- Kiviniemi AM et al. (2007). *Endurance training guided individually by daily heart rate variability measurements.* Eur J Appl Physiol 101(6).
- Knowles OE et al. (2018). *Inadequate sleep and muscle strength: implications for resistance training.* J Sci Med Sport 21(9).
- Murphy C, Koehler K (2022). *Energy deficiency impairs resistance training gains in lean mass but not strength.* Scand J Med Sci Sports 32(1).
- Plews DJ et al. (2013). *Training adaptation and heart rate variability in elite endurance athletes.* Sports Med 43(9).
- Schoenfeld BJ et al. (2017). *Dose-response relationship between weekly resistance training volume and muscle hypertrophy.* J Sports Sci 35(11).
- Vesterinen V et al. (2016). *Individual endurance training prescription with heart rate variability.* Med Sci Sports Exerc 48(7).
- Wishnofsky M (1958). *Caloric equivalents of gained or lost weight.* Am J Clin Nutr 6(5).
- Zourdos MC et al. (2016). *Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve.* J Strength Cond Res 30(1).
