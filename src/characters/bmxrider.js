import { cloth } from './person.js';
import { bikeRider } from './bike-rider.js';

/** A generic BMX rider: baggy tee, shorts, skate shoes and a bright helmet. */
export default bikeRider({
  name: 'bmxrider',
  bmx: true,
  helmet: true,
  skin: '#c98f6b',
  shirt: '#d34c36',
  trousers: '#34383e',
  shoes: '#24262b',
  shorts: true,
  frame: '#c83a2a',
  hair: {
    color: cloth('#241810', '#120c08'),
    cap: [0.105, 0.095, 0.105],
    locks: [
      [[0.07, 0.7, 0.02], [0.09, 0.64, -0.04], 0.025],
      [[-0.07, 0.7, 0.02], [-0.09, 0.64, -0.04], 0.025],
    ],
  },
});
