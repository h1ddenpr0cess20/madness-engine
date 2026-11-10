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

## The woman

`createHuman(GFX, { sex: 'female' })` (or `features: { sex: 'female' }`)
makes a woman: MakeHuman's own young woman, baked by `scripts/bake-human.mjs
--female` into `src/people/human/data/female.js`. Her targets blend the
young-female of the same three ancestries, an average-to-toned build,
ideal proportions, a moderate bust, and a finer face (a narrower nose,
jaw and chin, fuller lips, an oval head, higher cheekbones), scaled to
1.65 m. She is the man's own mesh, vertex for vertex (MakeHuman's targets
only move its points), so the file keeps only where her points are and
her joints: her UVs, quads, bones and skin weights are his.

| Measure | Value |
|---|---:|
| Height | 1.65 m |
| Head height | 0.21 m |
| Shoulder width | 0.37 m |
| Inseam | 0.76 m |
| Shoulder to wrist | 0.56 m |
| Hand / foot length | 0.175 / 0.245 m |

`DIMENSIONS.female` (and `her.dimensions`) give these; `FIGURES` gives each
figure's joints, face and fingers.

Everything worn or grown is made on him, as it always is, and carried onto
her (`people/human/fit.js`): each point moves as the skin under it moves
from his body to hers, the skin it follows chosen by how near it is and how
alike its bone weights are (so a point on the left thigh follows the left
thigh), wider the further the point stands off the skin. Normals turn with
the move's gradient; the eyes go whole, to hers and at her size. Their
weights, UVs and the zones they say they cover are his, so coverage,
layering and skinning work as they do on him. Cloth on the trunk then hangs
as it does over a bust (`hang`): from the fullest of it nearly straight
down, across between the breasts, and only ever outward, so hems and layers
keep their thickness. Her skeleton is his bones at her joints; the clips
read her legs' lengths off it, and a weapon is held at the same place in
her hand.

She starts in `DEFAULT_OUTFIT_FEMALE`: his outfit with a sports bra (`bra`,
cut from the chest, bridged across, a band held close round her ribs and
straps) under the t-shirt. The bra is hers only, and a beard his: `wear('bra')`
on him and a beard for her are refused. Her wardrobe (`GARMENTS_FEMALE`, used
by `wear` on her; `garmentsFor(sex)` gives either) is his in the
women's cut (`WOMENS_CUT`, said in his measures, since it is cut on him and
carried onto her): a fitted t-shirt, a little shorter, its sleeves shorter
and close; slim jeans, close down the whole leg (over the socks' cuffs and
the briefs, which they hide); the bomber cropped to the waist and fitted,
not bloused. Her briefs lie flat in front. Her t-shirt and bomber hang off
her bust and come back in to her waist; the bomber never comes in faster
than the shirt under it, and hides the shirt nearly to its hem. `FEMALE_FEATURES` are her defaults:
long blonde hair, blue eyes, groomed brows, no beard. Her skin has no
shaved shadow, and her lips are a little rosier. The figure is fixed when
she is made; `customize({ sex })` refuses to change it.

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

The briefs, t-shirt and jeans are cut from the skin itself (`people/human/shell.js`):
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
`setJeansColor` (a tint over the indigo), `setShoeColor`, `setHairColor`,
or `setLook({...})`.

## Character creator

`CUSTOMIZATION` lists everything a character creator offers, group by group,
as a screen would show it: the body (build, height, muscle, weight,
shoulders), the skin (tone, age, freckles, scars, a face tattoo), the head
(face shape, size, jaw, chin, cheekbones, forehead), the eyes (shape, size,
spacing, tilt, depth, colour), the brows, the nose (shape, width, length,
bridge, tip), the mouth (shape, width, each lip, colour), the ears (shape,
size, angle), the hair and the facial hair. Each slot is a choice, a slider
(−1 to 1, 0 the average) or a colour, with its default, and `ready` says
whether he is built to show it yet. A group with a `figure` is that figure's
only (the facial hair is his); `customizationFor(sex)` leaves out the other's.

```js
const him = createHuman(GFX, { features: { hair: 'sidePart', beard: 'full', skin: '#8a5a3c' } });
him.customize({ noseShape: 'aquiline', eyeSize: 0.3 });
him.features;   // every slot's value
```

The slots not built yet are kept and handed back, so a game can offer them
now; each takes effect as it is built. The asset viewer shows every slot,
those not built yet greyed out.

## Hair

```js
const man = createHuman(GFX, { hair: 'sidePart', beard: 'full', look: { hair: '#3b2a1f' } });
man.setHair({ beard: null });          // shaved; { hair: null } for a bald head, { brows: null } for none
```

The hair is made as games make it: hair cards, narrow strips each grown
from a root along the way the hair is combed, lying on the hair under
them, with a texture of a clump of strands cut out by the alpha test. Under
them the skin is painted the hair's colour where it grows, so no scalp shows
through. They are drawn twice: solid where the strands are, then their
soft edges blended over. Their highlights run across the strands, as hair's
do: two of them (Kajiya and Kay's model, shifted as Scheuermann shifts it),
a tight white one off the strands' surface and a broader one in the hair's
own colour (the material's `strands` flag).

- `sidePart` (the default): about 5 cm on top, combed across from a parting
  over the left eye, tapering to a few millimetres over the ears and at the
  nape; the sideburns a band from the temple down the front of the ear.
- `full` (`beard`): about 2 cm, 2.5 at the chin, in a barber's outline:
  from behind the top of the ear down and forward to the throat, from above
  the front of the ear across the cheek to the corner of the mouth, trimmed
  level under the chin; the moustache down and out over the lip.

- `natural` (`brows`, on unless `brows: null`): about 9 mm at the head of
  each brow, swept up there, then lying out along the arch and turning down
  toward the tail.
- `fine` (`brows`, the woman's): the natural brows shaped and plucked: the
  same hairs at the same density, kept to a narrower line with a clean edge
  under it, lifted to an arch two-thirds out and tapered to a fine tail; a
  shade darker than the hair.
- `long` (`hair`, the woman's): parted in the middle, off the face and
  behind the ears, falling over the shoulders and down the back to below
  the shoulder blades, cut in a soft U, round a full hairline. Its strands
  are grown along the head, then fall and lie where they fall, on the
  neck, shoulders and back (kept out over a jacket). It is skinned (to the
  head, then the neck and chest down the back) rather than carried whole.

The hair rides the head bone whole; the beard and brows are skinned, so they
move with the jaw, the lips and the brows.

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
they lift, and as it reaches forward they come forward. The skin is moved
by dual-quaternion skinning (`skinDual` in models/rig.js), which keeps a
joint's volume where it bends far: the shoulders stay round with the arms
overhead, and the elbows and knees don't pinch thin. The weights round the
armpits are smoothed over the mesh, so the skin there stretches evenly.

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
| `people/human/data/female.js` | The woman's points and joints on the same mesh (`scripts/bake-human.mjs --female`). |
| `people/human/fit.js` | Carrying what is made on him onto her; cloth hung over her bust. |
| `people/human/basemesh.js` | Unpacks it; Catmull–Clark subdivision. |
| `people/human/head.js` | Eyes, tongue, the mouth's corners and lips. |
| `people/human/features.js` | The character creator's slots: what can be chosen, its options and defaults. |
| `people/human/hair.js` | Hair and beards: where each grows, its length and combing, the cards, the strand texture. |
| `people/human/teeth.js` | The teeth and gums, tooth by tooth, sized from average adult crowns. |
| `people/human/body.js` | Measuring the body: rays onto its skin, zones, skin weights for cloth, the feet. |
| `people/human/clothes.js` | The wardrobe: briefs, sports bra, socks, t-shirt, jeans, sneakers, bomber. |
| `people/human/shell.js` | Garments cut from the skin: outline, ease, drape, turned edges. |
| `people/human/textures.js` | Skin painted on the body's UVs, eyes, jersey, denim and sneakers. |
| `people/human/motion.js` | The clips. |
| `people/human/kit.js` | The modelling kit: grids, normals, assembly. |

The asset viewer lists him, and her (**Human, female**), under **People**, with his wardrobe, colours,
a weapon to hold, the attack, his left hand and his face to set.
