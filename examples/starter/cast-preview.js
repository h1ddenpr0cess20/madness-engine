import * as GFX from 'madness-engine/gfx';
import { CHARACTERS } from 'madness-engine/characters';
import { createModel } from 'madness-engine/models/model';
import { createStage } from 'madness-engine/stage';

const host = document.getElementById('game');
const stage = await createStage(host, {
  backdrop: '#101522',
  sky: null,
  room: null,
  preference: 'webgl',
  shadows: true,
  shadowSize: 1024,
  pixelRatio: 1,
  label: 'cast-design-preview',
});
stage.target.set(0, 0.55, 0);
stage.view.yaw = stage.view.aim.yaw = 0;
stage.view.pitch = stage.view.aim.pitch = 0.28;
stage.view.zoom = stage.view.aim.zoom = 1;
stage.view.step(0, true);

const floor = new GFX.Mesh(
  new GFX.BoxGeometry(11.2, 0.08, 2.7),
  new GFX.MeshStandardMaterial({ color: new GFX.Color('#1a2334'), roughness: 0.78, metalness: 0.08 }),
);
floor.position.set(0, -0.04, 0);
floor.receiveShadow = true;
stage.scene.add(floor);

const selection = [
  { label: 'Agent', definition: CHARACTERS.agent },
  { label: 'Punk', definition: CHARACTERS.punk },
  { label: 'Croc', definition: CHARACTERS.croc },
  { label: 'Gator', definition: CHARACTERS.gator },
  { label: 'Kangaroo', definition: CHARACTERS.kangaroo },
  { label: 'Rat', definition: CHARACTERS.rat },
  { label: 'Crow', definition: CHARACTERS.crow },
  { label: 'Zombie', definition: CHARACTERS.zombie },
];
const spacing = 1.22;
const start = -((selection.length - 1) * spacing) / 2;
const models = selection.map(({ label, definition }, i) => {
  const pedestal = new GFX.Mesh(
    new GFX.CylinderGeometry(0.47, 0.47, 0.05, 32),
    new GFX.MeshStandardMaterial({ color: new GFX.Color('#35445c'), roughness: 0.42, metalness: 0.38 }),
  );
  pedestal.position.set(start + i * spacing, 0.025, 0);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  stage.scene.add(pedestal);
  const model = createModel(GFX, definition, { detail: 0.5 });
  model.group.position.set(start + i * spacing, label === 'Crow' ? 0.57 : 0.05, 0);
  model.pose({ clip: 'idle', t: 0, time: 0, seed: i * 0.71, speed: 1 });
  stage.scene.add(model.group);
  return { model, seed: i * 0.71 };
});

let time = 0;
stage.run((dt) => {
  time += dt;
  for (const { model, seed } of models) {
    model.pose({ clip: 'idle', t: time, time, seed, speed: 1 });
  }
});
globalThis.castDesignPreview = { stage, models };
