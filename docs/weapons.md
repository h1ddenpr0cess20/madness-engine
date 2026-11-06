# Weapons

Weapons are separate from generic props and heroes. The viewer lists them under
**Weapons**, and new weapon families should be added as measured assets under
`src/weapons/`.

## Scale convention

Weapon dimensions use metres: **one Madness Engine world unit represents one
metre**. The weapon's published overall length excludes its display stand.
The viewer's bounds include the marble stand so the entire presentation is
framed. Keep each weapon at its real dimensions; do not normalize different
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

`createBroadsword(GFX, options)` builds a point-up broadsword on a separate
two-tier marble display block. The blade and hilt each accept one of the 12
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

Published dimensions (excluding the stand): 0.99 m overall, 0.78 m blade,
52 mm maximum blade width, 140 mm grip, and 220 mm crossguard span.
