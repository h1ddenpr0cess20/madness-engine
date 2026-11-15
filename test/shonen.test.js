import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { createHuman, createShonen, SHONEN_FEATURES } from '../src/people/index.js';
import { shapeFor } from '../src/people/human/shape.js';

const NAMES = ['neck', 'head'];

for (const sex of ['male', 'female']) {
  test(`the shonen ${sex} is a model of its own, with the shonen face and a built body`, () => {
    const hero = createShonen(GFX, { sex, detail: 0.5 });
    const plain = createHuman(GFX, { sex, detail: 0.5 });
    assert.equal(hero.features.faceStyle, 'shonen');
    assert.equal(plain.features.faceStyle, 'realistic', 'the realistic human is left as it is');
    assert.ok(hero.height > plain.height, 'taller');
    assert.ok(hero.weight > plain.weight, 'more muscle');
    // The face: eyes set lower and apart, the eyeballs grown, a smaller mouth.
    const a = shapeFor({ ...plain.features }), b = shapeFor({ ...plain.features, faceStyle: 'shonen' });
    assert.equal(a, null);
    assert.ok(b.eyes.L > 0.0015 && b.eyes.R > 0.0015, 'the eyeballs grow');
    assert.ok(b.pivots.eyeL[1] < 0 && b.pivots.eyeL[0] > 0, 'the eyes sit lower and wider');
    assert.ok(b.pivots.lipUpper[1] < 0, 'the mouth sits lower');
    for (const n of NAMES) assert.ok(hero.skeleton.names.includes(n));
  });
}

test('the face style can be changed live, and the heroes take the creator\'s other choices', () => {
  const hero = createShonen(GFX, { detail: 0.5, features: { hairColour: '#ff8800', muscle: 0 } });
  assert.equal(hero.features.hairColour, '#ff8800');
  assert.equal(hero.features.muscle, 0);
  assert.equal(hero.features.build, SHONEN_FEATURES.male.build);
  hero.customize({ faceStyle: 'realistic' });
  assert.equal(hero.features.faceStyle, 'realistic');
  assert.throws(() => hero.customize({ faceStyle: 'chibi' }), /faceStyle/);
});
