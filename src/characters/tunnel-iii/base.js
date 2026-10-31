/**
 * Independent, upright Tunnel-III character base.
 *
 * Build order is deliberate:
 *   1. sculpt the full anatomical body in skin;
 *   2. draft textile panels around the anatomical fit surface;
 *   3. add hair and fitted footwear.
 *
 * This module does not import a character, old person factory, wardrobe,
 * or materials palette. It shares only Madness Engine's generic humanoid
 * clip animator, so the new standing rig gets the same clip vocabulary.
 */
// Standalone copy of the engine's standard clip animator; no body or wardrobe imports.

const MATERIALS = {
  skin: { roughness: 0.76, sheen: 0.13, sheenColor: '#e1c1aa', sheenRoughness: 0.88 },
  woven: { roughness: 0.87, sheen: 0.11, sheenColor: '#c6b99f', sheenRoughness: 0.92 },
  performance: { roughness: 0.69, sheen: 0.24, sheenColor: '#a8c6c5', sheenRoughness: 0.72 },
  knit: { roughness: 0.97, sheen: 0.08, sheenColor: '#c8b1a4', sheenRoughness: 0.96 },
  canvas: { roughness: 0.92, sheen: 0.07, sheenColor: '#a5a7a1', sheenRoughness: 0.94 },
  softHide: { roughness: 0.63, clearcoat: 0.09, clearcoatRoughness: 0.78 },
  hair: { roughness: 0.73, sheen: 0.22, sheenColor: '#b49b80', sheenRoughness: 0.74 },
  eye: { roughness: 0.075, clearcoat: 0.94 },
  metal: { roughness: 0.27, metalness: 0.91 },
  sole: { roughness: 0.95 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function hold(k, name, x = 0, y = 0, z = 0) {
  const r = k.bone(name).rot;
  r[0] = x; r[1] = y; r[2] = z;
}

/** Standing skeleton with the engine's familiar humanoid bone names. */
function makeRig(b = 1) {
  const bones = [
    ['root', null, [0, 0, 0]],
    ['hips', 'root', [0, 0.32, 0]],
    ['spine', 'hips', [0, 0.37, 0]],
    ['chest', 'spine', [0, 0.45, 0]],
    ['neck', 'chest', [0, 0.53, 0]],
    ['head', 'neck', [0, 0.58, 0.005]],
  ];
  const J = {};
  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const shoulder = [side * 0.105 * b, 0.5, 0];
    const elbow = [side * 0.135 * b, 0.395, 0];
    const wrist = [side * 0.15 * b, 0.292, 0.018];
    const hand = [side * 0.153 * b, 0.262, 0.024];
    const hip = [side * 0.055 * b, 0.31, 0];
    const knee = [side * 0.06 * b, 0.172, 0.006];
    const ankle = [side * 0.06 * b, 0.05, 0];
    J['shoulder' + S] = shoulder;
    J['elbow' + S] = elbow;
    J['wrist' + S] = wrist;
    J['hand' + S] = hand;
    J['hip' + S] = hip;
    J['knee' + S] = knee;
    J['ankle' + S] = ankle;
    bones.push(
      ['arm' + S, 'chest', shoulder],
      ['fore' + S, 'arm' + S, elbow],
      ['hand' + S, 'fore' + S, wrist],
      ['thigh' + S, 'hips', hip],
      ['shin' + S, 'thigh' + S, knee],
      ['foot' + S, 'shin' + S, ankle],
    );
  }
  return { bones, J };
}

function sectionField(p, sections, y0, y1) {
  const y = clamp(p[1], y0, y1);
  let i = 0;
  while (i < sections.length - 2 && y > sections[i + 1][0]) i++;
  const a = sections[i], b = sections[i + 1];
  const t = smooth(a[0], b[0], y);
  const rx = a[1] + (b[1] - a[1]) * t;
  const rz = a[2] + (b[2] - a[2]) * t;
  const zc = a[3] + (b[3] - a[3]) * t;
  const radial = (Math.hypot(p[0] / rx, (p[2] - zc) / rz) - 1) * Math.min(rx, rz);
  const vertical = Math.max(y0 - p[1], p[1] - y1, 0);
  return Math.hypot(Math.max(radial, 0), vertical) + Math.min(Math.max(radial, vertical), 0);
}

function loft(s, part, y0, y1, sections, options) {
  const rx = Math.max(...sections.map((q) => q[1]));
  const rz = Math.max(...sections.map((q) => q[2]));
  s.part(part, () => s.shape(
    (p) => sectionField(p, sections, y0, y1),
    [[-rx, y0, Math.min(...sections.map((q) => q[3])) - rz],
      [rx, y1, Math.max(...sections.map((q) => q[3])) + rz]],
    options,
  ));
}

/** The complete anatomical skin body; garment meshes never substitute for it. */
function buildSkin(s, { skin, eyeColor = '#536b82', brow = '#30251f', mood = 0, girth = 1, shoulders = 1 }, J) {
  const SO = (bone, extra = {}) => ({ color: skin, mat: 'skin', bone, k: 0.014, ...extra });

  // Rib cage, abdomen, and pelvis form one connected anatomical silhouette.
  loft(s, 'skin', 0.268, 0.405, [
    [0.268, 0.052 * girth, 0.042 * girth, -0.003],
    [0.30, 0.075 * girth, 0.056 * girth, -0.004],
    [0.345, 0.078 * girth, 0.058 * girth, -0.006],
    [0.385, 0.075 * girth, 0.056 * girth, 0.002],
    [0.405, 0.079 * girth, 0.058 * girth, 0.004],
  ], SO('hips', { k: 0.022 }));
  loft(s, 'skin', 0.365, 0.49, [
    [0.365, 0.075 * girth, 0.056 * girth, 0.002],
    [0.395, 0.078 * girth, 0.058 * girth, 0.003],
    [0.445, 0.091 * girth, 0.065 * girth, 0.004],
    [0.49, 0.101 * shoulders, 0.071 * girth, 0.002],
  ], SO('spine', { k: 0.018 }));
  loft(s, 'skin', 0.445, 0.56, [
    [0.445, 0.091 * shoulders, 0.065 * girth, 0.004],
    [0.49, 0.108 * shoulders, 0.076 * girth, 0.002],
    [0.525, 0.099 * shoulders, 0.068 * girth, 0],
    [0.56, 0.05, 0.036, 0],
  ], SO('chest', { k: 0.02 }));

  // Neck grows continuously into the jaw and the collar line.
  s.part('skin', () => s.limb([0, 0.515, 0], [0, 0.594, 0.006], 0.029, 0.026, SO('neck', { k: 0.016 })));

  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const sh = J['shoulder' + S], el = J['elbow' + S], wr = J['wrist' + S];
    const hip = J['hip' + S], kn = J['knee' + S], an = J['ankle' + S];
    s.part('skin', () => {
      // Deltoid, upper arm, forearm and a formed palm.
      s.ellipsoid(sh, [0.038 * shoulders, 0.043, 0.039], SO('arm' + S, { k: 0.018 }));
      s.limb(sh, el, 0.033 * shoulders, 0.024, SO('arm' + S, { k: 0.014 }));
      s.limb(el, wr, 0.024, 0.017, SO('fore' + S, { k: 0.01 }));
      // Palm, thumb and four independently shaped fingers, all weighted to the hand joint.
      const palm = [wr[0], wr[1] - 0.021, wr[2] + 0.021];
      s.ellipsoid(palm, [0.019, 0.025, 0.012], SO('hand' + S, { k: 0.006 }));
      for (let finger = 0; finger < 4; finger++) {
        const spread = finger - 1.5;
        const x0 = palm[0] + side * spread * 0.008;
        const x1 = x0 + side * spread * 0.0015;
        const start = [x0, palm[1] - 0.014, palm[2] + 0.004];
        const end = [x1, palm[1] - 0.044 + Math.abs(spread) * 0.004, palm[2] + 0.009];
        s.limb(start, end, 0.0041, 0.0028, SO('hand' + S, { k: 0.001 }));
        s.sphere(end, 0.0028, SO('hand' + S, { k: 0.001 }));
      }
      const thumbRoot = [palm[0] + side * 0.015, palm[1] - 0.004, palm[2] + 0.003];
      const thumbTip = [palm[0] + side * 0.033, palm[1] - 0.027, palm[2] + 0.014];
      s.limb(thumbRoot, thumbTip, 0.006, 0.0038, SO('hand' + S, { k: 0.001 }));
      s.sphere(thumbTip, 0.0038, SO('hand' + S, { k: 0.001 }));

      // Thighs and calves articulate at the actual knee and ankle pivots.
      s.limb(hip, kn, 0.046 * girth, 0.032 * girth, SO('thigh' + S, { k: 0.014 }));
      s.limb(kn, [an[0], an[1] + 0.07, an[2] - 0.004], 0.031, 0.028, SO('shin' + S, { k: 0.01 }));
      s.limb([an[0], an[1] + 0.07, an[2] - 0.004], an, 0.028, 0.021, SO('shin' + S, { k: 0.01 }));
      // Instep, heel, ball and toe are skin too; shoes are fitted over them later.
      s.ellipsoid([an[0], 0.026, an[2] - 0.005], [0.022, 0.022, 0.027], SO('foot' + S, { k: 0.012 }));
      s.ellipsoid([an[0], 0.022, an[2] + 0.025], [0.024, 0.018, 0.037], SO('foot' + S, { k: 0.012 }));
      for (let toe = 0; toe < 5; toe++) {
        const x = an[0] + side * (-0.014 + toe * 0.009);
        const z = an[2] + 0.053 - Math.abs(toe - 2) * 0.004;
        s.ellipsoid([x, 0.012, z], [0.0058, 0.007, 0.014], SO('foot' + S, { k: 0.004 }));
      }
    });
  }

  // Skull, jaw, ears, cheek planes, nose, eyes, brows and mouth are all part
  // of the skin pass, before hair or any headwear is fitted.
  s.part('skin', () => {
    s.ellipsoid([0, 0.674, 0.004], [0.087, 0.101, 0.083], SO('head', { k: 0.024 }));
    s.ellipsoid([0, 0.629, 0.03], [0.071, 0.058, 0.068], SO('head', { k: 0.02 }));
    for (const side of [1, -1]) {
      s.ellipsoid([side * 0.087, 0.661, -0.003], [0.014, 0.027, 0.021], SO('head', { k: 0.012 }));
      s.ellipsoid([side * 0.048, 0.644, 0.064], [0.027, 0.018, 0.02], SO('head', { k: 0.012 }));
    }
    s.limb([0, 0.681, 0.078], [0, 0.65, 0.105], 0.0075, 0.009, SO('head', { k: 0.01 }));
    s.sphere([0, 0.646, 0.104], 0.010, SO('head', { k: 0.008 }));
    s.ellipsoid([0, 0.61, 0.091], [0.016, 0.004, 0.004], SO('head', { k: 0.003 }));
    for (const side of [1, -1]) {
      const eye = [side * 0.035, 0.682, 0.077];
      // Eye forms are meshed separately at a sub-millimetre grid; keep the brow in skin.
      const by = mood ? 0.709 : 0.713;
      s.limb([side * 0.017, by, 0.076], [side * 0.055, by + (mood ? -0.005 : 0.002), 0.068],
        0.005, 0.004, { color: brow, mat: 'hair', bone: 'head', k: 0.002 });
    }
    // High-resolution eye geometry is kept out of the coarse skin mesh.
    s.part('eyes', () => {
      for (const side of [1, -1]) {
        const c = [side * 0.035, 0.682, 0.082];
        s.ellipsoid(c, [0.018, 0.013, 0.007], { color: '#f0ece4', mat: 'eye', bone: 'head', k: 0.001 });
        s.ellipsoid([c[0], c[1], 0.088], [0.0082, 0.0105, 0.004], { color: eyeColor, mat: 'eye', bone: 'head', k: 0.0007 });
        s.ellipsoid([c[0], c[1], 0.0915], [0.0037, 0.0065, 0.002], { color: '#101014', mat: 'eye', bone: 'head', k: 0.0004 });
        s.sphere([c[0] - 0.0026, c[1] + 0.004, 0.0933], 0.0017, { color: '#ffffff', mat: 'eye', bone: 'head', k: 0 });
      }
    });
    s.limb([-0.018, 0.615, 0.092], [0.018, 0.615, 0.092], 0.0016, 0.0016, { op: 'sub', k: 0.001 });
    s.ellipsoid([0, 0.608, 0.09], [0.014, 0.004, 0.004], SO('head', { k: 0.003 }));
  });
}

