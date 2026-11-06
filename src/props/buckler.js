import { METALS, studioEnvironment } from './metalglobe.js';
import { createChatGPTMarkCanvas } from '../textures/chatgpt-mark.js';

export const BUCKLER_DIMENSIONS = Object.freeze({
  radius: 0.22,
  diameter: 0.44,
  shellDepth: 0.042,
  maxDepth: 0.058,
  gripLength: 0.246,
});

function metalMaterial(GFX, name, metal, roughnessOffset = 0) {
  const finish = METALS[metal];
  if (!finish) throw new Error(`no metal called ${metal}`);
  return new GFX.MeshPhysicalMaterial({
    name,
    color: new GFX.Color(finish.color),
    metalness: 1,
    roughness: Math.min(0.92, finish.roughness + roughnessOffset),
    clearcoat: 0.42,
    clearcoatRoughness: 0.12,
    envMapIntensity: 3,
  });
}

function shieldFaceProfile(GFX, radius) {
  return [
    [0, -0.008],
    [radius * 0.88, -0.008],
    [radius * 0.975, -0.004],
    [radius, 0.002],
    [radius * 0.988, 0.010],
    [radius * 0.92, 0.018],
    [radius * 0.78, 0.024],
    [radius * 0.55, 0.029],
    [radius * 0.28, 0.032],
    [0, 0.034],
  ].map(([r, z]) => new GFX.Vector2(r, z));
}

function faceZ(radiusRatio) {
  return 0.034 - 0.022 * Math.pow(Math.max(0, Math.min(1, radiusRatio)), 1.6);
}

/**
 * A hand-sized, convex round metal buckler with a rolled perimeter, chased
 * rings, peened studs, raised central boss, recessed OpenAI Blossom engraving
 * and a practical reverse cross-grip. The shell and decorative metalwork use
 * the shared METALS palette and can be changed independently.
 */
