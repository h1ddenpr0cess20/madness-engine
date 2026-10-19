import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 8: Rio. Carnival, and the whole city out in the street for it.
 * Down from the top of the favela, the steps between the painted houses,
 * the wires strung over them loose and live; into the samba school's hall
 * where the drums are rehearsing, a snow globe in the costume store behind
 * the curtain; along the Sambadrome's avenue, the crowd surging out toward
 * the edge of it, the macaws over it all; through the fireworks off the
 * floats; into the shed where the floats are built, the drums swinging down
 * off the hoists, the first-aid post off it (the passport is in lost
 * property) and a globe across the pit on a plank; on a carnival float over
 * the gap; down the lift to the beach, and along Copacabana's waves to the
 * stage, the last globe behind the beach bar's painted sign. A samba
 * school: the surdos, a cavaquinho, the whistle.
 *
 * The mood of `rio`, a set in rocknroller-iii (src/venues/rio.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Rio de Janeiro',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#e8d8f0', ground: '#3a2a30', intensity: 1.15 },
    key: { color: '#fff0e0', intensity: 1.1 },
    lantern: { color: '#ffe0c0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#04081a', '#0a1430', '#1a2a50', '#3a3a6a', '#6a4a7a'],
    stars: true,
    skyline: '#0a0c18',
    horizon: 'sea',
  },
  room: { colors: ['#2adf6a', '#ffd23a', '#ff3a8a', '#3ab0ff'], ceiling: '#1a1c30' },
  film: {
    grade: 'tropical',
    filter: 'saturate(1.3) contrast(1.04) brightness(1.03)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-iii', theme: 'rio', tempo: 104 },
  palette: {
    tiles: ['#f0e0b8', '#e0cc9c', '#2a9a4a', '#d8c08c'],
    walls: ['#e8a040', '#d84a6a', '#2a9a4a', '#3a8ad8'],
    ambient: [1.05, 1, 0.95],
    lamp: '#ffe0a0',
    trap: '#2a2a2e',
    lift: '#2a9a4a',
    exit: '#ffd23a',
    zap: '#fff4a0',
    zapHue: 1.6,
    vary: 0.08,
  },
  look: {
    country: 'Brazil',
    poster: '#1a9a4a',
    grade: 'tropical',
    theme: 'rio',
    floor: 'mosaic',
    wall: 'stucco',
    lamp: 'bulb',
    crusher: 'surdo',
    lift: 'float',
    pyro: 'fireworks',
    gate: 'border',
    hemi: ['#e8d8f0', '#3a2a30', 1.15],
    key: '#fff0e0',
    keyK: 1.1,
    lantern: '#ffe0c0',
    skyColors: ['#04081a', '#0a1430', '#1a2a50', '#3a3a6a', '#6a4a7a'],
    stars: true,
    skyline: '#0a0c18',
    horizon: 'sea',
    reflect: ['#2adf6a', '#ffd23a', '#ff3a8a', '#3ab0ff'],
    ceiling: '#1a1c30',
    rig: { colors: ['#2adf6a', '#ffd23a', '#ff3a8a', '#3ab0ff'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
