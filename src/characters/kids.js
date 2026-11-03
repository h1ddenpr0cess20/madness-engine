import { person } from './person.js';

/**
 * Children, from a baby to a teenager, as the one body of the people in
 * smaller sizes (humanoid.js `build`): a bigger head on a shorter body with
 * shorter legs, a rounder face, and the height of the age. `child(age, ...)`
 * is `person(...)` with that build and size filled in; everything else (look,
 * face, hair, extras) is the character's own.
 *
 * Ages and their heights, as a fraction of a grown person's: baby (one year)
 * 0.40, toddler (two) 0.47, child (five or six) 0.56, preteen (ten) 0.70,
 * teen (fifteen) 0.88.
 */
export const AGES = {
  baby: { scale: 0.67, b: 0.9, shape: { legs: 0.55, torso: 0.78, head: 1.4, girth: 1.12 }, belly: 0.5, face: { jaw: 0.8, blush: 0.9 } },
  toddler: { scale: 0.77, b: 0.9, shape: { legs: 0.64, torso: 0.82, head: 1.3, girth: 1.06 }, belly: 0.4, face: { jaw: 0.84, blush: 0.8 } },
  child: { scale: 0.88, b: 0.9, shape: { legs: 0.76, torso: 0.88, head: 1.2, girth: 0.98 }, belly: 0.2, face: { jaw: 0.9, blush: 0.6 } },
  // The Little Brother's build: eight or nine, a bit taller.
  preteen: { scale: 1.06, b: 0.92, shape: { head: 1.12, legs: 0.86, torso: 0.94 }, belly: 0, face: { jaw: 1.0, blush: 0.4 } },
  teen: { scale: 1.29, b: 0.94, shape: { legs: 0.98, torso: 0.98, head: 1.04, girth: 0.92 }, belly: 0, face: { jaw: 0.96, blush: 0.3 } },
};

/**
 * How a baby or a toddler gets about: a wobbly waddle with the arms held out for balance, and a sway and a look round
 * standing still. For `style.after`.
 */
export function toddle(k, { clip, time, seed }) {
  if (clip === 'ko' || clip === 'hit' || clip === 'attack') return;
  const T = time + seed;
  if (clip === 'walk') {
    k.turn('armL', -0.3, 0, 0.75);
    k.turn('armR', -0.3, 0, -0.75);
    k.turn('hips', 0, 0, Math.sin(T * 9) * 0.07);
    k.turn('head', 0, 0, -Math.sin(T * 9) * 0.05);
  } else {
    k.turn('hips', 0, 0, Math.sin(T * 1.4) * 0.05);
    k.turn('head', 0.08, Math.sin(T * 0.8) * 0.3, 0);
  }
}

/** A person of age `age` ('baby', 'toddler', 'child', 'preteen' or 'teen'): `opts` as for `person`, less its size and build. */
export function child(age, { face = {}, style = {}, ...opts }) {
  const a = AGES[age];
  if (!a) throw new Error(`no such age: ${age}`);
  return person({
    scale: a.scale, b: a.b, shape: a.shape, belly: a.belly, ...opts,
    face: { ...a.face, ...face },
    style: { attack: 'shove', ...(age === 'baby' || age === 'toddler' ? { after: toddle, heavy: 0.2 } : {}), ...style },
  });
}
