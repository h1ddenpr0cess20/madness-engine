import { reflect } from '../reflect.js';
import { lamps } from '../../textures/rooms/parlour.js';

/**
 * What the glass and the brass reflect: the parlour (`textures/rooms/parlour.js`)
 * round the very night the backdrop shows, its lamps low in the dark, turned
 * over to put everything where the backdrop has it.
 */
export function buildEnvironment({ stage, GFX, sky }) {
  reflect(stage, GFX, sky, { mirror: true, paint: lamps });
}

/**
 * Light it like a fortune teller's table: one warm lamp high in front, the
 * stage's back fill put out, and the soft wash turned down and toward violet
 * so the visions are the brightest thing there. The light from the glass
 * itself is `index.js`'s — it changes colour with the mist.
 */
export function candlelight(stage) {
  if (stage._key) {
    stage._key.color.set('#ffd9a8');
    stage._key.intensity = 1.1;
  }
  if (stage._fill) stage._fill.visible = false;
  stage._scene?.traverse?.((o) => {
    if (o.isHemisphereLight) {
      o.color.set('#6a5a9a');
      o.groundColor.set('#1a1024');
      o.intensity = 0.55;
    }
  });
}