export function createBuckler(GFX, {
  radius = BUCKLER_DIMENSIONS.radius,
  metal = 'silver',
  accentMetal = 'gold',
  logo = null,
} = {}) {
  if (!Number.isFinite(radius) || radius < 0.16 || radius > 0.45) {
    throw new RangeError('buckler radius must be between 0.16 m and 0.45 m');
  }
  if (!METALS[metal]) throw new Error(`no metal called ${metal}`);
  if (!METALS[accentMetal]) throw new Error(`no metal called ${accentMetal}`);

  const group = new GFX.Group();
  group.name = 'ChatGPT engraved round metal buckler';

  const bodyMaterial = metalMaterial(GFX, 'buckler shell metal', metal);
  const accentMaterial = metalMaterial(GFX, 'buckler rolled rim and boss metal', accentMetal, 0.035);
  const fineAccentMaterial = metalMaterial(GFX, 'buckler fine chased metal', accentMetal, 0.12);
  const leatherMaterial = new GFX.MeshPhysicalMaterial({
    name: 'buckler rear handgrip leather',
    color: new GFX.Color('#24201b'),
    metalness: 0,
    roughness: 0.82,
    clearcoat: 0.12,
    clearcoatRoughness: 0.45,
  });

  // One continuous turned dish, convex on the presentation face.
  const body = new GFX.Mesh(new GFX.LatheGeometry(shieldFaceProfile(GFX, radius), 192), bodyMaterial);
  body.name = 'buckler convex round shell';
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Rolled outer rim with two turned decorative beads.
  const outerRim = new GFX.Mesh(
    new GFX.TorusGeometry(radius * 0.972, radius * 0.026, 20, 192),
    accentMaterial,
  );
  outerRim.name = 'buckler rolled outer rim';
  outerRim.position.z = 0.006;
  outerRim.castShadow = true;
  outerRim.receiveShadow = true;
  group.add(outerRim);

  const borderBead = new GFX.Mesh(
    new GFX.TorusGeometry(radius * 0.82, radius * 0.009, 12, 160),
    fineAccentMaterial,
  );
  borderBead.name = 'buckler outer chased bead';
  borderBead.position.z = faceZ(0.82);
  group.add(borderBead);

  const innerBead = new GFX.Mesh(
    new GFX.TorusGeometry(radius * 0.69, radius * 0.006, 10, 144),
    accentMaterial,
  );
  innerBead.name = 'buckler inner decorative bead';
  innerBead.position.z = faceZ(0.69);
  group.add(innerBead);

  // Raised turned boss; the emblem sits in its recessed centre field.
  const bossProfile = [
    [0, 0],
    [radius * 0.32, 0],
    [radius * 0.35, 0.002],
    [radius * 0.35, 0.007],
    [radius * 0.31, 0.013],
    [0, 0.013],
  ].map(([r, z]) => new GFX.Vector2(r, z));
  const boss = new GFX.Mesh(new GFX.LatheGeometry(bossProfile, 128), accentMaterial);
  boss.name = 'buckler central boss';
  boss.rotation.x = Math.PI / 2;
  boss.position.z = 0.034;
  boss.castShadow = true;
  boss.receiveShadow = true;
  group.add(boss);

  const bossLip = new GFX.Mesh(
    new GFX.TorusGeometry(radius * 0.35, radius * 0.014, 14, 128),
    fineAccentMaterial,
  );
  bossLip.name = 'buckler boss rolled lip';
  bossLip.position.z = 0.046;
  group.add(bossLip);

  const emblemRadius = radius * 0.255;
  const markCanvas = logo ?? createChatGPTMarkCanvas();
  const engravingMap = markCanvas ? new GFX.CanvasTexture(markCanvas) : null;
  if (engravingMap) {
    engravingMap.name = 'OpenAI Blossom negative-relief engraving';
    engravingMap.flipY = true;
    engravingMap.anisotropy = 8;
  }

  const emblemMaterial = metalMaterial(GFX, 'buckler engraved ChatGPT medallion metal', metal, 0.12);
  emblemMaterial.bumpScale = -0.0016;
  if (engravingMap) emblemMaterial.bumpMap = engravingMap;
  const emblem = new GFX.Mesh(new GFX.CircleGeometry(emblemRadius, 192), emblemMaterial);
  emblem.name = 'ChatGPT logo engraved into buckler central medallion';
  emblem.position.z = 0.0485;
  emblem.castShadow = false;
  emblem.receiveShadow = true;
  group.add(emblem);

  const emblemBead = new GFX.Mesh(
    new GFX.TorusGeometry(emblemRadius * 1.12, radius * 0.008, 12, 128),
    accentMaterial,
  );
  emblemBead.name = 'buckler emblem fine bezel';
  emblemBead.position.z = 0.048;
  group.add(emblemBead);

  // Twelve peened studs are placed on the actual dish surface, with short
  // chased index marks between them.
  const rivetGeometry = new GFX.SphereGeometry(radius * 0.017, 20, 12);
  const tickGeometry = new GFX.BoxGeometry(radius * 0.025, radius * 0.004, 0.0025);
  const rivets = [];
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const rr = 0.85;
    const r = radius * rr;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const z = faceZ(rr);
    const rivet = new GFX.Mesh(rivetGeometry, accentMaterial);
    rivet.name = `buckler peened rim rivet ${i + 1}`;
    rivet.position.set(x, y, z + 0.001);
    rivet.scale.set(1, 1, 0.7);
    rivet.castShadow = true;
    group.add(rivet);
    rivets.push(rivet);

    const tick = new GFX.Mesh(tickGeometry, fineAccentMaterial);
    tick.name = `buckler radial chased index ${i + 1}`;
    const tickRadius = 0.73;
    tick.position.set(
      Math.cos(angle) * radius * tickRadius,
      Math.sin(angle) * radius * tickRadius,
      faceZ(tickRadius) + 0.001,
    );
    tick.rotation.z = angle;
    group.add(tick);
    ticks.push(tick);
  }

  // Reverse: forged handle mounts, a comfortable leather cross-grip and palm pad.
  const back = new GFX.Group();
  back.name = 'buckler reverse hand assembly';
  const handleLength = radius * 1.12;
  const bracketGeometry = new GFX.BoxGeometry(radius * 0.11, radius * 0.12, 0.012);
  for (const side of [-1, 1]) {
    const bracket = new GFX.Mesh(bracketGeometry, accentMaterial);
    bracket.name = side < 0 ? 'buckler lower grip bracket' : 'buckler upper grip bracket';
    bracket.position.set(0, side * radius * 0.25, -0.012);
    bracket.castShadow = true;
    back.add(bracket);
  }

  const grip = new GFX.Mesh(
    new GFX.CylinderGeometry(radius * 0.045, radius * 0.045, handleLength, 32),
    leatherMaterial,
  );
  grip.name = 'buckler rear leather crossgrip';
  grip.rotation.z = Math.PI / 2;
  grip.position.z = -0.031;
  grip.castShadow = true;
  back.add(grip);

  const palm = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.12, 32, 20), leatherMaterial);
  palm.name = 'buckler rear palm pad';
  palm.scale.set(1.25, 0.68, 0.38);
  palm.position.set(0, 0, -0.032);
  palm.castShadow = true;
  back.add(palm);
  group.add(back);

  const api = {
    group,
    body,
    boss,
    emblem,
    back,
    logoTexture: engravingMap,
    metal,
    accentMetal,
    radius,
    dimensions: Object.freeze({
      radius,
      diameter: radius * 2,
      shellDepth: BUCKLER_DIMENSIONS.shellDepth,
      maxDepth: BUCKLER_DIMENSIONS.maxDepth,
      handleLength,
    }),
    setMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      bodyMaterial.color.set(finish.color);
      bodyMaterial.roughness = finish.roughness;
      emblemMaterial.color.set(finish.color);
      emblemMaterial.roughness = Math.min(0.92, finish.roughness + 0.12);
      api.metal = name;
      return api;
    },
    setAccentMetal(name) {
      const finish = METALS[name];
      if (!finish) throw new Error(`no metal called ${name}`);
      for (const material of [accentMaterial, fineAccentMaterial]) {
        material.color.set(finish.color);
        material.roughness = material === accentMaterial
          ? finish.roughness
          : Math.min(0.92, finish.roughness + 0.12);
      }
      api.accentMetal = name;
      return api;
    },
  };
  api.materials = {
    body: bodyMaterial,
    accent: accentMaterial,
    fineAccent: fineAccentMaterial,
    emblem: emblemMaterial,
    leather: leatherMaterial,
  };
  return api;
}

export const assetViewer = {
  id: 'buckler',
  name: 'ChatGPT engraved buckler',
  category: 'Props',
  group: 'shields',
  options: {
    metal: Object.keys(METALS),
    accentMetal: Object.keys(METALS),
  },
  async build({ GFX, metal = 'silver', accentMetal = 'gold', renderer = null } = {}) {
    const buckler = createBuckler(GFX, { metal, accentMetal });
    return Object.assign(buckler, {
      frame: { center: [0, 0, 0], radius: BUCKLER_DIMENSIONS.radius * 1.16 },
      environment: studioEnvironment(GFX, renderer),
    });
  },
};
