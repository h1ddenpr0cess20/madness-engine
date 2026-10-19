export const DEFAULTS = { music: 0.8, sfx: 0.9, flashing: true, touchHints: true };

export function pickSettings(s) {
  const out = {};
  for (const k of Object.keys(DEFAULTS)) if (typeof s[k] === typeof DEFAULTS[k]) out[k] = s[k];
  return out;
}
