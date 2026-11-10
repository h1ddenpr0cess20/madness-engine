# Weapons

Weapons are separate from generic props and heroes. The viewer lists them under
**Weapons**, and new weapon families should be added as measured assets under
`src/weapons/`.

## Scale convention

Weapon dimensions use metres: **one Madness Engine world unit represents one
metre**. The published overall length includes the pommel marble and excludes only
any surrounding scene or display environment. The glass-and-spark marble is
integrated into the hilt as its pommel, not placed under the sword as a stand. Keep each weapon at its real dimensions; do not normalize different
weapon classes to the same screen height.

Useful historical proportion targets for future assets:

| Weapon | Overall length | Blade length | Notes |
|---|---:|---:|---|
| Dagger | 0.30–0.45 m | 0.18–0.30 m | Compact one-hand weapon |
| Broadsword | 0.95–1.05 m | 0.72–0.82 m | One-handed, broad double-edged blade |
| Greatsword | 1.35–1.65 m | 1.00–1.25 m | Two-handed grip |

These are modelling targets, not claims that every historical example shared
one standard dimension.

## Broadsword

`createBroadsword(GFX, options)` builds a point-up broadsword with the actual
engine glass-and-spark marble integrated into the bottom of the leather grip
as the pommel. A hollow, tapered metal ferrule flares around the marble's upper shoulder and
narrows to a handle-matched top rim. A small upper cap and domed guard boss
cover the grip end without burying the handle. The blade and hilt each accept one of the 12
shared `METALS` finishes and change independently; the grip has a live hex
colour setter.

```js
import * as GFX from 'madness-engine/gfx';
import { createBroadsword } from 'madness-engine/weapons/broadsword';

const sword = createBroadsword(GFX, {
  bladeMetal: 'platinum',
  hiltMetal: 'platinum',
  gripColor: '#633b2c',
});
scene.add(sword.group);
sword.setBladeMetal('chrome');
sword.setHiltMetal('brass');
sword.setGripColor('#75452e');
```

Published dimensions: approximately 0.99 m overall, 0.786 m blade,
52 mm maximum blade width, 140 mm grip, 220 mm crossguard span, and a 54 mm glass marble pommel with a hollow metal bezel between it and the 140 mm leather grip. Its solid blade has a fuller that fades out at 75% of blade length.


## Dagger and greatsword

Both variants are derived from the broadsword construction. Their blade meshes
use the same lenticular cross-section, shoulder, edge profile, point, fuller
shape and 75% fuller termination. They retain the shared marble pommel, leather
wrap treatment, ferrule and materials; grip lengths are proportioned for each
weapon class.

| Weapon | Overall length | Blade length | Maximum blade width | Guard span | Guard-bar thickness |
|---|---:|---:|---:|---:|---:|
| Dagger | 0.401 m | 0.240 m | 47 mm | 112 mm | 13.6 mm (broadsword default) |
| Broadsword | 0.990 m nominal | 0.786 m | 52 mm | 220 mm | 13.6 mm |
| Greatsword | 1.524 m | 1.180 m | 88 mm | 220 mm | 18.4 mm |

