import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 10: The Premiere. The last night of the shoot, and the first night
 * of the picture: Like a Rock opens at the movie palace on the boulevard,
 * and Rock is not on the guest list. Out of the limo onto the boulevard,
 * searchlights crossing over the hills; up the red carpet between the
 * velvet ropes, the paparazzi flashing and the fans wanting autographs, the
 * marquee over it all with his name on; into the lobby under the
 * chandeliers, the concession stand heaped with popcorn, a reel in the coat
 * check; through the doors (the usher has the pass) and down the raked
 * stalls, the rows of seats with an aisle in each, the rigs coming down
 * over them; across the orchestra pit on the fans' hands; and onto the
 * stage under the screen, where the giant gold statue stands and the Mogul
 * stamps. The main title again, with the brass out.
 *
 * The mood of `premiere`, a set in rocknroller-ii (src/venues/premiere.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Premiere',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#ffe8d8', ground: '#4a2028', intensity: 1.15 },
    key: { color: '#fff0e0', intensity: 1.1 },
    lantern: { color: '#ffe8c8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#020410', '#060a1e', '#0e1430', '#1c1c40', '#302848'], stars: true, skyline: '#05060c' },
  room: { colors: ['#ffd23a', '#f4f0ff', '#ff3a4a', '#d8e8ff'], ceiling: '#2a1620' },
  film: {
    grade: null,
    filter: null,
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'finale', tempo: 146 },
  palette: {
    tiles: ['#b82030', '#9a1a28', '#e8b84a', '#7a1420'],
    walls: ['#c8a050', '#b08840', '#e8c060', '#9a7838'],
    ambient: [1.05, 0.98, 0.95],
    lamp: '#ffe0a0',
    trap: '#2a1a1e',
    lift: '#3a2a2e',
    exit: '#ffd23a',
    zapHue: 1.2,
    vary: 0.04,
  },
  look: {
    genre: 'Premiere',
    theme: 'finale',
    floor: 'carpet',
    wall: 'damask',
    lamp: 'bulb',
    crusher: 'rig',
    lift: 'crowd',
    hemi: ['#ffe8d8', '#4a2028', 1.15],
    key: '#fff0e0',
    keyK: 1.1,
    lantern: '#ffe8c8',
    skyColors: ['#020410', '#060a1e', '#0e1430', '#1c1c40', '#302848'],
    stars: true,
    skyline: '#05060c',
    reflect: ['#ffd23a', '#f4f0ff', '#ff3a4a', '#d8e8ff'],
    ceiling: '#2a1620',
    rig: { colors: ['#ffd23a', '#f4f0ff'], program: 'chase', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
