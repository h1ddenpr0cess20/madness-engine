import { reflect } from '../reflect.js';
import { paintRoom } from '../../textures/rooms/softbox.js';

/** What the glossy skin reflects: the softbox room (`textures/rooms/softbox.js`), two soft lights high up. */
export function buildEnvironment({ stage, GFX }) {
  reflect(stage, GFX, paintRoom());
}
