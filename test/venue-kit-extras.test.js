import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from '../src/gfx/index.js';
import { BOARD_DETAIL, createFoeMeshes, FLIGHT, KNOCKED_OUT, STRIKE } from '../src/venue/foemesh.js';

const foes = { walker: { move: 'walk', radius: 0.4 }, flyer: { move: 'fly', radius: 0.3 } };

test('a foe with no model yet is a stand-in coloured by how it gets about, and animating it is safe', () => {
  const { createFoeMesh } = createFoeMeshes({ foes, cast: {}, isBaked: () => false, ready: () => new Promise(() => {}) });
  const walker = createFoeMesh(GFX, 'walker');
  assert.equal(walker.group.name, 'walker');
  assert.equal(walker.body.children.length, 1);
  assert.equal(walker.body.children[0].children.length, 2, 'a torso and a head');
  walker.animate(0, true, { chasing: true });
  assert.ok(FLIGHT > 0 && BOARD_DETAIL > 0 && KNOCKED_OUT > STRIKE);
});
