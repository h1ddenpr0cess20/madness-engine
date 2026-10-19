import { paintRoom } from '../textures/rooms/venue.metroll.js';
import { paintSky } from '../textures/skies/horizons.js';

/**
 * Track 12: Wacken, 2008. Everything, at once, in a field in Schleswig-Holstein
 * with the rain coming sideways: the whole history of the record in a
 * hundred thousand people wearing horned helmets. The campsite and the
 * camp road, with the kegs coming down on the beat and the fire brigade
 * hosing everybody; the mud, which is up to the knee, and the tractors that
 * pull the trucks out of it; the trailer across the flooded trench; the
 * medieval village in the next field, where there are knights, wizards,
 * and a sword-seller; the gate backstage; and the main stage, where
 * somebody who has been waiting for you for a very long time is sitting in
 * the middle of the floor, exactly as he always was. He was here first. He has
 * thoughts about the spikes. He is, and this should be noted, a rock.
 *
 * The mood of `wacken`, a set in metroll (src/venues/wacken.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Wacken',
  game: 'metroll',
  light: {
    hemisphere: { sky: '#a0b0c8', ground: '#14100c', intensity: 0.9 },
    key: { color: '#d8e0f0', intensity: 0.85 },
    lantern: { color: '#ffd890', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#0a0e18', '#1a2230', '#2e3a4c', '#4a5a6a', '#7a8a94'],
    stars: false,
    skyline: '#0a0c10',
    horizon: 'festival',
    glow: '#e8202a',
  },
  room: { colors: ['#e8202a', '#f0c840', '#3a8ae8', '#f4f2ee'], ceiling: '#1a1810' },
  film: {
    grade: 'storm',
    filter: 'saturate(0.78) contrast(1.1) brightness(0.98)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    ui: null,
  },
  weather: 'rain',
  music: { band: 'music/band', theme: 'festival', tempo: 132 },
  palette: {
    tiles: ['#7a6a4a', '#5a4a32', '#8a7a5a', '#6a5a3e'],
    walls: ['#6a5a3a', '#4a3a28', '#7a6a4a', '#5a4a32'],
    ambient: [0.85, 0.9, 0.95],
    lamp: '#ffcf80',
    trap: '#0c0a08',
    lift: '#5a4a2a',
    exit: '#e8202a',
    sticky: '#3a2a14',
    vary: 0.1,
  },
  look: {
    place: 'Wacken',
    year: 2008,
    genre: 'Everything',
    poster: '#a82028',
    grade: 'storm',
    weather: 'rain',
    voice: 'festival',
    theme: 'festival',
    floor: 'mud',
    wall: 'plywood',
    lamp: 'bulb',
    crusher: 'keg',
    lift: 'trailer',
    pyro: 'steam',
    gate: 'border',
    hemi: ['#a0b0c8', '#14100c', 0.9],
    key: '#d8e0f0',
    keyK: 0.85,
    lantern: '#ffd890',
    skyColors: ['#0a0e18', '#1a2230', '#2e3a4c', '#4a5a6a', '#7a8a94'],
    stars: false,
    skyline: '#0a0c10',
    horizon: 'festival',
    glow: '#e8202a',
    reflect: ['#e8202a', '#f0c840', '#3a8ae8', '#f4f2ee'],
    ceiling: '#1a1810',
    rig: { colors: ['#e8202a', '#f0c840'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
