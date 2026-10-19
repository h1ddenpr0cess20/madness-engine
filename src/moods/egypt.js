import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.js';

/**
 * Stop 6: Egypt. The show is at the foot of the pyramids, and the sand is
 * blowing. In off the street into the bazaar, the stalls in rows and a
 * seller at every one of them (a snow globe in a jeweller's back room,
 * behind the cloth); down to the river, and across the Nile on a felucca;
 * along the road through the old quarry, the blocks coming down off the
 * cliff on the beat as they did for the builders; the archaeologists' tent,
 * the passport left on their table and a globe behind a wall of crates;
 * over the dunes, where the sand gives way and the Mummy is out; through
 * the gate into the pyramid, and down to the king's chamber, the traps
 * spouting sand on the beat, and across the pit to the treasury, where the
 * last globe is. The darbuka's maqsum, strings, an oud.
 *
 * The mood of `egypt`, a set in rocknroller-iii (src/venues/egypt.js): its
 * light, its sky and what its chrome reflects, the film it is shot on, its
 * weather and its music, as the game has them. `stage.setMood(mood)` dresses
 * a stage in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'Egypt',
  game: 'rocknroller-iii',
  light: {
    hemisphere: { sky: '#ffe8c8', ground: '#6a4a28', intensity: 1.15 },
    key: { color: '#ffe8c8', intensity: 1.15 },
    lantern: { color: '#ffd8a8', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: {
    sky: ['#1a1030', '#3a2040', '#8a4a3a', '#d8803a', '#f0c060'],
    stars: true,
    skyline: '#3a2414',
    horizon: 'dunes',
  },
  room: { colors: ['#ffc070', '#3ab0d8', '#ffd23a', '#ff8a3a'], ceiling: '#3a2a18' },
  film: {
    grade: 'warm',
    filter: 'sepia(0.24) saturate(1.25) contrast(1.05) brightness(1.03)',
    grain: null,
    vignette: 'radial-gradient(ellipse at center, rgba(214,170,100,0.22) 30%, rgba(150,100,40,0.55) 100%)',
    ui: null,
  },
  weather: 'sand',
  music: { band: 'music/band.rocknroller-iii', theme: 'egypt', tempo: 108 },
  palette: {
    tiles: ['#e0c088', '#d0ae74', '#3a8ab0', '#c4a068'],
    walls: ['#d8b880', '#c8a46a', '#3a8ab0', '#b8925a'],
    ambient: [1.08, 0.98, 0.86],
    lamp: '#ffc070',
    trap: '#3a2a18',
    lift: '#e8dcc0',
    exit: '#ffd23a',
    sticky: '#c8a060',
    zapHue: 0.15,
    vary: 0.07,
  },
  look: {
    country: 'Egypt',
    poster: '#d8a030',
    grade: 'warm',
    weather: 'sand',
    theme: 'egypt',
    floor: 'sand',
    wall: 'sandstone',
    lamp: 'bulb',
    crusher: 'block',
    lift: 'felucca',
    pyro: 'sand',
    gate: 'bars',
    hemi: ['#ffe8c8', '#6a4a28', 1.15],
    key: '#ffe8c8',
    keyK: 1.15,
    lantern: '#ffd8a8',
    skyColors: ['#1a1030', '#3a2040', '#8a4a3a', '#d8803a', '#f0c060'],
    stars: true,
    skyline: '#3a2414',
    horizon: 'dunes',
    reflect: ['#ffc070', '#3ab0d8', '#ffd23a', '#ff8a3a'],
    ceiling: '#3a2a18',
    rig: { colors: ['#ffc070', '#3ab0d8', '#ffd23a', '#ff8a3a'], program: 'static', every: 4 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
