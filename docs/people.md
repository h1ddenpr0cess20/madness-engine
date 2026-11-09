# People

`madness-engine/people` holds a real-size human, built to be dressed,
posed and animated, and to carry the weapons. He is his own model: none
of the cast's code is used to build him. He moves to the same clip
vocabulary the cast does, so a game drives him the way it drives them.

His anatomy is real: the MakeHuman project's base mesh, morph targets,
skeleton and skin weights (all CC0, public domain). `scripts/bake-human.mjs`
blends its young-male targets (three ancestries, equally) with an athletic
build, scales him to 1.76 m, re-poses him into our A-pose with MakeHuman's
own weights, maps its 163 bones onto our 64 (the lips get two more, weighted round the mouth), bakes ambient occlusion, and
writes `src/people/human/data/base.js`. At runtime the quads are smoothed
by Catmull–Clark subdivision (detail ≥ 0.8), the skin is painted onto its
UV layout from where each texel is on the body, and every garment is cut
by casting rays onto that body.

## Scale and proportions

One world unit is one metre, the same as the weapons. He is a stylised,
game-ready adult man:

| Measure | Value |
|---|---:|
| Height | 1.76 m |
| Head height | 0.22 m (about 7.75 heads) |
| Shoulder width | 0.46 m |
| Chest / waist / hip (round) | 1.00 / 0.78 / 0.94 m |
| Inseam | 0.80 m |
| Shoulder to wrist | 0.62 m |
| Hand / foot length | 0.19 / 0.27 m |

He stands on y = 0, facing +z, his left toward +x, in a 12° A-pose (arms
out from the sides) for rigging; every clip brings the arms down to hang.

## Use

```js
import * as GFX from 'madness-engine/gfx';
import { createHuman } from 'madness-engine/people';
import { createKrystalSword } from 'madness-engine/weapons';

const man = createHuman(GFX);                  // briefs, t-shirt, jeans, sneakers
scene.add(man.group);
man.hold(createKrystalSword(GFX));             // right hand, by the grip, under the guard

stage.run((dt, time) => {
  man.pose({ clip: 'walk', t: time - started, time, speed: 1 });
});
```

`createHuman(GFX, { detail, outfit, look, style })`:

- `detail`: `1` (default) smooths the body once (about 110k triangles
  for the body, about 37k drawn for the clothes) with a 2048² skin map;
  below `0.8` the baked quads are used as they are (about 27k) with a
  1024² map, for crowds.
- `outfit`: garment names to start in (default `['briefs', 'tshirt',
  'jeans', 'sneakers']`).
- `look`: `{ skin, iris, shirt, denim, shoe, sole, briefs }` colours.
- `style`: `{ attack, heavy, after }`, as for `setStyle`.

## Dressing

The base body is a whole body (head, trunk, arms, hands, legs and bare
feet) drawn as one skinned mesh. Every garment is another skinned mesh on
the same skeleton, worn over it.

```js
man.remove('tshirt');            // bare chest
man.wear('tshirt');
man.dress(['briefs']);           // just the base and briefs
man.outfit;                      // what he has on
man.garment('jeans');            // that garment's mesh
```

Nothing shows through clothes. Every vertex of the body (and of every
garment) is tagged with where it is: `{ zone, y, d }`, e.g. the trunk at a
height, an arm at a distance from the shoulder. Each garment says what it
`covers`; while it is worn, the triangles it covers on the body, and on
garments in lower layers, are not drawn at all. So however he moves,
there is no skin under the shirt to push through it. Skin is kept 6 cm
inside every opening (collar, cuffs, hems), so looking in never shows a
hole.

The t-shirt and jeans are cut from the skin itself (`people/human/shell.js`):
the part of the body they cover, cut along a clean outline, lifted off by
an ease and hung as cloth hangs (off the chest and shoulder blades, straight
down from the seat and thighs), with turned edges at the hems, cuffs, collar
and waistband. Every point of them is a point of the skin moved outward, so
they carry the skin's own weights: however he moves, they move with the
skin under them, and never tear at a seam. They are painted on the body's
UV layout by position, as the skin is. The sneakers are built on a last
measured off the foot.

Layers: briefs 1, sneakers 2, jeans 3, t-shirt 4 (worn untucked over the
jeans). A garment of your own has the same shape as those in `GARMENTS`:

```js
man.wear('apron', {
  layer: 5,
  materials: ['shirt'],
  build: (detail) => [/* Parts from people/human/kit.js */],
  covers: ({ zone, y }) => zone === 'tshirt' && y < 1.2,
});
```

Colours change live: `setSkin`, `setEyeColor`, `setShirtColor`,
`setJeansColor` (a tint over the indigo), `setShoeColor`, or `setLook({...})`.