The dagger uses a compact 97 mm grip instead of the broadsword's 140 mm grip, with eight leather-wrap ridges rather than twelve (four fewer rungs) while preserving the broadsword's wrap spacing. The greatsword uses a 280 mm grip (twice the broadsword's 140 mm) for a two-handed hold. Its overall length therefore includes the longer handle. The dagger is proportioned as a dagger rather than a shortened-looking
broadsword: its overall length falls within the documented 0.30–0.45 m
dagger target. The greatsword falls within the 1.35–1.65 m target. Its 88 mm blade width is deliberately much broader than the broadsword, following the broad, substantial blade silhouette in the supplied Ice reference. Both use the same metre-based coordinates and the same default material options as the broadsword.

```js
import * as GFX from 'madness-engine/gfx';
import { createDagger, createGreatsword } from 'madness-engine/weapons';

const dagger = createDagger(GFX);
const greatsword = createGreatsword(GFX, {
  bladeMetal: 'steel',
  hiltMetal: 'silver',
  gripColor: '#633b2c',
});
```


## Morningstar

`createMorningstar(GFX, options)` keeps the existing hero morningstar head
geometry and wraps it in a hafted weapon assembly. The head is the existing
36-spike steel morningstar, with the original head mesh unchanged; it is
positioned and uniformly scaled to a 198 mm tip-to-tip envelope. The haft is a
straight polished metal shaft joined directly to the head. Below it is the
shared 240 mm leather grip, tapered hollow ferrule, metal grip seat and
glass-and-spark marble pommel. The head, shaft and metal fittings share one
selectable `METALS` finish; the leather grip colour remains independently
selectable.

Published dimensions: approximately 1.18 m overall, 700 mm exposed metal
haft, 240 mm leather grip, 28 mm haft diameter, 198 mm spiked-head envelope
and a 54 mm glass marble pommel. The 240 mm grip is longer than the
broadsword's 140 mm grip.

```js
import * as GFX from 'madness-engine/gfx';
import { createMorningstar } from 'madness-engine/weapons';

const morningstar = createMorningstar(GFX, {
  metal: 'steel',
  gripColor: '#633b2c',
});
morningstar.setMetal('chrome');
morningstar.setGripColor('#75452e');
```


## Named weapon families

The viewer includes three coordinated families, each with a sword, dagger,
greatsword and morningstar:

- **Madness** keeps the original glass-and-spark marble pommel and established
  crossguard/wrap construction.
- **Regular** keeps the same weapon geometry and banded leather wrap, replacing
  the marble with a solid metal ball that follows the hilt metal selection.
- **Marc's** extracts the exact shell mesh from the repository's
  `createMetalEgg({ GFX, metal })` asset and detaches it from the animated hero
  rig. The original mesh and geometry are retained; its render callback is
  removed so it stays stationary as the pommel, broad end seated into the grip
  with the existing metal bezel, and a continuous diagonal leather wrap.
  Sword, dagger and greatsword guards reuse the original Madness swept
  crossguard: its curve is flipped upward and increased slightly,
  while the two original rounded terminals are tapered into points as part of
  the same continuous guard mesh. Marc's Morningstar keeps its plain
  haft-to-head connection and has no horns.

The three variants are exposed from `madness-engine/weapons` as
`createMadnessSword`, `createRegularSword`, `createMarcsSword`, and the
corresponding `Dagger`, `Greatsword` and `Morningstar` factory names.


## Default finishes

The Madness sword, dagger and greatsword factories default to rose-gold blade
and hilt metal with a white leather grip. The Madness Morningstar uses the
same rose-gold metal and white grip. Marc's Sword defaults to gold blade and
hilt metal with a black wrap. Krystal Sword and Dagger default to platinum
metal with their independently customizable blue-charcoal leather and
ice-blue thread. These remain factory defaults; callers can override the
metals, leather and thread independently.

## Krystal sword and dagger

The Krystal set retains the Madness sword and dagger blade dimensions, but
uses a dedicated lightning-bolt crossguard and diamond-stitched grip. Each
mirrored guard arm has three shallow directional bends, a reinforced root
(about 20.5 mm across), a substantial shaft (about 15.4 mm), and an integrated
taper to a sharp terminal point. The steel blade keeps its full working width
through most of its length, then transitions into a shorter, sturdier point.

The leather grip is dark blue-charcoal by default (`#25364a`) with contrasting
ice-blue thread (`#a7e6ff`). These are independently customizable: pass
`gripColor` and `threadColor` when creating a weapon, or change them later
with `setGripColor()` and `setThreadColor()`. Setting one does not alter the
other. Blade and hilt metals remain independently selectable.

The marble pommel is replaced by Krystal's actual transmissive crystal orb and
ray-marched vision material, scaled to the same 54 mm envelope. The orb's
brass stand is omitted; the existing hollow metal ferrule seats the glass.
Both weapons carry a separate, visible mist sheath around the blade. It uses
the same GLSL/WGSL ray-marched vision shader as Krystal's orb, mapped into an
elongated ellipsoid so the wisps stay close to the blade on both sword and
dagger. Call `setBladeMist(false)` to hide the blade sheath or
`setBladeMist(true)` to show it; the orb's own internal visions remain
visible independently.

```js
import * as GFX from 'madness-engine/gfx';
import { createKrystalSword, createKrystalDagger } from 'madness-engine/weapons';

const sword = createKrystalSword(GFX, {
  bladeMetal: 'steel',
  hiltMetal: 'silver',
  gripColor: '#25364a',
  threadColor: '#a7e6ff',
});
const dagger = createKrystalDagger(GFX);
scene.add(sword.group, dagger.group);

sword.setBladeMetal('chrome');
sword.setHiltMetal('brass');
sword.setGripColor('#75452e');
sword.setThreadColor('#ffb04a');
sword.setBladeMist(false);
```


## Wizard staff

`createStaff(GFX, options)` builds a gnarled wooden wizard's staff about 1.7 m
tall, using the library's wood textures (`textures/wood`, via
`woodBoardMaterial`). `createMetalStaff(GFX, options)` builds the same staff
with the structure cast in a selected engine metal. The metal version keeps the
same shaft profile, entwined roots, cradle, winding bands, tendrils and overall
dimensions; only the structural material changes. The leather grip and crossed
thread remain as the contrasting hand wrap.

