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


## Magic Egg Sword

`createMagicEggSword(GFX, options)` follows the Krystal sword construction
but replaces the crystal orb pommel with the repository's actual transmissive
Glass Egg shell and its white/yellow ray-marched mist. The egg is detached
from its hero rig, fitted into the existing pommel envelope, and turned with
its broad end toward the grip. The internal egg mist remains visible
independently of the separate blade sheath.

The guard uses the same three-bend lightning quillons as Krystal, mirrored
vertically so both arms sweep down. Its grip is white leather with contrasting
yellow diamond stitching (`#f2c94c`). The leather and thread colors remain
independently customizable through `gripColor`, `threadColor`,
`setGripColor()` and `setThreadColor()`. Its blade sheath uses the egg's
white/yellow palette and can be toggled with `setBladeMist()`.

```js
import * as GFX from 'madness-engine/gfx';
import { createMagicEggSword } from 'madness-engine/weapons';

const sword = createMagicEggSword(GFX, {
  gripColor: '#ffffff',
  threadColor: '#f2c94c',
});
scene.add(sword.group);
sword.setGripColor('#f2eee2');
sword.setThreadColor('#e8b62f');
sword.setBladeMist(false);
```