/**
 * Sewn fabric surface system.
 *
 * A garment is drafted as a triangulated cloth panel, not assembled from body
 * primitives. Each triangle is offset into a thin two-sided textile shell.
 * Panel coordinates can be sampled along a torso, limb, or garment pattern.
 */
const vSub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const vAdd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const vMul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const vDot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const vLen=a=>Math.hypot(a[0],a[1],a[2]);
const vUnit=a=>vMul(a,1/(vLen(a)||1));
const vMix=(a,b,t)=>a+(b-a)*t;
const vSmooth=t=>{const x=clamp(t,0,1);return x*x*(3-2*x);};

function triangleDistanceSq(p,a,b,c){
  const ab=vSub(b,a),ac=vSub(c,a),ap=vSub(p,a);
  const d1=vDot(ab,ap),d2=vDot(ac,ap);
  if(d1<=0&&d2<=0)return vDot(ap,ap);
  const bp=vSub(p,b),d3=vDot(ab,bp),d4=vDot(ac,bp);
  if(d3>=0&&d4<=d3)return vDot(bp,bp);
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0){const t=d1/(d1-d3),q=vAdd(a,vMul(ab,t)),r=vSub(p,q);return vDot(r,r);}
  const cp=vSub(p,c),d5=vDot(ab,cp),d6=vDot(ac,cp);
  if(d6>=0&&d5<=d6)return vDot(cp,cp);
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0){const t=d2/(d2-d6),q=vAdd(a,vMul(ac,t)),r=vSub(p,q);return vDot(r,r);}
  const va=d3*d6-d5*d4;
  if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){
    const t=(d4-d3)/((d4-d3)+(d5-d6)),q=vAdd(b,vMul(vSub(c,b),t)),r=vSub(p,q);
    return vDot(r,r);
  }
  const inv=1/(va+vb+vc),v=vb*inv,w=vc*inv;
  const q=vAdd(a,vAdd(vMul(ab,v),vMul(ac,w))),r=vSub(p,q);
  return vDot(r,r);
}

