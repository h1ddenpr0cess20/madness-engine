import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 5: The Space Picture. A starship built on Stage 12 out of plywood
 * and fairy lights, the stars painted on the cyclorama behind it: out of the
 * airlock, along a corridor where the plasma conduits run live either side,
 * onto the bridge on red alert (a reel in the captain's quarters, behind a
 * hull panel that is only painted ply); out along the hull on moving
 * walkways that run toward the edge, through the coolant vents, down the
 * engine room where the presses come down on the beat (a reel across the
 * reactor on a plank); the pass is in the sick bay, and the hangar is shut;
 * a flying saucer across the void, and down in the lift to the alien
 * planet, where the last reel is in a crater behind a painted sky. Robots,
 * rubber aliens, camera drones. Synths, four on the floor.
 *
 * The mood of `scifi`, a set in rocknroller-ii (src/venues/scifi.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Space Picture',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#c8e0ff', ground: '#2a2440', intensity: 1.1 },
    key: { color: '#e0f0ff', intensity: 1.05 },
    lantern: { color: '#d8f0ff', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#000004', '#02020c', '#060418', '#0c0624', '#140a30'], stars: true },
  room: { colors: ['#3ae8ff', '#ff3aff', '#ff3a3a', '#e0f0ff'], ceiling: '#141a2a' },
  film: {
    grade: 'scifi',
    filter: 'saturate(1.15) hue-rotate(8deg) contrast(1.05)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'scifi', tempo: 126 },
  palette: {
    tiles: ['#8a92a8', '#767e96', '#5ad8ff', '#5a6280'],
    walls: ['#9aa2b8', '#848ca4', '#5ad8ff', '#6a7290'],
    ambient: [0.9, 0.98, 1.1],
    lamp: '#9af0ff',
    trap: '#1e2230',
    lift: '#3a4058',
    exit: '#5af0ff',
    zap: '#ff3aff',
    zapHue: 5,
    vary: 0.04,
  },
  look: {
    genre: 'Science Fiction',
    grade: 'scifi',
    theme: 'scifi',
    floor: 'grate',
    wall: 'hull',
    lamp: 'bulb',
    crusher: 'piston',
    lift: 'saucer',
    pyro: 'steam',
    hemi: ['#c8e0ff', '#2a2440', 1.1],
    key: '#e0f0ff',
    keyK: 1.05,
    lantern: '#d8f0ff',
    skyColors: ['#000004', '#02020c', '#060418', '#0c0624', '#140a30'],
    stars: true,
    reflect: ['#3ae8ff', '#ff3aff', '#ff3a3a', '#e0f0ff'],
    ceiling: '#141a2a',
    rig: { colors: ['#3ae8ff', '#ff3aff'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
