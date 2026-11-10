export default `// Bump mapping: the normal tilted by the slope of the height map.

fn dHdxy_fwd(bumpMapUv: vec2f, mapUv: vec2f) -> vec2f {
  let dSTdx = dpdx(bumpMapUv);
  let dSTdy = dFdy2(bumpMapUv);
  let Hll = u_draw.bumpScale * textureSample(t_bump, s_bump, bumpMapUv).x;
  let dBx = u_draw.bumpScale * textureSample(t_bump, s_bump, bumpMapUv + dSTdx).x - Hll;
  let dBy = u_draw.bumpScale * textureSample(t_bump, s_bump, bumpMapUv + dSTdy).x - Hll;
  var dH = vec2f(dBx, dBy);
  #ifdef USE_DETAILMAP
  // The detail map, on the colour map's layout: how much of the fine bump shows here (b), and a
  // relief of its own (r) for what the tile cannot hold: creases, wrinkles, folds.
  let detail = textureSample(t_detail, s_detail, mapUv).xyz;
  dH *= detail.z;
  dH += u_draw.detailScale * (vec2f(textureSample(t_detail, s_detail, mapUv + dpdx(mapUv)).x, textureSample(t_detail, s_detail, mapUv + dFdy2(mapUv)).x) - detail.x);
  #endif
  return dH;
}

fn perturbNormalArb(surf_pos: vec3f, surf_norm: vec3f, dHdxy: vec2f, faceDirection: f32) -> vec3f {
  let vSigmaX = normalize(dpdx(surf_pos));
  let vSigmaY = normalize(dFdy3(surf_pos));
  let vN = surf_norm;
  let R1 = cross(vSigmaY, vN);
  let R2 = cross(vN, vSigmaX);
  let fDet = dot(vSigmaX, R1) * faceDirection;
  let vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;
