import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller-ii.js';

/**
 * Reel 3: The Western. A frontier town on the backlot, shot day-for-night
 * and printed in sepia: down off Boot Hill among the headstones, along Main
 * Street, its mud churned to soup between the troughs and the barrels, a
 * reel in the bank's vault behind a balsa wall; into the saloon, where an
 * extra has been drinking the prop whiskey, and the mirror behind the bar is
 * sugar glass with a reel behind it; out the back past the sheriff's office (the pass is on
 * his desk), the livery and its pantomime horse; and down into the mine,
 * barred until the pass opens it, where crates come down off the hoist, the
 * effects crew's dynamite goes off on the beat, and a mine cart is the way
 * across the chasm. A whistle over a train beat, and twangy guitars at a
 * gallop.
 *
 * The mood of `western`, a set in rocknroller-ii (src/venues/western.js):
 * its light, its sky and what its chrome reflects, the film it is shot on,
 * its weather and its music, as the game has them. `stage.setMood(mood)`
 * dresses a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Western',
  game: 'rocknroller-ii',
  light: {
    hemisphere: { sky: '#f0d8b8', ground: '#5a3a28', intensity: 1.1 },
    key: { color: '#ffe8c8', intensity: 1.1 },
    lantern: { color: '#ffd8a8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#0a0614', '#1a0e22', '#3a1a2a', '#6a2a22', '#a8481a'], stars: true, skyline: '#140a0a' },
  room: { colors: ['#ffb860', '#ff7a3a', '#ffd890'], ceiling: '#3a2418' },
  film: {
    grade: 'sepia',
    filter: 'sepia(0.42) saturate(1.15) contrast(1.06)',
    grain: 0.07,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: null,
  music: { band: 'music/band.rocknroller-ii', theme: 'western', tempo: 132 },
  palette: {
    tiles: ['#b89a6a', '#a4865a', '#8a6a48', '#9a8060'],
    walls: ['#a8885e', '#94744c', '#7a5a3a', '#8a6c48'],
    ambient: [1, 0.92, 0.85],
    lamp: '#ffb860',
    trap: '#3a2a1e',
    lift: '#4a3a30',
    exit: '#ffb02a',
    sticky: '#5a3a1e',
    zapHue: 0.4,
    vary: 0.08,
  },
  look: {
    genre: 'Western',
    grade: 'sepia',
    theme: 'western',
    floor: 'dirt',
    wall: 'clapboard',
    lamp: 'bulb',
    crusher: 'crate',
    lift: 'cart',
    hemi: ['#f0d8b8', '#5a3a28', 1.1],
    key: '#ffe8c8',
    keyK: 1.1,
    lantern: '#ffd8a8',
    skyColors: ['#0a0614', '#1a0e22', '#3a1a2a', '#6a2a22', '#a8481a'],
    stars: true,
    skyline: '#140a0a',
    reflect: ['#ffb860', '#ff7a3a', '#ffd890'],
    ceiling: '#3a2418',
    rig: { colors: ['#ffb860', '#ff7a3a', '#ffd890'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
