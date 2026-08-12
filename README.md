# Pulse — All-in-One Fitness App (Interactive Mockup)

An interactive UI mockup that merges the best of four reference apps into one
cross-learning system:

- **Bevel** → Recovery / Sleep / Strain / Stress dashboard from wearable data
- **STNDRD** → pre-built, week-by-week workout programs
- **Arrow** → XP/streaks, muscle recovery + weekly volume analytics
- **MacroFactor** → adaptive TDEE that updates from weigh-ins + logged intake

The differentiator: **each subsystem feeds the others** — recovery gates the
day's training suggestion, training volume moves the expenditure estimate, and
nutrition/energy balance shows up in recovery.

**This is a mockup.** It looks and flows real but runs entirely on 90 days of
seeded, deterministic mock data. No backend, no auth, no real APIs.

## Run it

```
npm i && npm run dev
```

Builds as a static site (`npm run build`) — deployable straight to Vercel.

The center **+** button is the quick-add hub: search a ~45-item food database
(with serving multipliers), scan/capture mocks, an offline "describe your
meal" macro estimator, meal templates (including generate-from-remaining-
macros), an activity logger, start-workout, and log-weigh-in.

## Try the cross-learning loops

1. **Today → Weigh-in:** enter a weight; watch the trend + TDEE nudge instantly
   (a toast shows the exact delta). Tap **Details →** for the full Weight
   screen: hero trend number, goal projection with estimated finish date,
   range-filtered chart, weigh-in streak, and a "drops" feed that celebrates
   every pound milestone crossed on the way down.
2. **Today → Readiness card:** the suggestion text is computed from today's
   recovery score (rest-day / reduced-volume / as-programmed / bonus-set).
3. **Train → Start session:** log sets (ghost values, docked rest timer, RIR,
   drop sets, superset tags), swap any exercise for a same-muscle alternative
   from the 70+ movement library, and load the bar with the interactive plate
   calculator. Finish to update muscle recovery, weekly volume, XP and streak.
4. **Train → Muscle map:** front/back body diagram with two modes — recovery
   (fresh / recovering / fatigued, with a "fresh by" ETA per muscle) and
   worked-this-week volume. The Week Ahead card projects each upcoming
   session against every muscle's recovery curve.
5. **Stats:** every insight card is *derived* from the seeded data — the
   correlations (short sleep → weaker top sets, volume ramp → higher TDEE,
   protein adherence → strength retention, deficit depth → HRV) are baked into
   the generator and computed back out.

## Where things live

| Path | What it is |
|---|---|
| `src/lib/seed.js` | Deterministic 90-day world generator (persona, correlations) |
| `src/lib/derived.js` | All the "intelligence": trend weight, TDEE, 4 scores, muscle recovery, readiness, e1RM, XP |
| `src/lib/insights.js` | Stats cards computed from the data (null if unsupported) |
| `src/lib/store.jsx` | Seed + localStorage overlay of user actions |
| `src/screens/` | Today, Nutrition, Train, Stats, Profile + WeightDetail overlay |
| `docs/PLAN.md` | Original build plan |
| `docs/DECISIONS.md` | Plan review — issues found and how they were resolved |

Stack: Vite + React, Tailwind CSS v4, Recharts. Dark theme, ~390px phone frame.

Anatomical body-map path data adapted from
[react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter)
(MIT © ELABBASSI Hicham).
