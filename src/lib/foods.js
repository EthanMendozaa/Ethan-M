// Food database for the add-food flows: search, quick add, templates,
// and the mock "describe it" AI estimator.

export const FOOD_DB = [
  // Protein
  { name: 'Chicken breast', emoji: '🍗', serving: '6 oz', kcal: 280, p: 52, c: 0, f: 6, cat: 'Protein' },
  { name: 'Salmon fillet', emoji: '🐟', serving: '6 oz', kcal: 350, p: 36, c: 0, f: 22, cat: 'Protein' },
  { name: 'Sirloin steak', emoji: '🥩', serving: '6 oz', kcal: 320, p: 46, c: 0, f: 14, cat: 'Protein' },
  { name: 'Ground turkey', emoji: '🦃', serving: '4 oz', kcal: 170, p: 22, c: 0, f: 9, cat: 'Protein' },
  { name: 'Eggs', emoji: '🥚', serving: '2 large', kcal: 140, p: 12, c: 1, f: 10, cat: 'Protein' },
  { name: 'Egg whites', emoji: '🍳', serving: '1 cup', kcal: 125, p: 26, c: 2, f: 0, cat: 'Protein' },
  { name: 'Greek yogurt', emoji: '🥛', serving: '1 cup', kcal: 150, p: 20, c: 8, f: 4, cat: 'Protein' },
  { name: 'Cottage cheese', emoji: '🧀', serving: '1 cup', kcal: 180, p: 25, c: 8, f: 5, cat: 'Protein' },
  { name: 'Whey shake', emoji: '🥤', serving: '1 scoop', kcal: 180, p: 32, c: 6, f: 3, cat: 'Protein' },
  { name: 'Protein bar', emoji: '🍫', serving: '1 bar', kcal: 210, p: 20, c: 22, f: 7, cat: 'Protein' },
  { name: 'Canned tuna', emoji: '🐠', serving: '1 can', kcal: 120, p: 26, c: 0, f: 1, cat: 'Protein' },
  { name: 'Shrimp', emoji: '🦐', serving: '6 oz', kcal: 170, p: 34, c: 1, f: 2, cat: 'Protein' },
  { name: 'Tofu', emoji: '🍲', serving: '1 cup', kcal: 180, p: 20, c: 5, f: 10, cat: 'Protein' },
  // Carbs
  { name: 'White rice', emoji: '🍚', serving: '1 cup', kcal: 205, p: 4, c: 45, f: 0, cat: 'Carbs' },
  { name: 'Brown rice', emoji: '🍘', serving: '1 cup', kcal: 215, p: 5, c: 45, f: 2, cat: 'Carbs' },
  { name: 'Oatmeal', emoji: '🥣', serving: '1 cup', kcal: 160, p: 6, c: 27, f: 3, cat: 'Carbs' },
  { name: 'Banana', emoji: '🍌', serving: '1 medium', kcal: 105, p: 1, c: 27, f: 0, cat: 'Carbs' },
  { name: 'Apple', emoji: '🍎', serving: '1 medium', kcal: 95, p: 0, c: 25, f: 0, cat: 'Carbs' },
  { name: 'Mixed berries', emoji: '🫐', serving: '1 cup', kcal: 70, p: 1, c: 17, f: 0, cat: 'Carbs' },
  { name: 'Sweet potato', emoji: '🍠', serving: '1 medium', kcal: 180, p: 4, c: 41, f: 0, cat: 'Carbs' },
  { name: 'Pasta', emoji: '🍝', serving: '1 cup', kcal: 220, p: 8, c: 43, f: 1, cat: 'Carbs' },
  { name: 'Sourdough bread', emoji: '🍞', serving: '2 slices', kcal: 180, p: 7, c: 36, f: 1, cat: 'Carbs' },
  { name: 'Bagel', emoji: '🥯', serving: '1 whole', kcal: 280, p: 11, c: 56, f: 2, cat: 'Carbs' },
  { name: 'Tortilla', emoji: '🫓', serving: '1 large', kcal: 140, p: 4, c: 24, f: 3, cat: 'Carbs' },
  // Fats
  { name: 'Avocado', emoji: '🥑', serving: '1/2', kcal: 120, p: 1, c: 6, f: 11, cat: 'Fats' },
  { name: 'Peanut butter', emoji: '🥜', serving: '2 tbsp', kcal: 190, p: 8, c: 7, f: 16, cat: 'Fats' },
  { name: 'Almonds', emoji: '🌰', serving: '1 oz', kcal: 165, p: 6, c: 6, f: 14, cat: 'Fats' },
  { name: 'Olive oil', emoji: '🫒', serving: '1 tbsp', kcal: 120, p: 0, c: 0, f: 14, cat: 'Fats' },
  { name: 'Cheddar cheese', emoji: '🧀', serving: '1 oz', kcal: 115, p: 7, c: 0, f: 9, cat: 'Fats' },
  // Meals
  { name: 'Chicken burrito bowl', emoji: '🌯', serving: '1 bowl', kcal: 620, p: 46, c: 68, f: 18, cat: 'Meals' },
  { name: 'Turkey club wrap', emoji: '🥪', serving: '1 wrap', kcal: 540, p: 38, c: 52, f: 20, cat: 'Meals' },
  { name: 'Salmon rice bowl', emoji: '🍱', serving: '1 bowl', kcal: 700, p: 48, c: 62, f: 26, cat: 'Meals' },
  { name: 'Chicken stir-fry', emoji: '🥡', serving: '1 plate', kcal: 650, p: 45, c: 60, f: 22, cat: 'Meals' },
  { name: 'Cheeseburger', emoji: '🍔', serving: '1 burger', kcal: 550, p: 30, c: 42, f: 28, cat: 'Meals' },
  { name: 'Pepperoni pizza', emoji: '🍕', serving: '2 slices', kcal: 570, p: 24, c: 66, f: 22, cat: 'Meals' },
  { name: 'Salmon sushi', emoji: '🍣', serving: '8 pieces', kcal: 350, p: 22, c: 52, f: 6, cat: 'Meals' },
  { name: 'Chicken caesar salad', emoji: '🥗', serving: '1 bowl', kcal: 430, p: 40, c: 14, f: 24, cat: 'Meals' },
  // Snacks
  { name: 'Ice cream', emoji: '🍨', serving: '1 cup', kcal: 280, p: 5, c: 34, f: 14, cat: 'Snacks' },
  { name: 'Dark chocolate', emoji: '🍩', serving: '1 oz', kcal: 170, p: 2, c: 13, f: 12, cat: 'Snacks' },
  { name: 'Rice cakes', emoji: '🍙', serving: '2 cakes', kcal: 70, p: 1, c: 15, f: 0, cat: 'Snacks' },
  { name: 'Tortilla chips', emoji: '🌮', serving: '1 oz', kcal: 140, p: 2, c: 19, f: 7, cat: 'Snacks' },
  { name: 'Hummus & pita', emoji: '🧆', serving: '1 serving', kcal: 260, p: 9, c: 36, f: 9, cat: 'Snacks' },
  { name: 'Trail mix', emoji: '🥨', serving: '1/4 cup', kcal: 175, p: 5, c: 16, f: 11, cat: 'Snacks' },
]

