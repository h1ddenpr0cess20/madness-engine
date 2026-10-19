import { paintRoom } from '../textures/rooms/venue.js';
import { paintSky } from '../textures/skies/skyline.rocknroller.js';

/**
 * Act 4: The Club. A basement dance club at two in the morning. It starts
 * in the queue: a velvet rope doubling back and forth along the street,
 * brass posts that throw Rock about, a scalper working the line. Down the
 * stairs is the cloakroom, and then the dance floor — the only mirror ball
 * on the tour, go-go podiums to bounce off, lasers raking the room, the DJ
 * on a riser with a record in the booth behind him. The way across the
 * mosh pit is on the crowd's hands; past it, a bar with the floor sticky
 * in front, the VIP rope (its pass is in the toilets, with a bouncer), and
 * the Promoter's office, where he lunges for his cut.
 *
 * The mood of `club`, a set in rocknroller (src/venues/club.js): its light,
 * its sky and what its chrome reflects, the film it is shot on, its weather
 * and its music, as the game has them. `stage.setMood(mood)` dresses a stage
 * in it. `look` and `palette` are the set's own.
 */
const mood = {
  name: 'The Club',
  game: 'rocknroller',
  light: {
    hemisphere: { sky: '#d8c4ff', ground: '#4a2a70', intensity: 1.15 },
    key: { color: '#ffe8ff', intensity: 1.1 },
    lantern: { color: '#ffd8f4', intensity: 1.1, distance: 22, decay: 0.9, height: 7 },
  },
  sky: { sky: ['#06020e', '#0e0620', '#1a0a38', '#2c1058', '#44186a'] },
  room: { colors: ['#ff2d95', '#2de2ff', '#a23aff', '#7cff3a'], ceiling: '#2a1648' },
  film: null,
  weather: null,
  music: { band: 'music/band.rocknroller', theme: 'club', tempo: 126 },
  palette: {
    tiles: ['#6a4a9a', '#563a86', '#8a4aa8', '#7a5aa6'],
    walls: ['#5a3a8a', '#4a2e7a', '#7a3a90', '#6a4a96'],
    ambient: [0.9, 0.85, 1.05],
    lamp: '#ff7ad0',
    trap: '#22182e',
    lift: '#3a2a52',
    exit: '#2de2ff',
    zapHue: 5.3,
    vary: 0.06,
  },
  look: {
    theme: 'club',
    floor: 'panels',
    wall: 'curtain',
    lamp: 'par',
    exitSign: 'OUT',
    ampName: 'CLUB',
    hemi: ['#d8c4ff', '#4a2a70', 1.15],
    key: '#ffe8ff',
    keyK: 1.1,
    lantern: '#ffd8f4',
    skyColors: ['#06020e', '#0e0620', '#1a0a38', '#2c1058', '#44186a'],
    reflect: ['#ff2d95', '#2de2ff', '#a23aff', '#7cff3a'],
    ceiling: '#2a1648',
    rig: { colors: ['#ff2d95', '#2de2ff', '#a23aff'], program: 'chase', every: 1 },
  },
};

/** Its sky and what its chrome reflects, painted on canvases, as `stage.setSky` and `stage.setRoom` take them. */
mood.paintSky = (options) => paintSky({ ...mood.sky, ...options });
mood.paintRoom = (options) => paintRoom({ ...mood.room, ...options });

export default mood;
