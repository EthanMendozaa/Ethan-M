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

// Weekly set targets per muscle group (MEV–MRV band for the volume chart).
export const VOLUME_BAND = {
  Chest: [10, 20],
  Back: [10, 22],
  Shoulders: [8, 20],
  Biceps: [8, 18],
  Triceps: [8, 18],
  Quads: [8, 18],
  Hamstrings: [6, 16],
  Glutes: [6, 16],
  Calves: [6, 14],
  Abs: [4, 12],
}

export const EXERCISES = {
  'Barbell Bench Press': { muscles: ['Chest', 'Triceps'], main: true, increment: 5 },
  'Incline DB Press': { muscles: ['Chest', 'Shoulders'], increment: 5 },
  'Cable Fly': { muscles: ['Chest'], increment: 2.5 },
  'Barbell Row': { muscles: ['Back', 'Biceps'], main: true, increment: 5 },
  'Lat Pulldown': { muscles: ['Back', 'Biceps'], increment: 5 },
  'Seated Cable Row': { muscles: ['Back'], increment: 5 },
  'Overhead Press': { muscles: ['Shoulders', 'Triceps'], main: true, increment: 2.5 },
  'Lateral Raise': { muscles: ['Shoulders'], increment: 2.5 },
  'Rear Delt Fly': { muscles: ['Shoulders'], increment: 2.5 },
  'EZ-Bar Curl': { muscles: ['Biceps'], increment: 2.5 },
  'Hammer Curl': { muscles: ['Biceps'], increment: 2.5 },
  'Cable Pushdown': { muscles: ['Triceps'], increment: 2.5 },
  'Overhead Extension': { muscles: ['Triceps'], increment: 2.5 },
  'Back Squat': { muscles: ['Quads', 'Glutes'], main: true, increment: 5 },
  'Romanian Deadlift': { muscles: ['Hamstrings', 'Glutes'], increment: 5 },
  'Leg Press': { muscles: ['Quads', 'Glutes'], increment: 10 },
  'Leg Curl': { muscles: ['Hamstrings'], increment: 5 },
  'Standing Calf Raise': { muscles: ['Calves'], increment: 5 },
  'Cable Crunch': { muscles: ['Abs'], increment: 2.5 },
  'Hanging Leg Raise': { muscles: ['Abs'], increment: 0 },
}

export const MAIN_LIFTS = ['Barbell Bench Press', 'Back Squat', 'Barbell Row', 'Overhead Press']

// Arnold split: 6 on / 1 off. Base sets ramp +1 on compounds in the second
// training block (drives the volume→expenditure insight).
export const ARNOLD_DAYS = [
  {
    name: 'Chest + Back',
    exercises: [
      { name: 'Barbell Bench Press', sets: 3, reps: 6, startLoad: 175 },
      { name: 'Incline DB Press', sets: 3, reps: 10, startLoad: 60 },
      { name: 'Cable Fly', sets: 3, reps: 12, startLoad: 42.5 },
      { name: 'Barbell Row', sets: 3, reps: 8, startLoad: 155 },
      { name: 'Lat Pulldown', sets: 3, reps: 10, startLoad: 140 },
      { name: 'Seated Cable Row', sets: 2, reps: 12, startLoad: 130 },
    ],
  },
  {
    name: 'Shoulders + Arms',
    exercises: [
      { name: 'Overhead Press', sets: 3, reps: 6, startLoad: 105 },
      { name: 'Lateral Raise', sets: 4, reps: 12, startLoad: 20 },
      { name: 'Rear Delt Fly', sets: 3, reps: 15, startLoad: 15 },
      { name: 'EZ-Bar Curl', sets: 3, reps: 10, startLoad: 70 },
      { name: 'Hammer Curl', sets: 2, reps: 12, startLoad: 30 },
      { name: 'Cable Pushdown', sets: 3, reps: 12, startLoad: 57.5 },
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
  },
]
