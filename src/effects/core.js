export const CONFETTI = ['#ffd23a', '#f5f0e6', '#d81c2a', '#ffb02a', '#ffffff', '#c8a050', '#2de2ff'];

export function shardGeometry(GFX) {
  // A thin, irregular sliver: four points, four faces.
  const p = [[0, 0.09, 0], [-0.07, -0.04, 0.02], [0.08, -0.05, -0.01], [0.01, -0.02, 0.05]];
  const faces = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
  const position = new Float32Array(faces.flatMap((f) => f.flatMap((i) => p[i])));
  const g = new GFX.BufferGeometry();
  g.setAttribute('position', new GFX.BufferAttribute(position, 3));
  g.computeVertexNormals();
  return g;
}

export const PICKS = ['#ff3a8a', '#2ad0ff', '#ffd23a', '#8a4be8', '#3ae88a', '#ff7a1a', '#f5f0e6'];

/** The rain: how many streaks, how far round Rock they fall, how long each is and how fast it falls. */
export const RAIN = Object.freeze({ drops: 900, reach: 11, height: 9, length: 0.5, speed: 16 });

/**
 * Weather in streaks (rain, and sand blowing across) and in flakes (snow,
 * petals): colour, how see-through, which way and how fast it goes
 * ([x, y, z] tiles a second), how long a streak is along that way, or how
 * big a flake is and how much it wanders and turns, and whether it splashes.
 */
export const WEATHER = Object.freeze({
  rain: { streaks: true, color: '#c8d4e4', opacity: 0.45, velocity: [1.3, -16, 0], length: 0.5, splash: true },
  sand: { streaks: true, color: '#e0c088', opacity: 0.4, velocity: [9, -0.6, 2.5], length: 0.7, splash: false },
  snow: { flakes: 800, color: '#f0f4ff', opacity: 0.8, velocity: [0.3, -1.4, 0.1], size: 0.03, wander: 0.5, turn: 1 },
  petals: { flakes: 380, color: '#ffb8d4', opacity: 0.95, velocity: [0.6, -0.9, 0.2], size: 0.1, wander: 0.9, turn: 4 },
});
