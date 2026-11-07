/**
 * The line a curved blade follows, shared by the blade's geometry and the mist
 * laid along it. The blade rises from its root upright and leans toward -x.
 * Its heading turns by `bend` radians evenly along the length, and by `hook`
 * more that is saved for the last of it, so the curve tightens into a talon.
 * Distances are metres from the root; `u` runs 0 at the root to 1 at the point.
 */
const smooth = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function bladeCentreline({ length, bend, hook = 0, talon = 0, samples = 512 }) {
  const heading = (u) => bend * u + hook * u ** 4;
  const centre = [[0, 0]];
  for (let i = 1; i <= samples; i++) {
    const phi = heading((i - 0.5) / samples);
    const [x, y] = centre[i - 1];
    centre.push([x - Math.sin(phi) * (length / samples), y + Math.cos(phi) * (length / samples)]);
  }
  return {
    /** The centre of the blade at `u`, and which way it is heading there. */
    at(u) {
      const f = Math.max(0, Math.min(1, u)) * samples, k = Math.min(samples - 1, Math.floor(f)), t = f - k;
      return {
        x: centre[k][0] + (centre[k + 1][0] - centre[k][0]) * t,
        y: centre[k][1] + (centre[k + 1][1] - centre[k][1]) * t,
        phi: heading(u),
      };
    },
    /** How much of the blade's full width is left at `u`: it narrows early toward the point. */
    taper: (u) => 1 - talon * smooth(0.4, 0.95, u),
    /** How far the point stands above the root. */
    reach: centre[samples][1],
  };
}
