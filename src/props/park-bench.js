/**
 * The park bench from the tour's sights, on its own in the asset viewer: five
 * walnut slats on the seat, three on the back, cast-iron ends. `rise` is the
 * height of the back.
 */
import { SIGHTS } from '../scenery/gear/tour.js';

export const assetViewer = Object.freeze({
  id: 'park-bench',
  name: 'Park bench (walnut slats, iron ends)',
  category: 'Props',
  group: 'street',
  options: {},
  build({ GFX, rise = 0.8 }) {
    const { group } = SIGHTS.bench(GFX, { rise });
    group.name = 'park bench';
    return { group };
  },
});