/** Draft a 2-D textile pattern into a fine, closed fabric sheet. */
export function sewFabric(s,{point,color,material='cotton',bone='chest',across=16,down=9,thickness=0.0025}){
  const grid=[];
  for(let j=0;j<=down;j++){
    const row=[];
    for(let i=0;i<=across;i++)row.push(point(i/across,j/down));
    grid.push(row);
  }
  const addTriangle=(a,b,c)=>{
    const lo=[0,1,2].map(i=>Math.min(a[i],b[i],c[i])-thickness*1.4);
    const hi=[0,1,2].map(i=>Math.max(a[i],b[i],c[i])+thickness*1.4);
    s.shape(p=>Math.sqrt(triangleDistanceSq(p,a,b,c))-thickness,[lo,hi],{
      color,mat:material,bone,k:0,
    });
  };
  // Keep textile in its own mesh part; never union the cloth field with skin.
  s.part('clothes',()=>{
    for(let j=0;j<down;j++)for(let i=0;i<across;i++){
      const a=grid[j][i],b=grid[j][i+1],c=grid[j+1][i+1],d=grid[j+1][i];
      addTriangle(a,b,c);
      addTriangle(a,c,d);
    }
  });
}

/** Torso cloth panel sampled around the anatomical section profile. */
export function torsoFabric(s,{y0=0.36,y1=0.55,clearance=0.01,color,material='cotton',bone='chest',angle0=-Math.PI,angle1=Math.PI,across=24,down=12}){
  const profile=[
    [0.285,0.061,0.049,0],[0.32,0.075,0.056,0],[0.365,0.075,0.056,0.002],
    [0.395,0.078,0.058,0.003],[0.445,0.091,0.065,0.004],[0.49,0.108,0.076,0.002],
    [0.525,0.099,0.068,0],[0.55,0.072,0.05,0],
  ];
  const section=y=>{
    let i=0;while(i<profile.length-2&&y>profile[i+1][0])i++;
    const a=profile[i],b=profile[i+1],t=vSmooth((y-a[0])/(b[0]-a[0]));
    return [vMix(a[1],b[1],t),vMix(a[2],b[2],t),vMix(a[3],b[3],t)];
  };
  sewFabric(s,{color,material,bone,across,down,point:(u,v)=>{
    const y=vMix(y0,y1,v),theta=vMix(angle0,angle1,u),[rx,rz,zc]=section(y);
    return [Math.sin(theta)*(rx+clearance),y,zc+Math.cos(theta)*(rz+clearance)];
  }});
}

