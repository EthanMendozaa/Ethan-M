// Deterministic PRNG so the demo world is identical on every load.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Normal-ish noise via sum of uniforms (Irwin–Hall, n=3).
export function makeNoise(rand) {
  return (mean = 0, spread = 1) =>
    mean + ((rand() + rand() + rand()) / 3 - 0.5) * 2 * spread
}