The wooden staff accepts `species` (any `WOOD_SPECIES`, default `walnut`) and
`finish` (`raw`, `sanded`, `lacquered`, default `lacquered`), and
`setWood()` changes the structural wood. The metal staff accepts `metal`,
defaults to `gold`, and `setMetal()` changes its finish. Available metal
names are the keys of `METALS`: `steel`, `silver`, `gold`, `copper`,
`bronze`, `brass`, `titanium`, `chrome`, `platinum`, `rose gold`,
`iron` and `pewter`. The metal surface uses the engine's reflective physical
metal material and therefore benefits from a scene environment.

The topper can be the Krystal crystal orb (the default, with its ray-marched
visions), the Magic Egg's glass egg, the Madness marble with its 3D spark, or
the glass globe, Moon, Mars and Jupiter. All four glass-planet toppers use the
shared glass-globe construction with mist enabled; Moon and Mars use their
existing etched relief maps, Earth uses the globe's existing etching, and
Jupiter adds its cloud map inside the glass. Use `topper: 'none'` for an empty
cradle. Assets are built lazily when first selected. Planetary surface images
load asynchronously; await `staff.topperReady` after selecting one when code
needs to wait for its surface to finish loading.

| Option | Choices | Default |
|---|---|---|
| `species` | any `WOOD_SPECIES` (walnut, oak, mahogany, maple, cherry, ash, pine, teak) | `walnut` |
| `finish` | `raw`, `sanded`, `lacquered` | `lacquered` |
| `metal` | any key of `METALS` | `gold` on `createMetalStaff` |
| `wrap` | `true` or `false`: the leather and thread wrap on the grip (`setWrap()` toggles it) | `true` |
| `gripColor`, `threadColor` | six-digit hex, for the wrap | `#3a2418`, `#e2b857` |
| `topper` | `orb`, `egg`, `marble`, `globe`, `moon`, `mars`, `jupiter`, `none` | `orb` |
| `vine` | `true` or `false`: the roots entwined up the shaft (fixed at creation) | `true` |
| `tendrils` | whole number from 8 to 32: how many roots make the cradle (fixed at creation) | `18` |
| `seed` | any number: shapes the gnarls (fixed at creation) | `7` |

```js
import * as GFX from 'madness-engine/gfx';
import { createStaff, createMetalStaff } from 'madness-engine/weapons';

const wood = createStaff(GFX, { species: 'cherry', topper: 'egg' });
const metal = createMetalStaff(GFX, { metal: 'gold', topper: 'jupiter' });
scene.add(wood.group, metal.group);

wood.setTopper('marble');
wood.setWood('oak', 'sanded');
metal.setMetal('rose gold');
metal.setTopper('moon');
await metal.topperReady;
metal.setGripColor('#25364a').setThreadColor('#a7e6ff');
```

## Magic Egg Sword, Dagger and Greatsword

`createMagicEggSword(GFX, options)` follows the Krystal sword construction
but replaces the crystal orb pommel with the repository's actual transmissive
Glass Egg shell and its white/yellow ray-marched mist. Sword, dagger and
greatsword share the same detached, stationary egg pommel, correctly fitted
with its narrow point facing outward and its broad shoulder meeting the grip.
The gold bezel forms a short collar around that upper shoulder and follows
the outside contour of the glass shell rather than passing through the egg;
the same fitted outer ferrule is used for Marc's Metal Egg pommel. The internal egg mist remains
visible independently of the separate blade sheath.

All three variants use the same three-bend lightning quillons as Krystal,
mirrored vertically so both arms sweep down. Their default blades are silver
and their hilts are gold. The grip uses silver leather (`#c0c0c0`) with gold diamond
stitching (`#ffd264`). Metal finishes, leather and thread remain
independently customizable through the factory options; grip and thread can
also be changed later with `setGripColor()` and `setThreadColor()`. Its
blade sheath uses the egg's white/yellow palette and can be toggled with
`setBladeMist()`.

```js
import * as GFX from 'madness-engine/gfx';
import {
  createMagicEggSword,
  createMagicEggDagger,
  createMagicEggGreatsword,
} from 'madness-engine/weapons';

const options = {
  bladeMetal: 'silver',
  hiltMetal: 'gold',
  gripColor: '#c0c0c0',
  threadColor: '#ffd264',
};
const sword = createMagicEggSword(GFX, options);
const dagger = createMagicEggDagger(GFX, options);
const greatsword = createMagicEggGreatsword(GFX, options);
scene.add(sword.group, dagger.group, greatsword.group);

sword.setGripColor('#d0d0d0');
sword.setThreadColor('#e8b62f');
sword.setBladeMist(false);
```



## Marc's family default finishes