/** Sleeve or trouser fabric laid around a limb's anatomical centreline. */
export function limbFabric(s,{a,b,radiusA,radiusB,color,material='cotton',bone='armL',clearance=0.008,across=16,down=9}){
  const axis=vUnit(vSub(b,a));
  const reference=Math.abs(axis[2])<0.85?[0,0,1]:[0,1,0];
  const side=vUnit([axis[1]*reference[2]-axis[2]*reference[1],axis[2]*reference[0]-axis[0]*reference[2],axis[0]*reference[1]-axis[1]*reference[0]]);
  const other=vUnit([axis[1]*side[2]-axis[2]*side[1],axis[2]*side[0]-axis[0]*side[2],axis[0]*side[1]-axis[1]*side[0]]);
  sewFabric(s,{color,material,bone,across,down,point:(u,v)=>{
    const angle=u*Math.PI*2,t=v,center=[vMix(a[0],b[0],t),vMix(a[1],b[1],t),vMix(a[2],b[2],t)];
    const radius=vMix(radiusA,radiusB,vSmooth(t))+clearance;
    return vAdd(center,vAdd(vMul(side,Math.cos(angle)*radius),vMul(other,Math.sin(angle)*radius)));
  }});
}

/** Shaped skirt panel with a controlled flare and fabric pleat displacement. */
export function skirtFabric(s,{y0=0.075,y1=0.405,topX=0.09,topZ=0.065,hemX=0.15,hemZ=0.105,clearance=0.01,pleat=0.0025,color,material='cotton',bone='hips'}){
  sewFabric(s,{color,material,bone,across:32,down:16,point:(u,v)=>{
    const theta=u*Math.PI*2,t=v,flare=vSmooth(t),fold=pleat*Math.cos(theta*12)*(0.2+0.8*t);
    const rx=vMix(hemX,topX,flare)+clearance+fold,rz=vMix(hemZ,topZ,flare)+clearance+fold;
    return [Math.sin(theta)*rx,vMix(y0,y1,t),Math.cos(theta)*rz];
  }});
}

