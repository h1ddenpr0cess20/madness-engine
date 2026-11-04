import { cloth } from './person.js';
import { bikeRider } from './bike-rider.js';

/** A generic adult woman on a practical city bicycle. */
export default bikeRider({
  name: 'bikewoman',
  skin: '#edbd9a',
  shirt: '#b84e68',
  sleeves: '#b84e68',
  trousers: '#303943',
  shoes: '#24262b',
  frame: '#55436d',
  hair: {
    color: cloth('#6a3a22', '#3a2014'),
    cap: [0.108, 0.1, 0.108],
    locks: [
      [[0.07, 0.74, 0.04], [0.105, 0.66, 0.055], 0.032],
      [[-0.07, 0.74, 0.04], [-0.105, 0.66, 0.055], 0.032],
      [[0.09, 0.7, -0.02], [0.12, 0.59, -0.08], 0.03],
      [[-0.09, 0.7, -0.02], [-0.12, 0.59, -0.08], 0.003],
      [[0, 0.72, -0.09], [0, 0.59, -0.13], 0.036],
    ],
  },
});