// Fiber grams per serving (foods not listed are ~0)
const FIBER = {
  Oatmeal: 4,
  Banana: 3.1,
  Apple: 4.4,
  'Mixed berries': 4,
  'Sweet potato': 3.9,
  'Brown rice': 3.5,
  'White rice': 0.6,
  Pasta: 2.5,
  'Sourdough bread': 1.9,
  Bagel: 2.1,
  Tortilla: 1.4,
  Avocado: 5,
  'Peanut butter': 1.9,
  Almonds: 3.5,
  'Chicken burrito bowl': 9,
  'Turkey club wrap': 4,
  'Salmon rice bowl': 4.5,
  'Chicken stir-fry': 5,
  Cheeseburger: 2,
  'Pepperoni pizza': 3,
  'Salmon sushi': 2,
  'Chicken caesar salad': 3,
  'Hummus & pita': 4.5,
  'Trail mix': 2.2,
  'Rice cakes': 0.6,
  'Tortilla chips': 1.2,
  'Protein bar': 3,
  Tofu: 1.9,
}
for (const food of FOOD_DB) food.fiber = FIBER[food.name] ?? 0

export const FIBER_TARGET = 33

export const CATEGORIES = ['All', 'Protein', 'Carbs', 'Fats', 'Meals', 'Snacks']

export const RECENT_FOODS = [
  'Whey shake',
  'Chicken burrito bowl',
  'Greek yogurt',
  'Banana',
  'White rice',
  'Eggs',
]

