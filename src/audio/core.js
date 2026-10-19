/** How fast the main title (the stadium anthem) goes over the title screen. */
export const TITLE_TEMPO = 136;

/**
 * A number the game hands the audio, made safe for an AudioParam: Web Audio
 * throws on anything not finite, and an exponential ramp can't reach zero.
 */
export const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

export const audible = (v) => Math.max(0.0001, finite(v, 0.0001));
