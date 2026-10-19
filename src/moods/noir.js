import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 7: The Noir. Stage 9's city street, in black and white, in the rain
 * the effects crew have kept falling all night, and Rock narrating the whole
 * thing in a voice like a wet cigarette. Down off the hotel steps into a
 * street of wet asphalt and steaming manholes under the lamps, a downed
 * line fizzing in a puddle by the kerb; the detective's office up off the
 * street, the light through the blinds laying bars across the floor, a
 * dame waiting, the pass in the desk and a reel behind the frosted glass of
 * the inner office; down an alley where crates come off the hoist, into the
 * Rock Bottom Club, a basement of smoke and a piano, a reel in the back
 * room; out the back to the docks, a launch across the black water, and the
 * warehouse where Mr. Big waits among his crates under one bare bulb, and
 * moves only on the beat. Brushes, a walking bass, a sax in the rain.
 *
 * The mood of `noir`, a set in rocknroller-ii (src/venues/noir.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Noir',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#c8ccd8', ground: '#202024', intensity: 0.95 },
    key: { color: '#e8ecff', intensity: 1.15 },
    lantern: { color: '#f0f0f4', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#020204', '#06060a', '#0c0c10', '#141418', '#1c1c22'], skyline: '#040406' },
  room: { colors: ['#fff0d8', '#ffffff', '#ffd8b0', '#d8e4ff'], ceiling: '#141418' },
  film: {
    grade: 'noir',
    filter: 'grayscale(1) contrast(1.32) brightness(1.06)',
    grain: 0.16,
    vignette: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.72) 100%)',
    ui: 'grayscale(1) contrast(1.15)',
  },
  weather: 'rain',
  music: { band: 'music/band.rocknroller-ii', theme: 'noir', tempo: 84 },
  palette: {
    tiles: ['#6a6a6e', '#58585c', '#8a8a8e', '#4a4a4e'],
    walls: ['#7a7a7e', '#6a6a6e', '#5a5a5e', '#606064'],
    ambient: [0.9, 0.9, 0.95],
    lamp: '#fff0d8',
    trap: '#202024',
    lift: '#3a3a3e',
    exit: '#ffffff',
    zap: '#e8f0ff',
    zapHue: 3,
    vary: 0.07,
  },
  look: {
    genre: 'Film Noir',
    grade: 'noir',
    weather: 'rain',
    voice: 'noir',
    theme: 'noir',
    floor: 'asphalt',
    wall: 'brick',
    lamp: 'bulb',
    crusher: 'crate',
    lift: 'raft',
    pyro: 'steam',
    gate: null,
    hemi: ['#c8ccd8', '#202024', 0.95],
    key: '#e8ecff',
    keyK: 1.15,
    lantern: '#f0f0f4',
    skyColors: ['#020204', '#06060a', '#0c0c10', '#141418', '#1c1c22'],
    skyline: '#040406',
    reflect: ['#fff0d8', '#ffffff', '#ffd8b0', '#d8e4ff'],
    ceiling: '#141418',
    rig: { colors: ['#fff0d8', '#ffffff'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