/** Footwear upper drafted as a closed cross-section over the foot, with a real sole allowance. */
export function shoeFabric(s,{ankle,color,material='leather',bone='footL',clearance=0.006}){
  const cx=ankle[0],cz=ankle[2];
  sewFabric(s,{color,material,bone,across:20,down:12,thickness:0.003,point:(u,v)=>{
    const angle=u*Math.PI*2;
    const width=0.019+0.005*Math.sin(v*Math.PI);
    const height=0.021+0.003*Math.sin(v*Math.PI);
    const z=cz-0.012+v*0.083;
    return [cx+Math.sin(angle)*(width+clearance),0.024+Math.cos(angle)*(height+clearance*0.6),z];
  }});
}

/**
 * Defines one fresh standing character. Garments and accessories are sculpted
 * only after the complete skin anatomy is finished.
 */
export function standingCharacter({
  name, scale = 1.4, skin = '#c88f70', eyeColor = '#536b82', brow = '#30251f',
  mood = 0, girth = 1, shoulders = 1, cell = 0.0085, budget = 42000,
  hair = null, clothes = null, accessories = null, style = {},
}) {
  const rig = makeRig(1);
  return {
    name, scale, cell, budget, bones: rig.bones, materials: MATERIALS,
    cells: { face: 0.0035, eyes: 0.0012, accessories: 0.0025, hair: 0.0035, clothes: 0.0035, fine: 0.0025 },
    ambient: 0.24,
    sculpt(s) {
      buildSkin(s, { skin, eyeColor, brow, mood, girth, shoulders }, rig.J);
      // Distinct overlays, added after the bare body is complete.
      hair?.(s, rig.J);
      clothes?.(s, rig.J);
      accessories?.(s, rig.J);
    },
    animate(k, state) {
      moveHumanoid(k, state, style);
    },
  };
}

