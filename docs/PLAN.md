# All-In-One Fitness App — Mockup Build Plan (Claude Code Handoff)

## What we're building
An interactive UI mockup of an all-in-one fitness app that merges the best of four reference apps into one cross-learning system:

- **Bevel** → modern health dashboard: Recovery / Sleep / Strain / Stress scores computed from wearable data
- **STNDRD** → pre-baked, structured workout programs (human-authored style, week-by-week)
- **Arrow** → engagement layer: XP/streaks, muscle recovery chart, weekly muscle growth (sets per group) chart
- **MacroFactor** → adaptive nutrition: smart TDEE that auto-updates calories/macros from daily weigh-ins + logged intake

The differentiator to showcase: **each subsystem feeds the others** (recovery → workout suggestions, training load → TDEE, nutrition/energy balance → recovery insights).

This is a **mockup**: looks and flows real, runs entirely on seeded mock data + simple deterministic logic. No real APIs, no auth, no backend.

## Tech & delivery
- Vite + React SPA, Tailwind, recharts for charts
- Mobile-first: render the app inside a ~390px phone frame centered on desktop
- Dark theme default; Bevel/Whoop-level polish — big scores, rings, sparklines, minimal chrome
- All state local (in-memory + localStorage is fine); deployable as a static site to Vercel
- `npm i && npm run dev` must just work

## Navigation — bottom tab bar (5 tabs)
1. **Today** (dashboard)
2. **Nutrition**
3. **Train** (center, prominent)
4. **Stats**
5. **Profile**

## Screens

### 1. Today — Bevel-style dashboard
- Header: date, greeting, sync chip ("Fitbit via Google Health · synced 8:02 AM" — cosmetic)
- Four score cards: **Recovery, Sleep, Strain, Stress** (0–100, colored ring, 7-day sparkline, tap → explain sheet)
- **Readiness → Training card (cross-learning #1):** e.g. "Recovery 84 — green light for today's Legs session" or "HRV down 12% vs baseline — suggest −20% volume or swap to Arms"
- Vitals row: resting HR, HRV, SpO2, respiratory rate, skin temp Δ
- Activity: steps ring (15k goal), active calories, zone minutes
- **Weigh-in card:** quick-add today's weight; shows scale weight vs smoothed trend weight; entering a weight visibly nudges the trend + TDEE

### 2. Nutrition — MacroFactor-style
- Targets header: kcal remaining + protein/carb/fat bars
- **Expenditure card:** current TDEE estimate (e.g. "2,410 kcal ↗") + line chart of TDEE over time + caption "estimated from your last 14 days of weigh-ins and intake"
- Food log timeline: meals with mock foods, quick-add, barcode icon (non-functional affordance)
- **Weekly coaching check-in card:** old targets → new targets with a reason ("trending −1.5 lb/wk vs −1.2 target → +90 kcal")
- Phase banner: Cut / Maintain / Bulk with target rate of change
- Weight chart: scale-weight dots + smoothed trend line

### 3. Train — STNDRD programs + Arrow engagement
- **Program library:** pre-built program cards — PPL, Arnold Split, Upper/Lower, Powerbuilding, Home/Minimal Equipment. Tags: weeks, days/week, level, goal
- Active program view: week overview + today's session
- **Logging screen:** exercises with sets × reps × weight + RIR, previous-session ghost values, rest timer, plate calculator, drop set/superset tags, satisfying set-complete check
- Post-workout summary: total volume, PRs, XP gained, streak
- **Arrow-style analytics:** Muscle Recovery view (per muscle group: fresh / recovering / fatigued) and Weekly Muscle Growth chart (sets per group vs an MEV–MRV target band)

### 4. Stats — the cross-learning showcase (make this the wow screen)
- Unified score (placeholder name fine): one number blending training consistency, nutrition adherence, recovery
- **Insight cards computed from the mock data, not hardcoded strings**, e.g.:
  - "Nights under 6.5h sleep → top-set loads drop ~7%"
  - "Training volume +18% this block → expenditure +140 kcal"
  - "Protein adherence 92% during cut → strength holding steady"
- Explorable charts: TDEE vs weekly training volume overlay; HRV vs deficit depth; e1RM trends per main lift; sleep consistency

### 5. Profile
- Goals: phase, rate, goal weight
- **Integrations:** "Google Health (Fitbit) — Connected ✓" with the full datapoint list as toggles (see data model), plus Apple Health and Manual as disconnected options
- Program settings, units, notification stubs

## Mock data model
Seed ~90 days of daily data for one demo user so every chart looks lived-in.

**Demo persona:** male, 5'10", ~146 lb, cutting at ~2,000 kcal avg, Arnold split 6 days/week (Chest+Back / Shoulders+Arms / Legs), ~15k steps/day, goal: finish cut → lean bulk toward 160 lb.

**Wearable stream — mirror Google Health API data types (we plan to use all of them):** steps, distance, floors, active calories, total calories, heart rate (resting + intraday summary), HRV, sleep sessions with stages (deep/light/REM/awake), SpO2, respiratory rate, skin temperature variation, active zone minutes, VO2max estimate, weight, body fat %, exercise sessions.

**Nutrition stream:** daily kcal + macros, meal entries, adherence %.

**Training stream:** sessions → exercises → sets (reps, load, RIR); weekly volume per muscle group; e1RM per main lift.

**Derived values (fake the intelligence with simple deterministic rules in one module):**
- `trendWeight` = EWMA (α ≈ 0.25) of scale weights
- `TDEE` = mean intake − (Δ trend weight/day × 3500), trailing 14 days; update weekly, clamp step size
- `recovery` = weighted blend of HRV vs baseline, resting HR vs baseline, sleep score
- Per-muscle recovery decays over ~48–72h after volume for that group
- Readiness rule: recovery < 55 → suggest −20% volume or session swap; > 80 → green light (+1 optional set on first lift)
- Bake plausible correlations into the seed data so the Stats insights are derivable

## UX principles
- Every "smart" number gets a tap-to-open "Why did this change?" sheet — transparency is a core product value
- Logging must feel fast and tactile (steppers, ghost values, one-tap repeats)
- Gamification stays subtle (streak chip, XP toast) — not childish

## Out of scope
Real OAuth / Google Health calls, real food database or barcode scanning, accounts, backend, push notifications, Android/iOS native code. All local, all mock.

## Acceptance checklist
- [ ] 5 tabs navigable; every screen populated with coherent mock data
- [ ] Adding a weigh-in visibly updates trend weight and the TDEE card
- [ ] Completing a mock workout updates muscle recovery + weekly volume charts and grants XP
- [ ] Readiness card changes its suggestion based on that day's recovery score
- [ ] ≥3 Stats insight cards computed from the data
- [ ] Builds clean and deploys as a static site to Vercel