## The rig

66 bones. The engine's movement vocabulary (`root`, `hips`, `spine`,
`chest`, `neck`, `head`, `arm`/`fore`/`hand`, `thigh`/`shin`/`foot`, each
`L` and `R`) and everything else on a person that moves:

- `clavicleL/R`, the collarbones over the arms (shrugs).
- Three bones a finger and thumb: `index1L` … `pinky3R`, `thumb1L` … .
- `toesL/R`.
- `jaw` (the lips are parted along the mouth's line; inside are a mouth,
  teeth on each jaw, and a tongue) and `tongue`.
- `eyeL/R`, `lidUpL/R`, `lidLowL/R` (the lids turn over the eyeball to
  blink), `browL/R`, `lipCornerL/R`, `lipUpper`, `lipLower` (on the jaw).

The collarbones follow the arms on their own: as an arm goes past level
they lift, and as it reaches forward they come forward.

`man.skeleton` is the engine's `Skeleton` (models/rig.js); turn any bone
yourself in `style.after(skeleton, state)`, which runs after the clip.

## Moving

`man.pose({ clip, t, time, seed, speed })`, every frame. Clips (`CLIPS`):
`idle`, `walk`, `run`, `jump`, `leap`, `attack`, `cast`, `hit`, `ko`,
`win`, `sit`, `talk`, `yell`. Their cadences match the cast's (a walk's stride at
9 rad/s × speed, a run's at 15), worked out for his real size. With a
weapon in his right hand the idle, walk, run and jump hold it ready.

`man.setStyle({ attack, heavy })`: `attack` is `'slash'`, `'chop'`,
`'thrust'`, `'smite'`, `'punch'` or `'shove'`. Each is a keyed swing from
ready: wind-up, strike, follow-through, recovery.

`talk` moves his mouth as he speaks: syllables at a talking pace, each an
open, spread, rounded or closed shape, in phrases with breaths between, the
brows lifting on stressed ones. `man.pose({ clip: 'talk', time, yell: true })`
shouts it instead (or `loud: 0..1`); `speaking: true` makes any clip talk.
`yell` is a sustained shout: planted, chest out, head driven forward,
fists clenched, the mouth wide and squared and the brows down.

### Face

```js
man.face({ jaw: 0.6, smile: 0.4, brows: 0.3, look: [0.2, -0.05] });
man.face({ blink: 1 });          // or blinkL / blinkR
man.face({ auto: false });       // stop his own blinking and glances
```

`jaw` 0..1, `blink` 0..1, `look` [yaw, pitch] radians, `smile` −1..1,
`brows` −1 (frown) .. 1 (raised), `tongue` 0..1, and the lips: `lipUp`,
`lipDown`, `pucker`, `wide`, each 0..1. Held until changed. `speech(time,
{ amount, loud })` and `yelling(time)` give the mouth's values for a moment
of speech, to drive a face yourself.

### Hands

```js
man.hands('fist', { hand: 'L' });     // 'relaxed', 'open', 'grip', 'fist', 'point'
man.hands({ curl: [0.5, 0.6, 0.3], thumb: 0.4, spread: 0.2 }, { hand: 'R' });
```

A hand holding something takes the grip shape.

### Holding

`man.hold(thing, { hand = 'R', grip })` puts a weapon (anything from
`madness-engine/weapons`, taken by its grip just under the guard) or any
object (taken at `grip` along its own y) in a hand. Its +y points out of
the fist on the thumb's side; a blade's edge leads. `man.release(hand)`
gives it back; `man.held(hand)` says what is there.

## Files

| File | What it is |
|---|---|
| `people/human.js` | `createHuman`: meshes, wardrobe, face, hands, holding, posing. |
| `people/human/skeleton.js` | Proportions, joints, bones and the skin-weight rules. |
| `people/human/data/base.js` | The baked body (generated by `scripts/bake-human.mjs`). |
| `people/human/basemesh.js` | Unpacks it; Catmull–Clark subdivision. |
| `people/human/head.js` | Eyes, teeth and tongue, the mouth's corners and lips. |
| `people/human/body.js` | Measuring the body: rays onto its skin, zones, skin weights for cloth, the feet. |
| `people/human/clothes.js` | The wardrobe: briefs, t-shirt, jeans, sneakers. |
| `people/human/shell.js` | Garments cut from the skin: outline, ease, drape, turned edges. |
| `people/human/textures.js` | Skin painted on the body's UVs, eyes, jersey, denim and sneakers. |
| `people/human/motion.js` | The clips. |
| `people/human/kit.js` | The modelling kit: grids, normals, assembly. |

The asset viewer lists him under **People**, with his wardrobe, colours,
a weapon to hold, the attack, his left hand and his face to set.
