import { BURSTS } from './travel/index.js';
import { glowTexture } from '../textures/venue.js';

/**
 * What moves, and what lies about, as it is drawn: rigs and presses that
 * drop on the beat, pyro and steam in the floor, dollies and trams and the
 * rest of the lifts, closed sets' shutters, breakaways, bumpers and the
 * pickups. Each `create…` gives { group, update(...) }; the logic is in
 * actors.js.
 */

const dark = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });

/**
 * Pyro: a grating in the floor with a pilot light in it; on the beat it
 * bursts into a column of flame. Or (`look.pyro` 'steam') a manhole with
 * steam curling off it that, on the beat, blasts up white.
 */
export function createPyroMesh(GFX, { x, z, w, d, venue }) {
  const kind = venue?.look?.pyro;
  const burst = BURSTS[kind];
  // Steam, and the tour's snow cannons, sand spouts and fountains, billow up off a round plate; flame and fireworks lick up through a grating.
  const steam = kind === 'steam' || Boolean(burst?.billow);
  const colours = burst ?? (steam ? { flame: '#c8d0dc', core: '#ffffff', halo: '#dce4ee' } : { flame: '#ff7a1a', core: '#fff2b0', halo: '#ffa050' });
  const group = new GFX.Group();
  const iron = dark(GFX, '#2b2b30', { metalness: 0.8, roughness: 0.4 });
  const flameMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colours.flame), transparent: true, opacity: steam ? 0.45 : 0.85, toneMapped: false, blending: GFX.AdditiveBlending, depthWrite: false });
  const coreMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(colours.core), transparent: true, opacity: steam ? 0.5 : 0.95, toneMapped: false, blending: GFX.AdditiveBlending, depthWrite: false });
  const glow = glowTexture(GFX).map;
  const haloMat = glow ? new GFX.SpriteMaterial({ map: glow, color: new GFX.Color(colours.halo), blending: GFX.AdditiveBlending, depthWrite: false, opacity: 0.8 }) : null;
  const jets = [];
  const flameGeometry = steam ? new GFX.CylinderGeometry(0.34, 0.16, 1, 12) : new GFX.ConeGeometry(0.18, 1, 10);
  const coreGeometry = steam ? new GFX.CylinderGeometry(0.2, 0.1, 1, 10) : new GFX.ConeGeometry(0.09, 1, 8);
  for (let j = 0; j < d; j++) {
    for (let i = 0; i < w; i++) {
      const cell = new GFX.Group();
      cell.position.set(x + i + 0.5, 0, z + j + 0.5);
      const plate = new GFX.Mesh(steam ? new GFX.CylinderGeometry(0.42, 0.42, 0.03, 20) : new GFX.BoxGeometry(0.8, 0.03, 0.8), iron);
      plate.position.y = 0.012;
      cell.add(plate);
      // Slots in the plate: straight across a grating, round a manhole.
      for (let k = -2; k <= 2; k++) {
        const slot = new GFX.Mesh(steam ? new GFX.TorusGeometry(0.08 * (k + 3), 0.012, 4, 20) : new GFX.BoxGeometry(0.62, 0.035, 0.05), dark(GFX, '#050506', { roughness: 1 }));
        if (steam) slot.rotation.x = Math.PI / 2;
        slot.position.set(0, 0.014, steam ? 0 : k * 0.14);
        cell.add(slot);
      }
      const flame = new GFX.Mesh(flameGeometry, flameMat);
      const core = new GFX.Mesh(coreGeometry, coreMat);
      flame.visible = core.visible = false;
      cell.add(flame, core);
      let halo = null;
      if (haloMat) {
        halo = new GFX.Sprite(haloMat);
        halo.visible = false;
        cell.add(halo);
      }
      group.add(cell);
      jets.push({ cell, flame, core, halo, seed: i * 1.7 + j * 2.3 });
    }
  }
  return {
    group,
    update(out, warn, time, base) {
      for (const j of jets) {
        j.cell.position.y = base;
        const pilot = steam ? out < 0.01 : warn > 0 && out < 0.01;
        // Steam always curls off a manhole a little; a burst blasts it up.
        const h = out > 0.01 ? 0.35 + out * (steam ? 1.9 : 1.25) : pilot ? (steam ? 0.25 + warn * 0.4 + Math.sin(time * 3 + j.seed) * 0.05 : 0.1 + warn * 0.18 + Math.sin(time * 40 + j.seed) * 0.02) : 0;
        j.flame.visible = j.core.visible = h > 0.01;
        const wob = 1 + 0.12 * Math.sin(time * 31 + j.seed) + 0.07 * Math.sin(time * 47);
        j.flame.scale.set(out > 0.01 ? 1 : 0.5, h * wob, out > 0.01 ? 1 : 0.5);
        j.flame.position.y = h * wob / 2;
        j.core.scale.set(out > 0.01 ? 1 : 0.5, h * 0.62 * wob, out > 0.01 ? 1 : 0.5);
        j.core.position.y = h * 0.62 * wob / 2;
        if (j.halo) {
          j.halo.visible = out > 0.05;
          j.halo.position.y = h * 0.5 + 0.2;
          j.halo.scale.set(1.6 * out + 0.3, 1.6 * out + 0.3, 1);
        }
      }
    },
  };
}
