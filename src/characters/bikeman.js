import { cloth } from './person.js';
import { bikeRider } from './bike-rider.js';

/** A generic adult man on a practical, black-framed bicycle. */
export default bikeRider({
  name: 'bikeman',
  skin: '#d8a888',
  shirt: '#3b7092',
  trousers: '#34465e',
  shoes: '#24262b',
  frame: '#20252b',
  hair: {
    color: cloth('#302219', '#1b130e'),
    cap: [0.108, 0.098, 0.108],
    locks: [
      [[0.08, 0.7, 0.01], [0.1, 0.64, -0.04], 0.025],
      [[-0.08, 0.7, 0.01], [-0.1, 0.64, -0.04], 0.025],
    ],
  },
});
