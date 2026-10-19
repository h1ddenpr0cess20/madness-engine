import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 8: The Swashbuckler. A galleon built full size in the studio's big
 * tank, and an island at the far end of it: down from the crow's nest by
 * the rigging, the parrot circling; over the quarterdeck, past the wheel,
 * where the powder kegs go up on the beat; the length of the main deck
 * under the yardarm, cargo swinging down off it, the cannons run out along
 * the rail and a reel at the end of the plank; down the hatch into the
 * hold, the captain's cabin with the pass and a reel in a sea chest behind
 * a bulkhead; out by the barred gun port onto the dock, a rowing boat
 * across the tank, and Treasure Island, where the last reel is buried.
 * A fiddle, a snare marching, strings sawing away.
 *
 * The mood of `pirate`, a set in rocknroller-ii (src/venues/pirate.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Swashbuckler',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#c8d8f0', ground: '#3a2a20', intensity: 1.1 },
    key: { color: '#fff0d8', intensity: 1.1 },
    lantern: { color: '#ffe0b0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#02040c', '#060c1c', '#0c1830', '#14243e', '#203048'], stars: true },
  room: { colors: ['#ffc070', '#ffd23a', '#3a9ad8', '#f4ead0'], ceiling: '#1a2030' },
  film: {
    grade: null,
    filter: null,
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'pirate', tempo: 112 },
  palette: {
    tiles: ['#9a7a52', '#86684a', '#c8a868', '#7a5c40'],
    walls: ['#8a6a48', '#76583c', '#a88858', '#6a4e36'],
    ambient: [1, 0.95, 0.9],
    lamp: '#ffc070',
    trap: '#3a2a1e',
    lift: '#5a4030',
    exit: '#ffd23a',
    sticky: '#4a3a2a',
    zapHue: 3.4,
    vary: 0.07,
  },
  look: {
    genre: 'Swashbuckler',
    theme: 'pirate',
    floor: 'planks',
    wall: 'clapboard',
    lamp: 'bulb',
    crusher: 'crate',
    lift: 'raft',
    hemi: ['#c8d8f0', '#3a2a20', 1.1],
    key: '#fff0d8',
    keyK: 1.1,
    lantern: '#ffe0b0',
    skyColors: ['#02040c', '#060c1c', '#0c1830', '#14243e', '#203048'],
    stars: true,
    reflect: ['#ffc070', '#ffd23a', '#3a9ad8', '#f4ead0'],
    ceiling: '#1a2030',
    rig: { colors: ['#ffc070', '#ffd23a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
