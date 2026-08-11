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

## Try the cross-learning loops

1. **Today → Weigh-in:** enter a weight; watch the trend + TDEE nudge instantly
   (a toast shows the exact delta).
2. **Today → Readiness card:** the suggestion text is computed from today's
   recovery score (rest-day / reduced-volume / as-programmed / bonus-set).
3. **Train → Start session:** log sets (ghost values, rest timer, plate
   calculator, RIR), finish, and watch muscle recovery, weekly volume, XP and
   streak update.
4. **Stats:** every insight card is *derived* from the seeded data — the
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
| `src/screens/` | Today, Nutrition, Train, Stats, Profile |
| `docs/PLAN.md` | Original build plan |
| `docs/DECISIONS.md` | Plan review — issues found and how they were resolved |

Stack: Vite + React, Tailwind CSS v4, Recharts. Dark theme, ~390px phone frame.