Marc's sword, dagger, greatsword and morningstar default to gold metal with a black leather grip and diagonal black wrap. Caller-provided `bladeMetal`, `hiltMetal`, `metal` and `gripColor` options override these defaults.


## Banana dagger

`createBananaDagger(GFX, options)` is a half-peeled banana. It keeps the
dagger's blade (the same lenticular section, fuller and point, 240 mm long),
slimmed from 47 mm to 38 mm wide, and changes the hilt and the blade's line:

- **Blade:** curved off the grip and drawn out into a talon. The root stays
  upright so the blade leaves the grip tangent to it, in the same plane and
  bowing the same way, which makes one banana crescent of grip and blade. It
  turns 0.4 rad evenly along its length and a further 0.4 rad in the last of
  it, so the curve tightens into a hooked point, and it narrows early to draw
  that point out. The cutting edges, fuller and thickness all follow the
  curve (every section stays square to the blade line). It keeps its length
  along the curve.
- **Grip:** a ridged brass tube (five ridges), 135 mm along its arc against
  the dagger's 97 mm, that bows back through 0.7 rad (about 40°) in the
  blade's plane. It is fullest at the top and tapers to a small tip, the dark
  end of the banana. There is no pommel ball and no leather.
- **Guard:** no crossguard bar. The peel is the grip's own skin. The grip
  runs up into a short round neck, which the blade comes out of, and four
  flaps of brass skin grow out of the neck's surface (no collar and no
  ledge), fold back over its rim and hang down around the hand like a cup
  guard, curling in across their width to hug it. They are kept to about
  10 cm across so the weapon can be sheathed and worn. The face of each flap
  looking out is the pale inside of the peel: an inlay set into the brass,
  with a thin rim of the brass showing all round it.

Two metals, two toggles. The **blade metal** (platinum by default) is the
blade, the inlay on top of every petal, and the tip of the grip: they are one
material, so `bladeMetal` and `setBladeMetal()` change all of them together.
The **hilt metal** (brass by default) is the grip, the neck and the brass body
of the petals, and is changed by `hiltMetal` and `setHiltMetal()`.

Published dimensions: approximately 0.369 m overall (the bows shorten the
reach along the vertical, so length is measured from the lowest point of the
grip tip to the point), 240 mm blade along its curve, 38 mm width, 135 mm grip
along its arc and about 105 mm across the flaps.

```js
import * as GFX from 'madness-engine/gfx';
import { createBananaDagger } from 'madness-engine/weapons';

const banana = createBananaDagger(GFX, {
  bladeMetal: 'platinum',
  hiltMetal: 'brass',
});
scene.add(banana.group);
banana.setBladeMetal('chrome'); // blade, petal tops and grip tip
banana.setHiltMetal('gold');    // grip, neck and the brass body of the peel
```

`setGripColor` is accepted for the shared API but has no effect on this
weapon, since a metal grip has no leather to dye.

### Magic blade

The banana dagger can be a magic blade, like the Magic Egg dagger: a soft
white and yellow mist, in the Magic Egg palette, along the blade. It is a
layer of the one weapon, built in and **off to start with**, and it is
dimmer than the Magic Egg dagger's so the platinum still shows through.

The shader ray-marches an upright ellipsoid, so on this curved blade the mist
is a chain of six short stretches laid along the blade's line, each sized to
hold its own tilted part of the blade, and it follows the curve into the
talon. They share one group, so one switch shows and hides all of it. The
asset viewer's mist checkbox drives it.

```js
const banana = createBananaDagger(GFX);
banana.setBladeMist(true);  // on; setBladeMist(false) hides it again

createBananaDagger(GFX, { bladeMistVisible: true }); // starts on
createBananaDagger(GFX, { bladeMist: false });       // no mist layer at all
```


## Banana broadsword

`createBananaBroadsword(GFX, options)` is the broadsword-sized counterpart
to the banana dagger. It preserves the same curved, hooked blade, ridged
banana grip, four-flap peel guard, platinum inner peel and brass outer peel.
The blade and grip use the broadsword's measured dimensions: 786 mm along
the blade's curve, 34 mm blade width, just under the 36.4 mm grip-top diameter, 140 mm grip along its arc and a
220 mm nominal guard span. The curved banana silhouette gives it a shorter
end-to-end envelope than the straight broadsword.

The four existing peel flaps retain their shape and width, with their
vertical length increased by 15% so they read proportionally on the larger
weapon. The banana broadsword uses the same platinum/brass material controls
and hidden-by-default soft white/yellow blade mist as the banana dagger.

```js
import * as GFX from 'madness-engine/gfx';
import { createBananaBroadsword } from 'madness-engine/weapons';

const bananaSword = createBananaBroadsword(GFX);
scene.add(bananaSword.group);
```
