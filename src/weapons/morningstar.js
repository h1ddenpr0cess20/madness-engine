import { METALS } from '../props/metalglobe.js';
import { CORE, createMetalMorningStar, SPIKES, TIP } from '../heroes/morningstar.js';
import { createWeaponHandleAssembly, createDevilHornGuard, MARBLE_POMMEL_RADIUS, shadeHex } from './common.js';

/**
 * The existing engine Morningstar head, unchanged in geometry and spike
 * layout, fitted to a long polished-metal haft and the shared wrapped-leather
 * grip / marble pommel assembly. All dimensions are in metres.
 */
export const MORNINGSTAR_DIMENSIONS = Object.freeze({
  overallLength: 1.179,
  headScale: 0.11,
  headDiameter: TIP * 2 * 0.11,
  headCoreDiameter: CORE * 2 * 0.11,
  haftLength: 0.7,
  haftDiameter: 0.028,
  gripLength: 0.24,
  gripDiameter: 0.034,
  marbleRadius: MARBLE_POMMEL_RADIUS,
  marbleDiameter: MARBLE_POMMEL_RADIUS * 2,
  unit: 'm',
});

export const MORNINGSTAR_SPEC = Object.freeze({
  name: 'morningstar',
  ...MORNINGSTAR_DIMENSIONS,
});

export function createMorningstar(GFX, {
  metal = 'steel',
  gripColor = '#633b2c',
  detail = 1,
  pommelStyle = 'marble',
  wrapStyle = 'banded',
  guardStyle = 'none',
} = {}) {
  const finish = METALS[metal];
  if (!finish) throw new Error(`no metal called ${metal}`);
  if (!Number.isFinite(detail) || detail <= 0) throw new RangeError('detail must be a positive number');

  const group = new GFX.Group();
  group.name = 'morningstar display';
  const handle = createWeaponHandleAssembly(GFX, group, MORNINGSTAR_SPEC, {
    hiltMetal: metal,
    gripColor,
    pommelStyle,
    wrapStyle,
  });

  // The haft begins at the shared fitted metal seat and ends at the lower
  // surface of the unchanged Morningstar core.
  const haftBottom = handle.bossSeatBounds.top;
  const haftTop = haftBottom + MORNINGSTAR_SPEC.haftLength;
  const coreRadius = CORE * MORNINGSTAR_SPEC.headScale;
  const headCenterY = haftTop + coreRadius;
  const shaftMaterial = handle.hiltMaterial;
  const shaft = new GFX.Mesh(
    new GFX.CylinderGeometry(
      MORNINGSTAR_SPEC.haftDiameter / 2,
      MORNINGSTAR_SPEC.haftDiameter / 2,
      MORNINGSTAR_SPEC.haftLength,
      40,
      1,
    ),
    shaftMaterial,
  );
  shaft.name = 'polished metal haft';
  shaft.position.set(0, (haftBottom + haftTop) / 2, 0);
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  handle.hilt.add(shaft);

  let guard = null;
  if (guardStyle === 'horns') {
    guard = createDevilHornGuard(GFX, handle.hilt, shaftMaterial, {
      centerY: haftTop,
      span: 0.20,
      thickness: MORNINGSTAR_SPEC.haftDiameter * 0.46,
    });
  } else if (guardStyle !== 'swept' && guardStyle !== 'none') {
    throw new Error(`unknown morningstar guard style: ${guardStyle}`);
  }

  // The source head's core and spike geometries are not rebuilt or modified.
  // A parent transform gives the complete original head its measured size.
  const head = createMetalMorningStar(GFX, { metal, spikes: SPIKES, detail });
  head.group.scale.setScalar(MORNINGSTAR_SPEC.headScale);
  head.group.position.set(0, headCenterY, 0);
  head.group.name = 'original metal morningstar head';
  head.group.traverse((part) => {
    if (part.isMesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  group.add(head.group);

  let selectedMetal = metal;
  let selectedGripColor = gripColor;
  const api = {
    group,
    head,
    core: head.core,
    spikes: head.mesh,
    shaft,
    hilt: handle.hilt,
    handle: handle.handle,
    bezel: handle.bezel,
    guard,
    marble: handle.marble,
    pommelAsset: handle.pommelAsset,
    pommel: handle.pommelAsset.group,
    handleBounds: handle.handleBounds,
    gripBounds: handle.gripBounds,
    haftBounds: Object.freeze({ bottom: haftBottom, top: haftTop, length: MORNINGSTAR_SPEC.haftLength }),
    headCenterY,
    dimensions: Object.freeze({
      overallLength: headCenterY + TIP * MORNINGSTAR_SPEC.headScale,
      headDiameter: MORNINGSTAR_SPEC.headDiameter,
      headCoreDiameter: MORNINGSTAR_SPEC.headCoreDiameter,
      haftLength: MORNINGSTAR_SPEC.haftLength,
      haftDiameter: MORNINGSTAR_SPEC.haftDiameter,
      gripLength: MORNINGSTAR_SPEC.gripLength,
      marbleDiameter: handle.marble ? handle.marble.radius * 2 : null,
      pommelDiameter: handle.pommelAsset.radius * 2,
      pommelStyle: handle.pommelAsset.kind,
      guardStyle,
      wrapStyle,
      unit: 'm',
    }),
    info: {
      'Weapon length': `${(headCenterY + TIP * MORNINGSTAR_SPEC.headScale).toFixed(3)} m`,
      'Spiked head envelope': `${(MORNINGSTAR_SPEC.headDiameter * 1000).toFixed(0)} mm`,
      'Metal haft': `${(MORNINGSTAR_SPEC.haftLength * 1000).toFixed(0)} mm × ${(MORNINGSTAR_SPEC.haftDiameter * 1000).toFixed(0)} mm`,
      'Leather grip': `${(MORNINGSTAR_SPEC.gripLength * 1000).toFixed(0)} mm`,
      'Metal finish': selectedMetal,
      'Pommel': handle.pommelAsset.kind === 'marble' ? 'Glass marble with 3D spark'
        : handle.pommelAsset.kind === 'metal-ball' ? 'Solid metal ball' : 'Engine metal egg',
      'Guard': guardStyle === 'horns' ? 'Upward devil horns' : 'Original haft fitting',
      'Grip wrap': wrapStyle === 'diagonal' ? 'Diagonal leather helix' : 'Banded leather wrap',
      'Scale': '1 world unit = 1 metre',
    },
    get metal() { return selectedMetal; },
    get gripColor() { return selectedGripColor; },
    setMetal(name) {
      const next = METALS[name];
      if (!next) throw new Error(`no metal called ${name}`);
      head.setMetal(name);
      shaftMaterial.color.set(next.color);
      shaftMaterial.roughness = next.roughness;
      handle.pommelAsset.setMetal?.(name);
      selectedMetal = name;
      return api;
    },
    setGripColor(color) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new TypeError('gripColor must be a six-digit hex colour');
      handle.leatherMaterial.color.set(color);
      handle.wrapMaterial.color.set(shadeHex(color, 0.68));
      selectedGripColor = color;
      return api;
    },
  };

  return api;
}
