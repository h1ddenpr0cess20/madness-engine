/**
 * The shared metal palette and studio reflection environment, introduced by
 * the metal-globe asset work. Physical metal props use these same values.
 */

/** The metals: color of the polished metal, how rough its surface is. */
export const METALS = Object.freeze({
  steel: { color: '#c3c7cc', roughness: 0.34 },
  silver: { color: '#f3f1ec', roughness: 0.16 },
  gold: { color: '#ffd264', roughness: 0.2 },
  copper: { color: '#f08a68', roughness: 0.26 },
  bronze: { color: '#cf8a45', roughness: 0.34 },
  brass: { color: '#e0b84e', roughness: 0.28 },
  titanium: { color: '#9d9ea3', roughness: 0.42 },
  chrome: { color: '#fbfbfb', roughness: 0.04 },
  platinum: { color: '#e6e5e1', roughness: 0.18 },
  'rose gold': { color: '#f0aa9a', roughness: 0.22 },
  iron: { color: '#74747a', roughness: 0.52 },
  pewter: { color: '#a9a9a2', roughness: 0.4 },
});

/**
 * A bright studio to reflect, for metal to show itself in: soft boxes and a white floor on a dim room, as an
 * environment map made with `renderer`'s PMREM. Null where there is no renderer or no document.
 */
export function studioEnvironment(GFX, renderer) {
  if (!renderer || typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#9aa4b4'); sky.addColorStop(0.5, '#556070'); sky.addColorStop(0.52, '#c8c2b8'); sky.addColorStop(1, '#6a665e');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#ffffff';
  for (const [x, y, w, h] of [[120, 90, 180, 110], [470, 60, 220, 90], [780, 110, 160, 130], [300, 300, 120, 60]]) g.fillRect(x, y, w, h);
  const texture = new GFX.CanvasTexture(c);
  texture.mapping = GFX.EquirectangularReflectionMapping;
  const pmrem = new GFX.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture).texture;
  pmrem.dispose();
  texture.dispose();
  return environment;
}
