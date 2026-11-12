/**
 * A board of any species from `textures/wood`, in any finish: the reusable
 * wood, as a prop to look at. A board is `length` by `width` by `thickness`
 * metres, lying flat on its face (+y), with its grain along its length (x).
 *
 * The finishes: `raw` (sawn, matt), `sanded` (a smooth oil-like satin), and
 * `lacquered` (a sealed clearcoat over the sanded face).
 */
import { WOOD_FINISHES, WOOD_SPECIES, woodTexture } from '../textures/wood.js';

/** What each finish does to a material: how rough, how much lacquer over it, how deep the bump reads. */
export const WOOD_LOOKS = Object.freeze({
  raw: { roughness: 0.82, clearcoat: 0, clearcoatRoughness: 0.5, bumpScale: 0.035 },
  sanded: { roughness: 0.5, clearcoat: 0, clearcoatRoughness: 0.5, bumpScale: 0.02 },
  lacquered: { roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.06, bumpScale: 0.012 },
});
const FINISH = WOOD_LOOKS;

/** Texture coordinates from the board's place: one repeat a metre, the grain along x on every face. */
function worldUV(GFX, geometry, scale) {
  const p = geometry.attributes.position, nrm = geometry.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[2 * i] = u * scale;
    uv[2 * i + 1] = v * scale;
  }
  geometry.setAttribute('uv', new GFX.BufferAttribute(uv, 2));
}

/** The board's material: the species in the finish, from the library's maps. */
export function woodBoardMaterial(GFX, species = 'walnut', finish = 'sanded') {
  if (!WOOD_FINISHES.includes(finish)) throw new Error(`wood-board: unknown finish "${finish}"`);
  const { map, bump } = woodTexture(GFX, species, finish);
  return new GFX.MeshPhysicalMaterial({
    name: `${finish} ${species}`,
    color: '#ffffff',
    map,
    bumpMap: bump,
    metalness: 0,
    ...FINISH[finish],
  });
}

export function createWoodBoard(GFX, { species = 'walnut', finish = 'sanded', length = 1.2, width = 0.2, thickness = 0.03 } = {}) {
  if (!Object.hasOwn(WOOD_SPECIES, species)) throw new Error(`wood-board: unknown species "${species}"`);
  if (!(length > 0.2 && length <= 3 && width > 0.05 && width <= 0.6 && thickness > 0.005 && thickness <= 0.1)) {
    throw new Error('wood-board: dimensions outside supported ranges');
  }
  const material = woodBoardMaterial(GFX, species, finish);
  const geometry = new GFX.BoxGeometry(length, thickness, width);
  // One repeat of the library's map is a metre of board: the same for every board of a species.
  worldUV(GFX, geometry, 1);
  const mesh = new GFX.Mesh(geometry, material);
  mesh.name = `${finish} ${species} board`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const group = new GFX.Group();
  group.name = 'wood board';
  group.add(mesh);
  group.userData.material = material;
  return { group, material };
}

export const assetViewer = Object.freeze({
  id: 'wood-board',
  name: 'Wood board (reusable wood texture)',
  category: 'Props',
  group: 'wood',
  options: {
    species: Object.keys(WOOD_SPECIES),
    finish: WOOD_FINISHES,
  },
  build({ GFX, species = 'walnut', finish = 'sanded' }) {
    return createWoodBoard(GFX, { species, finish });
  },
});