export { MATERIALS };

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const window_ = (t, a, b) => ease((t - a) / (b - a));

/**
 * How a hero moves. `style.attack` is 'slash' (a sword across), 'chop' (an
 * axe from over the head), 'thrust' (a staff jabbed forward) or 'smite' (a
 * mace or staff brought down); `style.heavy` slows and deepens it all.
 * Clips: idle, walk, attack, cast, hit, ko, win.
 */
export function moveHumanoid(k, { clip = 'idle', t = 0, time = 0, seed = 0, speed = 1 }, style = {}) {
  const T = time + seed;
  const heavy = style.heavy ?? 0;
  const breathe = Math.sin(T * (2.4 - heavy * 0.6));
  // Always: breathing, a little sway, the off hand relaxed.
  k.scale('chest', 1 + breathe * 0.012, 1 + breathe * 0.018, 1 + breathe * 0.012);
  k.turn('armL', 0, 0, 0.05 + breathe * 0.015);
  k.turn('armR', 0, 0, -0.05 - breathe * 0.015);
  k.turn('foreL', -0.15, 0, 0);
  k.turn('foreR', -0.25, 0, 0);

  if (clip === 'idle') {
    k.turn('hips', 0, Math.sin(T * 0.7) * 0.04, Math.sin(T * 0.9) * 0.015);
    k.turn('head', Math.sin(T * 0.5) * 0.04, Math.sin(T * 0.37) * 0.18, 0);
    k.move('hips', 0, breathe * 0.002 - 0.004, 0);
    k.turn('thighL', 0.04, 0, 0.02); k.turn('shinL', 0.08, 0, 0);
    k.turn('thighR', 0.04, 0, -0.02); k.turn('shinR', 0.08, 0, 0);
    // Relaxed, balanced hands: no imaginary weapon grip or inherited ready stance.
    k.turn('armL', 0.08 + breathe * 0.012, 0, 0.075);
    k.turn('armR', 0.08 + breathe * 0.012, 0, -0.075);
    k.turn('foreL', -0.08, 0, 0.025);
    k.turn('foreR', -0.08, 0, -0.025);
    k.turn('handL', 0, 0, 0);
    k.turn('handR', 0, 0, 0);
  } else if (clip === 'walk') {
    const ph = T * (9 - heavy * 2) * Math.max(0.5, speed), g = Math.sin(ph);
    k.move('hips', 0, Math.abs(Math.cos(ph)) * 0.012 - 0.004, 0);
    k.turn('hips', 0, g * 0.12, 0);
    k.turn('chest', 0.06, -g * 0.16, 0);
    k.turn('thighL', -g * 0.55, 0, 0); k.turn('shinL', Math.max(0, g) * 0.8, 0, 0); k.turn('footL', -g * 0.2, 0, 0);
    k.turn('thighR', g * 0.55, 0, 0); k.turn('shinR', Math.max(0, -g) * 0.8, 0, 0); k.turn('footR', g * 0.2, 0, 0);
    // Symmetric counter-swing with softly flexed, empty hands.
    k.turn('armL', -g * 0.38, 0, 0.02);
    k.turn('armR', g * 0.38, 0, -0.02);
    k.turn('foreL', -0.08, 0, 0);
    k.turn('foreR', -0.08, 0, 0);
  } else if (clip === 'attack') {
    attack(k, t, style);
  } else if (clip === 'cast') {
    // Gather, then both hands up and out: the spell goes.
    const up = window_(t, 0, 0.3), go = window_(t, 0.3, 0.42), back = window_(t, 0.65, 1);
    const lift = up * (1 - back);
    k.turn('chest', -0.12 * lift + 0.08 * go * (1 - back), 0, 0);
    k.turn('head', -0.15 * lift, 0, 0);
    k.turn('armR', -1.9 * lift - 0.35 * (1 - lift), 0, -0.25 * lift - 0.1);
    k.turn('foreR', -0.3 * lift - 0.7 * (1 - lift), 0, 0);
    k.turn('armL', -1.2 * lift - 0.5 * go * (1 - back), 0, 0.5 * lift);
    k.turn('foreL', -0.5 * lift, 0, 0);
    k.move('hips', 0, 0.01 * lift, 0);
  } else if (clip === 'hit') {
    const h = Math.sin(Math.min(1, t / 0.4) * Math.PI);
    k.move('root', 0, 0, -0.05 * h);
    k.turn('spine', -0.25 * h, 0, 0.1 * h);
    k.turn('head', -0.3 * h, 0.2 * h, 0);
    k.turn('armL', -0.6 * h, 0, 0.5 * h);
    k.turn('armR', -0.6 * h, 0, -0.5 * h);
    k.turn('thighL', -0.2 * h, 0, 0); k.turn('shinL', 0.3 * h, 0, 0);
  } else if (clip === 'ko') {
    // Down on one knee, then over onto the back, legs out.
    const kneel = window_(t, 0, 0.3), fall = window_(t, 0.3, 0.75), up = kneel * (1 - fall);
    k.move('hips', 0, -0.13 * up - 0.27 * fall, -0.02 * up - 0.12 * fall);
    k.turn('hips', -1.45 * fall, 0, 0);
    k.turn('thighL', -1.2 * up + 0.25 * fall, 0, 0.12 * fall);
    k.turn('shinL', 1.5 * up + 0.15 * fall, 0, 0);
    k.turn('thighR', 0.2 * up + 0.2 * fall, 0, -0.18 * fall);
    k.turn('shinR', 2.0 * up + 0.35 * fall, 0, 0);
    k.turn('footL', 0.4 * fall, 0, 0);
    k.turn('footR', 0.4 * fall, 0, 0);
    k.turn('spine', 0.4 * up + 0.05 * fall, 0, 0);
    k.turn('head', 0.5 * up - 0.1 * fall, 0.5 * fall, 0);
    k.turn('armL', -0.4 * up, 0, 1.1 * fall);
    k.turn('armR', -0.4 * up, 0, -1.1 * fall);
    k.turn('foreL', -0.3 * fall, 0, 0);
  } else if (clip === 'win') {
    // The weapon up, a little hop.
    const up = window_(t, 0, 0.3);
    const hop = Math.max(0, Math.sin(Math.min(1, t / 0.5) * Math.PI)) * 0.03;
    k.move('root', 0, hop, 0);
    k.turn('armR', -2.6 * up - 0.35 * (1 - up), 0, -0.25 * up);
    k.turn('foreR', -0.2 * up, 0, 0);
    k.turn('armL', 0, 0, 0.5 * up);
    k.turn('foreL', -0.9 * up, 0, 0);
    k.turn('chest', -0.1 * up, 0, 0);
    k.turn('head', -0.2 * up, 0, 0);
  }
  // Whatever is particular to this one, on top of all that.
  style.after?.(k, { clip, t, time, seed, speed }, T);
}

