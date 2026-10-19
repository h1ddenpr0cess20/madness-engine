import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 9: Sydney. The far side of the world, and the show is at the Opera
 * House. Off the top of the Harbour Bridge's arch, where the climbers go,
 * down the stairs inside it; across Circular Quay, the wharf crane dropping
 * crates on the beat and the harbour ferries the only way over the water,
 * a snow globe through the glass of the Opera House's foyer; down to the
 * Rocks, the beer garden where the barbecues flare on the beat; along
 * Bondi, the rip pulling everything out toward the edge, the surfers and
 * the lifeguards; and the surf club, the boards racked and the passport in
 * the lockers, a globe behind the club's back wall and another out on the
 * rock pool, a croc on the way. Surf rock at a gallop, and a didgeridoo.
 *
 * The mood of `sydney`, a set in rocknroller-iii (src/venues/sydney.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Sydney',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#c8d8f0', ground: '#3a3430', intensity: 1.1 },
    key: { color: '#fff0d8', intensity: 1.1 },
    lantern: { color: '#ffe0a8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#020814', '#061428', '#0e2440', '#1c3050', '#304060'],
    stars: true,
    skyline: '#05080e',
    horizon: 'sea',
  },
  room: { colors: ['#ffe0a8', '#f4f6ff', '#3ab0ff', '#ff8a3a'], ceiling: '#1e2230' },
  film: {
    grade: 'tropical',
    filter: 'saturate(1.3) contrast(1.04) brightness(1.03)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-iii', theme: 'sydney', tempo: 160 },
  palette: {
    tiles: ['#c8c4b8', '#b4b0a4', '#3a8ad8', '#a8a498'],
    walls: ['#d8d4c8', '#c4c0b4', '#3a8ad8', '#b4b0a4'],
    ambient: [1, 1, 1.02],
    lamp: '#ffe0a8',
    trap: '#1a2a3a',
    lift: '#2a6a3a',
    exit: '#ffd23a',
    zapHue: 0.6,
    vary: 0.06,
  },
  look: {
    country: 'Australia',
    poster: '#1a8ad8',
    grade: 'tropical',
    theme: 'sydney',
    floor: 'concrete',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'crate',
    lift: 'ferry',
    gate: 'border',
    hemi: ['#c8d8f0', '#3a3430', 1.1],
    key: '#fff0d8',
    keyK: 1.1,
    lantern: '#ffe0a8',
    skyColors: ['#020814', '#061428', '#0e2440', '#1c3050', '#304060'],
    stars: true,
    skyline: '#05080e',
    horizon: 'sea',
    reflect: ['#ffe0a8', '#f4f6ff', '#3ab0ff', '#ff8a3a'],
    ceiling: '#1e2230',
    rig: { colors: ['#ffe0a8', '#f4f6ff'], program: 'pulse', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
