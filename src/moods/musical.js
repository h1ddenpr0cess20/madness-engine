import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Scene 4: The Musical. Sound Stage 4, the big number, shot in Technicolor:
 * out of the dressing rooms along the corridor of mirrors, down a grand
 * staircase lined with bulbs, onto the ballroom floor under the one mirror
 * ball on the lot, a line of hoofers going through their steps and lit
 * cubes to dance on (or bounce off); a reel behind the painted sky, another
 * across the orchestra pit on a plank; the stage elevator down to the
 * understage, where the make-up artist has the pass and the wardrobe hides
 * the last reel; and out onto the soundstage floor among the cameras, where
 * the Director wants it again, bigger, with feeling, and lunges for the
 * close-up. A big band, swinging.
 *
 * The mood of `musical`, a set in rocknroller-ii (src/venues/musical.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Musical',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#ffd8e8', ground: '#3a2040', intensity: 1.15 },
    key: { color: '#fff0f0', intensity: 1.1 },
    lantern: { color: '#ffe0d0', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#06020e', '#10061e', '#1c0a30', '#2c1040', '#3a1448'] },
  room: { colors: ['#ff3a5a', '#ffd23a', '#3a7aff', '#ff7ad0'], ceiling: '#2a1438' },
  film: {
    grade: 'technicolor',
    filter: 'saturate(1.35) contrast(1.08)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'musical', tempo: 140 },
  palette: {
    tiles: ['#c8303a', '#a8202e', '#e8b84a', '#8a2030'],
    walls: ['#3a4ab0', '#2a3a98', '#e8b84a', '#24307a'],
    ambient: [1.05, 0.95, 1],
    lamp: '#ffe0a0',
    trap: '#2a1a2a',
    lift: '#3a2a3a',
    exit: '#ffd23a',
    zapHue: 4.2,
    vary: 0.05,
  },
  look: {
    genre: 'Musical',
    grade: 'technicolor',
    theme: 'musical',
    floor: 'planks',
    wall: 'curtain',
    lamp: 'bulb',
    crusher: 'rig',
    lift: 'riser',
    hemi: ['#ffd8e8', '#3a2040', 1.15],
    key: '#fff0f0',
    keyK: 1.1,
    lantern: '#ffe0d0',
    skyColors: ['#06020e', '#10061e', '#1c0a30', '#2c1040', '#3a1448'],
    reflect: ['#ff3a5a', '#ffd23a', '#3a7aff', '#ff7ad0'],
    ceiling: '#2a1438',
    rig: { colors: ['#ff3a5a', '#ffd23a', '#3a7aff', '#ff7ad0'], program: 'chase', every: 2 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
