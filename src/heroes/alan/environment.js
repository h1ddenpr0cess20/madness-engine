import { reflect } from '../reflect.js';

/**
 * What the glass reflects: the night it hangs in (`textures/skies/cloudsea.js`),
 * sun and all, turned over to put everything where the backdrop has it. So the
 * bottom of the ball shows the cloud sea, the top the dark, and the glint high
 * on it is the sun's: the stage's key light is put where the sun is
 * (`sunlight`), and there is no lamp anywhere for the glass to show.
 *
 * `sky` is the painted canvas; without one there is nothing to reflect.
 */
export function buildEnvironment({ stage, GFX, sky }) {
  reflect(stage, GFX, sky, { mirror: true });
}

/**
 * Light the eye the way the sky says it is lit: by the sun, straight
 * overhead. The stage's key is moved up there; its fill, a lamp low behind
 * with nothing in the sky to be, would only put a second glint on the glass,
 * so it goes out. The stage's soft wash stays: it puts no glint on anything.
 */
export function sunlight(stage) {
  if (stage._key) stage._key.position.set(0, stage._key.position.length(), 0);
  if (stage._fill) stage._fill.visible = false;
}
