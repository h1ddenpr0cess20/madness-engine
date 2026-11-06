# Decorative ChatGPT Buckler

The buckler is a 44 cm round shield prop with a shallow convex, turned-metal
shell, a rolled perimeter, concentric chased beads, twelve peened studs, a
raised central boss and a recessed medallion engraved with the OpenAI Blossom
mark. The mark uses the original monochrome vector silhouette at its native
256 × 260 proportions, with a negative bump relief to read as engraved metal.

The reverse has two forged grip brackets, a leather cross-grip and a palm pad.
The shell and decorative trim use the shared `METALS` finish table and can be
changed independently. The default shell is silver and the rim, boss and
finework are gold.

```js
import * as GFX from 'madness-engine/gfx';
import { createBuckler } from 'madness-engine/props';

const buckler = createBuckler(GFX, {
  metal: 'silver',
  accentMetal: 'gold',
});

scene.add(buckler.group);
buckler.setMetal('platinum');
buckler.setAccentMetal('rose gold');
```

This is a decorative virtual asset, not an official OpenAI product or
endorsement. Use the mark only in accordance with the
[OpenAI brand guidelines](https://openai.com/brand/), which require the
provided mark to remain unaltered and prohibit implying sponsorship.