export const MEAL_TEMPLATES = [
  {
    name: 'Usual breakfast',
    emoji: '🌅',
    items: ['Greek yogurt', 'Eggs', 'Oatmeal'],
  },
  {
    name: 'Post-workout',
    emoji: '💪',
    items: ['Whey shake', 'Banana', 'Rice cakes'],
  },
  {
    name: 'Cutting dinner',
    emoji: '🌙',
    items: ['Chicken breast', 'White rice', 'Mixed berries'],
  },
]

export function foodByName(name) {
  return FOOD_DB.find((f) => f.name === name)
}

export function templateTotals(template) {
  const items = template.items.map(foodByName)
  return {
    kcal: items.reduce((s, f) => s + f.kcal, 0),
    p: items.reduce((s, f) => s + f.p, 0),
    c: items.reduce((s, f) => s + f.c, 0),
    f: items.reduce((s, f) => s + f.f, 0),
  }
}

// Mock "AI" estimator: keyword-match the description against known
// components and sum their macros. Deterministic, offline, plausible.
const KEYWORDS = [
  ['chicken', 250, 40, 0, 8],
  ['turkey', 180, 24, 0, 8],
  ['steak', 320, 46, 0, 14],
  ['beef', 280, 30, 0, 18],
  ['salmon', 350, 36, 0, 22],
  ['fish', 220, 30, 0, 8],
  ['shrimp', 170, 34, 1, 2],
  ['egg', 140, 12, 1, 10],
  ['rice', 205, 4, 45, 0],
  ['beans', 120, 8, 22, 1],
  ['guac', 150, 2, 8, 13],
  ['avocado', 120, 1, 6, 11],
  ['cheese', 115, 7, 1, 9],
  ['tortilla', 140, 4, 24, 3],
  ['burrito', 300, 12, 45, 8],
  ['wrap', 200, 6, 34, 5],
  ['bread', 90, 4, 18, 1],
  ['toast', 90, 4, 18, 1],
  ['pasta', 220, 8, 43, 1],
  ['pizza', 285, 12, 33, 11],
  ['burger', 550, 30, 42, 28],
  ['fries', 320, 4, 42, 15],
  ['salad', 80, 3, 8, 4],
  ['potato', 160, 4, 37, 0],
  ['oat', 160, 6, 27, 3],
  ['banana', 105, 1, 27, 0],
  ['yogurt', 150, 20, 8, 4],
  ['shake', 180, 32, 6, 3],
  ['peanut', 190, 8, 7, 16],
  ['ice cream', 280, 5, 34, 14],
  ['chocolate', 170, 2, 13, 12],
]

export function estimateFromDescription(text) {
  const lower = text.toLowerCase()
  const matched = KEYWORDS.filter(([kw]) => lower.includes(kw))
  const base = matched.length
    ? matched.reduce(
        (acc, [, kcal, p, c, f]) => ({
          kcal: acc.kcal + kcal,
          p: acc.p + p,
          c: acc.c + c,
          f: acc.f + f,
        }),
        { kcal: 0, p: 0, c: 0, f: 0 },
      )
    : { kcal: 350, p: 15, c: 40, f: 14 }
  const name = text.trim().slice(0, 34) || 'Described meal'
  return {
    name: name[0].toUpperCase() + name.slice(1),
    ...base,
    components: matched.map(([kw]) => kw),
  }
}

// Compose a meal from the database to fit the user's remaining macros:
// protein sources first, then carbs to fill the calorie gap.
export function generateMealForMacros(remaining) {
  const items = []
  let kcal = Math.max(0, remaining.kcal)
  let protein = Math.max(0, remaining.protein)
  const proteinPool = ['Chicken breast', 'Greek yogurt', 'Whey shake', 'Egg whites']
  const carbPool = ['White rice', 'Sweet potato', 'Banana', 'Mixed berries']
  let pi = 0
  while (protein > 20 && kcal > 150 && items.length < 3) {
    const food = foodByName(proteinPool[pi % proteinPool.length])
    items.push(food)
    protein -= food.p
    kcal -= food.kcal
    pi += 1
  }
  let ci = 0
  while (kcal > 180 && items.length < 5) {
    const food = foodByName(carbPool[ci % carbPool.length])
    items.push(food)
    kcal -= food.kcal
    ci += 1
  }
  return items
}
