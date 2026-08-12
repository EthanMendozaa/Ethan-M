// STNDRD-style pre-built program library. The Arnold Split is the demo user's
// active program and drives the seeded training history.

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
]

// Weekly hard-set targets per muscle group. Low-volume / high-intensity
// posture: a handful of sets taken close to failure beats accumulating
// half-effort volume (Androulakis-Korakakis 2020; Iversen 2021).
export const VOLUME_BAND = {
  Chest: [5, 12],
  Back: [6, 14],
  Shoulders: [4, 10],
  Biceps: [3, 8],
  Triceps: [3, 8],
  Quads: [4, 10],
  Hamstrings: [3, 8],
  Glutes: [3, 8],
  Calves: [3, 8],
  Abs: [3, 8],
}

// Exercise database: ~60 movements across every group. `defaultLoad` seeds a
// sensible working weight for the demo persona when swapping mid-workout.
export const EXERCISES = {
  // Chest
  'Barbell Bench Press': { muscles: ['Chest', 'Triceps'], main: true, increment: 5, defaultLoad: 175, equipment: 'barbell' },
  'Incline Barbell Press': { muscles: ['Chest', 'Shoulders'], increment: 5, defaultLoad: 135, equipment: 'barbell' },
  'Incline DB Press': { muscles: ['Chest', 'Shoulders'], increment: 5, defaultLoad: 60, equipment: 'dumbbell' },
  'DB Bench Press': { muscles: ['Chest', 'Triceps'], increment: 5, defaultLoad: 65, equipment: 'dumbbell' },
  'Cable Fly': { muscles: ['Chest'], increment: 2.5, defaultLoad: 42.5, equipment: 'cable' },
  'Low-to-High Cable Fly': { muscles: ['Chest'], increment: 2.5, defaultLoad: 35, equipment: 'cable' },
  'Pec Deck': { muscles: ['Chest'], increment: 5, defaultLoad: 120, equipment: 'machine' },
  'Machine Chest Press': { muscles: ['Chest', 'Triceps'], increment: 5, defaultLoad: 140, equipment: 'machine' },
  'Weighted Dip': { muscles: ['Chest', 'Triceps'], increment: 2.5, defaultLoad: 25, equipment: 'bodyweight' },
  'Push-Up': { muscles: ['Chest', 'Triceps'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  // Back
  'Barbell Row': { muscles: ['Back', 'Biceps'], main: true, increment: 5, defaultLoad: 155, equipment: 'barbell' },
  'T-Bar Row': { muscles: ['Back', 'Biceps'], increment: 5, defaultLoad: 115, equipment: 'barbell' },
  'Lat Pulldown': { muscles: ['Back', 'Biceps'], increment: 5, defaultLoad: 140, equipment: 'cable' },
  'Seated Cable Row': { muscles: ['Back'], increment: 5, defaultLoad: 130, equipment: 'cable' },
  'Chest-Supported Row': { muscles: ['Back'], increment: 5, defaultLoad: 90, equipment: 'machine' },
  'Single-Arm DB Row': { muscles: ['Back', 'Biceps'], increment: 5, defaultLoad: 75, equipment: 'dumbbell' },
  'Meadows Row': { muscles: ['Back'], increment: 5, defaultLoad: 70, equipment: 'barbell' },
  'Straight-Arm Pulldown': { muscles: ['Back'], increment: 2.5, defaultLoad: 50, equipment: 'cable' },
  'Pull-Up': { muscles: ['Back', 'Biceps'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  'Weighted Pull-Up': { muscles: ['Back', 'Biceps'], increment: 2.5, defaultLoad: 25, equipment: 'bodyweight' },
  'Rack Pull': { muscles: ['Back', 'Glutes'], increment: 10, defaultLoad: 275, equipment: 'barbell' },
  // Shoulders
  'Overhead Press': { muscles: ['Shoulders', 'Triceps'], main: true, increment: 2.5, defaultLoad: 105, equipment: 'barbell' },
  'Seated DB Press': { muscles: ['Shoulders', 'Triceps'], increment: 5, defaultLoad: 50, equipment: 'dumbbell' },
  'Arnold Press': { muscles: ['Shoulders'], increment: 5, defaultLoad: 45, equipment: 'dumbbell' },
  'Machine Shoulder Press': { muscles: ['Shoulders', 'Triceps'], increment: 5, defaultLoad: 90, equipment: 'machine' },
  'Lateral Raise': { muscles: ['Shoulders'], increment: 2.5, defaultLoad: 20, equipment: 'dumbbell' },
  'Cable Lateral Raise': { muscles: ['Shoulders'], increment: 2.5, defaultLoad: 15, equipment: 'cable' },
  'Rear Delt Fly': { muscles: ['Shoulders'], increment: 2.5, defaultLoad: 15, equipment: 'dumbbell' },
  'Face Pull': { muscles: ['Shoulders', 'Back'], increment: 2.5, defaultLoad: 47.5, equipment: 'cable' },
  'Upright Row': { muscles: ['Shoulders', 'Biceps'], increment: 2.5, defaultLoad: 65, equipment: 'barbell' },
  // Biceps
  'EZ-Bar Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 70, equipment: 'barbell' },
  'Hammer Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 30, equipment: 'dumbbell' },
  'Incline DB Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 25, equipment: 'dumbbell' },
  'Preacher Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 55, equipment: 'machine' },
  'Cable Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 50, equipment: 'cable' },
  'Concentration Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 25, equipment: 'dumbbell' },
  'Spider Curl': { muscles: ['Biceps'], increment: 2.5, defaultLoad: 40, equipment: 'barbell' },
  // Triceps
  'Cable Pushdown': { muscles: ['Triceps'], increment: 2.5, defaultLoad: 57.5, equipment: 'cable' },
  'Overhead Extension': { muscles: ['Triceps'], increment: 2.5, defaultLoad: 45, equipment: 'cable' },
  'Skull Crusher': { muscles: ['Triceps'], increment: 2.5, defaultLoad: 60, equipment: 'barbell' },
  'Close-Grip Bench': { muscles: ['Triceps', 'Chest'], increment: 5, defaultLoad: 135, equipment: 'barbell' },
  'Dip': { muscles: ['Triceps', 'Chest'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  'Cross-Body Extension': { muscles: ['Triceps'], increment: 2.5, defaultLoad: 25, equipment: 'cable' },
  'JM Press': { muscles: ['Triceps'], increment: 5, defaultLoad: 95, equipment: 'barbell' },
  // Quads
  'Back Squat': { muscles: ['Quads', 'Glutes'], main: true, increment: 5, defaultLoad: 225, equipment: 'barbell' },
  'Front Squat': { muscles: ['Quads', 'Abs'], increment: 5, defaultLoad: 155, equipment: 'barbell' },
  'Hack Squat': { muscles: ['Quads', 'Glutes'], increment: 10, defaultLoad: 230, equipment: 'machine' },
  'Leg Press': { muscles: ['Quads', 'Glutes'], increment: 10, defaultLoad: 360, equipment: 'machine' },
  'Leg Extension': { muscles: ['Quads'], increment: 5, defaultLoad: 110, equipment: 'machine' },
  'Bulgarian Split Squat': { muscles: ['Quads', 'Glutes'], increment: 2.5, defaultLoad: 40, equipment: 'dumbbell' },
  'Goblet Squat': { muscles: ['Quads', 'Glutes'], increment: 5, defaultLoad: 60, equipment: 'dumbbell' },
  'Walking Lunge': { muscles: ['Quads', 'Glutes'], increment: 2.5, defaultLoad: 35, equipment: 'dumbbell' },
  // Hamstrings
  'Romanian Deadlift': { muscles: ['Hamstrings', 'Glutes'], increment: 5, defaultLoad: 185, equipment: 'barbell' },
  'Stiff-Leg Deadlift': { muscles: ['Hamstrings', 'Glutes'], increment: 5, defaultLoad: 165, equipment: 'barbell' },
  'Leg Curl': { muscles: ['Hamstrings'], increment: 5, defaultLoad: 90, equipment: 'machine' },
  'Seated Leg Curl': { muscles: ['Hamstrings'], increment: 5, defaultLoad: 100, equipment: 'machine' },
  'Good Morning': { muscles: ['Hamstrings', 'Back'], increment: 5, defaultLoad: 95, equipment: 'barbell' },
  'Nordic Curl': { muscles: ['Hamstrings'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  // Glutes
  'Hip Thrust': { muscles: ['Glutes', 'Hamstrings'], increment: 10, defaultLoad: 225, equipment: 'barbell' },
  'Sumo Deadlift': { muscles: ['Glutes', 'Hamstrings'], increment: 10, defaultLoad: 205, equipment: 'barbell' },
  'Cable Kickback': { muscles: ['Glutes'], increment: 2.5, defaultLoad: 20, equipment: 'cable' },
  'Reverse Lunge': { muscles: ['Glutes', 'Quads'], increment: 2.5, defaultLoad: 40, equipment: 'dumbbell' },
  // Calves
  'Standing Calf Raise': { muscles: ['Calves'], increment: 5, defaultLoad: 180, equipment: 'machine' },
  'Seated Calf Raise': { muscles: ['Calves'], increment: 5, defaultLoad: 115, equipment: 'machine' },
  'Leg-Press Calf Raise': { muscles: ['Calves'], increment: 10, defaultLoad: 200, equipment: 'machine' },
  'Single-Leg Calf Raise': { muscles: ['Calves'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  // Abs
  'Cable Crunch': { muscles: ['Abs'], increment: 2.5, defaultLoad: 60, equipment: 'cable' },
  'Hanging Leg Raise': { muscles: ['Abs'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  'Ab Wheel': { muscles: ['Abs'], increment: 0, defaultLoad: 0, equipment: 'bodyweight' },
  'Decline Sit-Up': { muscles: ['Abs'], increment: 2.5, defaultLoad: 15, equipment: 'bodyweight' },
  'Weighted Plank': { muscles: ['Abs'], increment: 2.5, defaultLoad: 25, equipment: 'bodyweight' },
  'Russian Twist': { muscles: ['Abs'], increment: 2.5, defaultLoad: 25, equipment: 'dumbbell' },
}

// Alternatives sharing the same primary muscle — same-equipment options first.
export function alternativesFor(name, limit = 6) {
  const ex = EXERCISES[name]
  if (!ex) return []
  const primary = ex.muscles[0]
  return Object.entries(EXERCISES)
    .filter(([n, meta]) => n !== name && meta.muscles[0] === primary)
    .sort(([, a], [, b]) => {
      const sameA = a.equipment === ex.equipment ? 0 : 1
      const sameB = b.equipment === ex.equipment ? 0 : 1
      return sameA - sameB
    })
    .slice(0, limit)
    .map(([n, meta]) => ({ name: n, ...meta }))
}

export const MAIN_LIFTS = ['Barbell Bench Press', 'Back Squat', 'Barbell Row', 'Overhead Press']

// Arnold split: 6 on / 1 off. Base sets ramp +1 on compounds in the second
// training block (drives the volume→expenditure insight).
export const ARNOLD_DAYS = [
  {
    name: 'Chest + Back',
    exercises: [
      // Arnold's signature chest/back supersets
      { name: 'Barbell Bench Press', sets: 3, reps: 6, startLoad: 175, superset: 'A' },
      { name: 'Barbell Row', sets: 3, reps: 8, startLoad: 155, superset: 'A' },
      { name: 'Incline DB Press', sets: 3, reps: 10, startLoad: 60, superset: 'B' },
      { name: 'Lat Pulldown', sets: 3, reps: 10, startLoad: 140, superset: 'B' },
      { name: 'Cable Fly', sets: 3, reps: 12, startLoad: 42.5 },
      { name: 'Seated Cable Row', sets: 2, reps: 12, startLoad: 130 },
    ],
  },
  {
    name: 'Shoulders + Arms',
    exercises: [
      { name: 'Overhead Press', sets: 3, reps: 6, startLoad: 105 },
      { name: 'Lateral Raise', sets: 4, reps: 12, startLoad: 20, superset: 'A' },
      { name: 'Rear Delt Fly', sets: 3, reps: 15, startLoad: 15, superset: 'A' },
      { name: 'EZ-Bar Curl', sets: 3, reps: 10, startLoad: 70, superset: 'B' },
      { name: 'Cable Pushdown', sets: 3, reps: 12, startLoad: 57.5, superset: 'B' },
      { name: 'Hammer Curl', sets: 2, reps: 12, startLoad: 30 },
      { name: 'Overhead Extension', sets: 2, reps: 12, startLoad: 45 },
    ],
  },
  {
    name: 'Legs',
    exercises: [
      { name: 'Back Squat', sets: 3, reps: 6, startLoad: 225 },
      { name: 'Romanian Deadlift', sets: 3, reps: 8, startLoad: 185 },
      { name: 'Leg Press', sets: 3, reps: 10, startLoad: 360 },
      { name: 'Leg Curl', sets: 3, reps: 12, startLoad: 90 },
      { name: 'Standing Calf Raise', sets: 4, reps: 12, startLoad: 180 },
      { name: 'Cable Crunch', sets: 3, reps: 15, startLoad: 60 },
    ],
  },
]

export const PROGRAMS = [
  {
    id: 'arnold-split',
    name: 'Arnold Split',
    tagline: 'The classic golden-era 6-day body-part split',
    weeks: 12,
    daysPerWeek: 6,
    level: 'Advanced',
    goal: 'Hypertrophy',
    accent: 'series-2',
    sampleDay: {
      title: 'Chest + Back',
      exercises: ['Barbell Bench Press', 'Barbell Row', 'Incline DB Press', 'Lat Pulldown', 'Cable Fly', 'Seated Cable Row'],
    },
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    tagline: 'Balanced 6-day rotation for size and strength',
    weeks: 10,
    daysPerWeek: 6,
    level: 'Intermediate',
    goal: 'Hypertrophy',
    accent: 'series-1',
    sampleDay: {
      title: 'Push A',
      exercises: ['Incline Barbell Press', 'Machine Shoulder Press', 'Weighted Dip', 'Cable Lateral Raise', 'Skull Crusher', 'Cross-Body Extension'],
    },
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    tagline: 'Four focused days, plenty of recovery',
    weeks: 8,
    daysPerWeek: 4,
    level: 'Beginner',
    goal: 'Strength',
    accent: 'series-3',
    sampleDay: {
      title: 'Upper 1',
      exercises: ['DB Bench Press', 'Chest-Supported Row', 'Seated DB Press', 'Lat Pulldown', 'Cable Curl', 'Cable Pushdown'],
    },
  },
  {
    id: 'powerbuilding',
    name: 'Powerbuilding',
    tagline: 'Heavy top sets, hypertrophy back-offs',
    weeks: 12,
    daysPerWeek: 5,
    level: 'Advanced',
    goal: 'Strength + Size',
    accent: 'series-4',
    sampleDay: {
      title: 'Squat day',
      exercises: ['Back Squat', 'Hack Squat', 'Bulgarian Split Squat', 'Leg Extension', 'Seated Leg Curl', 'Weighted Plank'],
    },
  },
  {
    id: 'home-minimal',
    name: 'Home / Minimal Equipment',
    tagline: 'Dumbbells and a band — no excuses',
    weeks: 6,
    daysPerWeek: 3,
    level: 'Beginner',
    goal: 'General Fitness',
    accent: 'series-5',
    sampleDay: {
      title: 'Full body A',
      exercises: ['Goblet Squat', 'Push-Up', 'Single-Arm DB Row', 'Walking Lunge', 'Hammer Curl', 'Russian Twist'],
    },
  },
]