function attack(k, t, style) {
  const heavy = style.heavy ?? 0;
  const wind = window_(t, 0, 0.22 + heavy * 0.06), strike = window_(t, 0.24 + heavy * 0.05, 0.34 + heavy * 0.05), back = window_(t, 0.5, 0.85);
  const w = wind * (1 - strike), s = strike * (1 - back);
  // A step in with the strike.
  k.move('root', 0, 0, 0.06 * s);
  k.turn('thighL', -0.5 * s, 0, 0); k.turn('shinL', 0.35 * s, 0, 0);
  k.turn('thighR', 0.35 * s, 0, 0); k.turn('shinR', 0.25 * s, 0, 0);
  switch (style.attack ?? 'slash') {
    case 'slash':
      // From high on the right across and down to the left.
      k.turn('chest', -0.1 * w + 0.15 * s, 0.6 * w - 0.55 * s, 0);
      k.turn('armR', -2.1 * w - 1.1 * s - 0.35 * (1 - w - s), 0, -0.6 * w + 0.25 * s);
      k.turn('foreR', -0.4 * w - 0.2 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('handR', 0.3 * w - 0.5 * s, 0, 0);
      k.turn('armL', 0.3 * s, 0, 0.3 * w);
      break;
    case 'chop':
      // Both hands up over the head, and down.
      k.turn('chest', -0.25 * w + 0.35 * s, 0.2 * w, 0);
      k.turn('armR', -2.8 * w - 1.0 * s - 0.35 * (1 - w - s), 0, -0.1);
      k.turn('foreR', -0.5 * w - 0.2 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', -2.6 * w - 0.9 * s, 0, -0.35 * (w + s));
      k.turn('foreL', -0.6 * w - 0.4 * s, 0, 0);
      k.turn('handR', 0.4 * w - 0.6 * s, 0, 0);
      break;
    case 'thrust':
      // The staff drawn back and jabbed out.
      k.turn('chest', 0.05 * s, 0.4 * w - 0.25 * s, 0);
      k.turn('armR', -0.2 * w - 1.35 * s - 0.35 * (1 - w - s), 0, -0.2 * w);
      k.turn('foreR', -1.3 * w - 0.1 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', -0.9 * (w + s), 0, 0.2);
      k.turn('foreL', -0.6 * (w + s), 0, 0);
      break;
    case 'shove':
      // Both hands drawn back, then driven out together.
      k.turn('chest', 0.12 * s - 0.1 * w, 0, 0);
      k.turn('armR', 0.5 * w - 1.5 * s - 0.35 * (1 - w - s), 0, -0.1);
      k.turn('foreR', -0.2 * w - 0.1 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', 0.5 * w - 1.5 * s, 0, 0.1);
      k.turn('foreL', -0.2 * w - 0.1 * s - 0.15 * (1 - w - s), 0, 0);
      break;
    case 'punch':
      // A big right hook.
      k.turn('chest', 0, 0.6 * w - 0.8 * s, 0);
      k.turn('armR', -0.3 * w - 1.35 * s - 0.35 * (1 - w - s), 0, -0.5 * w);
      k.turn('foreR', -1.5 * w - 0.15 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', 0.3 * s, 0, 0.3);
      break;
    case 'flail': {
      // Both arms going round like windmills.
      const a = (t * 22) % (Math.PI * 2);
      k.turn('armR', -a, 0, -0.5);
      k.turn('armL', a, 0, 0.5);
      k.turn('foreR', -0.4, 0, 0);
      k.turn('foreL', -0.4, 0, 0);
      k.turn('chest', 0, Math.sin(a) * 0.3, 0);
      break;
    }
    case 'hug':
      // Arms wide, then closing round whoever it is.
      k.turn('armR', -0.9 * w - 0.4 * s - 0.35 * (1 - w - s), 0, -1.1 * w + 0.3 * s);
      k.turn('armL', -0.9 * w - 0.4 * s, 0, 1.1 * w - 0.3 * s);
      k.turn('foreR', -0.2 * w - 1.0 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('foreL', -0.2 * w - 1.0 * s, 0, 0);
      k.turn('chest', 0.15 * s, 0, 0);
      break;
    case 'smite':
    default:
      // Raised high on the right, brought straight down.
      k.turn('chest', -0.2 * w + 0.25 * s, 0.25 * w, 0);
      k.turn('armR', -2.9 * w - 0.9 * s - 0.35 * (1 - w - s), 0, -0.3 * w);
      k.turn('foreR', -0.2 * w - 0.3 * s - 0.6 * (1 - w - s), 0, 0);
      k.turn('armL', -0.5 * w, 0, 0.4 * w);
      break;
  }
}
