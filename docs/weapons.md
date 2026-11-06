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
| Greatsword | 1.35–1.65 m | 1.00–1.25 m | Two-handed grip, longer crossguard |

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
  bladeMetal: 'steel',
  hiltMetal: 'silver',
  gripColor: '#633b2c',
});
scene.add(sword.group);
sword.setBladeMetal('chrome');
sword.setHiltMetal('brass');
sword.setGripColor('#75452e');
```

Published dimensions: approximately 0.99 m overall, 0.786 m blade,
52 mm maximum blade width, 140 mm grip, 220 mm crossguard span, and a 54 mm glass marble pommel with a hollow metal bezel between it and the 140 mm leather grip. Its solid blade has a fuller that fades out at 75% of blade length.
