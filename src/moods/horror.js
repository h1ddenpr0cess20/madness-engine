import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 6: The Horror Picture. The haunted house on Stage 13, every bit of
 * it cobwebbed by the art department, shot on a stock that makes everyone
 * look a little dead: in through the graveyard, where the zombie extras
 * shamble between the headstones and the lightning (a machine on a stand)
 * goes now and then; a reel down in a tomb behind a slab of painted stone;
 * up to the house and into its great hall, a dining room where somebody has
 * loosened the chandeliers, a library with a secret passage behind a
 * bookcase, and a corridor slick with fake blood; then down past the barred
 * gate into the crypt, where the torches flare on the beat, the Mummy keeps
 * coming undone and the last reel is across the pit, on the altar. An
 * organ, a theremin, a heartbeat.
 *
 * The mood of `horror`, a set in rocknroller-ii (src/venues/horror.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Horror Picture',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#b8d0c8', ground: '#2a2028', intensity: 1 },
    key: { color: '#d8e8ff', intensity: 1 },
    lantern: { color: '#d8e0ff', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#020204', '#06060c', '#0c0c16', '#14121e', '#1c1824'],
    stars: false,
    skyline: '#030305',
  },
  room: { colors: ['#ffb070', '#7aff8a', '#e0e8ff', '#9a3aff'], ceiling: '#141018' },
  film: {
    grade: 'horror',
    filter: 'saturate(0.6) hue-rotate(-12deg) contrast(1.12) brightness(0.95)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'horror', tempo: 92 },
  palette: {
    tiles: ['#6a6670', '#58545e', '#7a3a3a', '#4a4650'],
    walls: ['#6a6670', '#5a5660', '#4a3a3a', '#504c56'],
    ambient: [0.85, 0.95, 0.9],
    lamp: '#ffb070',
    trap: '#2a1e1e',
    lift: '#3a3438',
    exit: '#9aff6a',
    sticky: '#6a0a0a',
    zapHue: 2.2,
    vary: 0.08,
  },
  look: {
    genre: 'Horror',
    grade: 'horror',
    theme: 'horror',
    floor: 'cobble',
    wall: 'stone',
    lamp: 'bulb',
    crusher: 'chandelier',
    lift: 'riser',
    hemi: ['#b8d0c8', '#2a2028', 1],
    key: '#d8e8ff',
    keyK: 1,
    lantern: '#d8e0ff',
    skyColors: ['#020204', '#06060c', '#0c0c16', '#14121e', '#1c1824'],
    stars: false,
    skyline: '#030305',
    reflect: ['#ffb070', '#7aff8a', '#e0e8ff', '#9a3aff'],
    ceiling: '#141018',
    rig: { colors: ['#ffb070', '#7aff8a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
