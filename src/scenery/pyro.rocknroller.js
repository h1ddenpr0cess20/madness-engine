import { glowTexture } from '../textures/venue.rocknroller.js';

/**
 * What moves, and what lies about, as it is drawn: speaker stacks that slam
 * down on the beat, pyro in the floor, lifts, security gates, flimsy panels,
 * bumpers and the pickups. Each `create…` gives { group, update(...) }; the
 * logic is in actors.js.
 */

const dark = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });

/** Pyro: a grating in the floor with a pilot light in it; on the beat it bursts into a column of flame. */
export function createPyroMesh(GFX, { x, z, w, d }) {
  const group = new GFX.Group();
  const iron = dark(GFX, '#2b2b30', { metalness: 0.8, roughness: 0.4 });
  const flameMat = new GFX.MeshBasicMaterial({ color: new GFX.Color('#ff7a1a'), transparent: true, opacity: 0.85, toneMapped: false, blending: GFX.AdditiveBlending, depthWrite: false });
  const coreMat = new GFX.MeshBasicMaterial({ color: new GFX.Color('#fff2b0'), transparent: true, opacity: 0.95, toneMapped: false, blending: GFX.AdditiveBlending, depthWrite: false });
  const glow = glowTexture(GFX).map;
  const haloMat = glow ? new GFX.SpriteMaterial({ map: glow, color: new GFX.Color('#ffa050'), blending: GFX.AdditiveBlending, depthWrite: false, opacity: 0.8 }) : null;
  const jets = [];
  const flameGeometry = new GFX.ConeGeometry(0.18, 1, 10);
  const coreGeometry = new GFX.ConeGeometry(0.09, 1, 8);
  for (let j = 0; j < d; j++) {
    for (let i = 0; i < w; i++) {
      const cell = new GFX.Group();
      cell.position.set(x + i + 0.5, 0, z + j + 0.5);
      const plate = new GFX.Mesh(new GFX.BoxGeometry(0.8, 0.03, 0.8), iron);
      plate.position.y = 0.012;
      cell.add(plate);
      // Slots in the plate.
      for (let k = -2; k <= 2; k++) {
        const slot = new GFX.Mesh(new GFX.BoxGeometry(0.62, 0.035, 0.05), dark(GFX, '#050506', { roughness: 1 }));
        slot.position.set(0, 0.014, k * 0.14);
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
        const pilot = warn > 0 && out < 0.01;
        const h = out > 0.01 ? 0.35 + out * 1.25 : pilot ? 0.1 + warn * 0.18 + Math.sin(time * 40 + j.seed) * 0.02 : 0;
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
