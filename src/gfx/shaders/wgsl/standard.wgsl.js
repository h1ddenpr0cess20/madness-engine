export default `// MeshStandardMaterial and MeshPhysicalMaterial: the physically based model (adapted from three.js; see LICENSE).

#include <frame>
#include <draw>
#include <bindings>
#include <common>
#include <output>
#ifdef USE_INSTANCING
#include <instancing>
#endif
#ifdef USE_ENVMAP
#include <cube_uv>
#endif
#if NUM_DIR_LIGHT_SHADOWS > 0
#include <shadowmap>
#include <shadow_vertex>
#endif

struct Varyings {
  @builtin(position) position: vec4f,
  @location(0) viewPosition: vec3f,
  #ifndef FLAT_SHADED
  @location(1) normal: vec3f,
  #endif
  #ifdef USE_MAP
  @location(2) mapUv: vec2f,
  #endif
  #ifdef USE_BUMPMAP
  @location(3) bumpMapUv: vec2f,
  #endif
  #if defined(USE_COLOR) || defined(USE_INSTANCING)
  @location(4) color: vec4f,
  #endif
  #if NUM_DIR_LIGHT_SHADOWS > 0
  @location(5) shadowCoord: vec4f,
  #endif
  #ifdef USE_TRANSMISSION
  @location(6) worldPosition: vec3f,
  #endif
};

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  #if defined(USE_MAP) || defined(USE_BUMPMAP)
  @location(2) uv: vec2f,
  #endif
  #ifdef USE_COLOR
  @location(3) color: vec3f,
  #endif
  #ifdef USE_INSTANCING
  @location(5) instancePlace: vec4f,
  @location(6) instanceLook: vec4f,
  #endif
};

@vertex
fn vs(in: VertexInput) -> Varyings {
  var out: Varyings;
  #ifdef USE_MAP
  out.mapUv = (u_draw.mapTransform * vec3f(in.uv, 1.0)).xy;
  #endif
  #ifdef USE_BUMPMAP
  out.bumpMapUv = (u_draw.bumpMapTransform * vec3f(in.uv, 1.0)).xy;
  #endif
  #if defined(USE_COLOR) || defined(USE_INSTANCING)
  out.color = vec4f(1.0);
  #endif
  #ifdef USE_COLOR
  out.color = vec4f(out.color.rgb * in.color, 1.0);
  #endif
  var objectNormal = in.normal;
  var transformed = in.position;
  #ifdef USE_INSTANCING
  out.color = vec4f(out.color.rgb * in.instanceLook.yzw, 1.0);
  objectNormal = instanceTurn(objectNormal, in.instancePlace.w);
  transformed = instanceTurn(transformed, in.instancePlace.w) * in.instanceLook.x + in.instancePlace.xyz;
  #endif
  var transformedNormal = u_draw.normalMatrix * objectNormal;
  #ifdef FLIP_SIDED
  transformedNormal = -transformedNormal;
  #endif
  #ifndef FLAT_SHADED
  out.normal = normalize(transformedNormal);
  #endif
  let mvPosition = u_draw.modelViewMatrix * vec4f(transformed, 1.0);
  out.position = u_frame.projectionMatrix * mvPosition;
  out.viewPosition = -mvPosition.xyz;
  #if defined(USE_ENVMAP) || NUM_DIR_LIGHT_SHADOWS > 0 || defined(USE_TRANSMISSION)
  let worldPosition = u_draw.modelMatrix * vec4f(transformed, 1.0);
  #endif
  #if NUM_DIR_LIGHT_SHADOWS > 0
  #ifdef HAS_NORMAL
  out.shadowCoord = shadowCoordOf(worldPosition, transformedNormal);
  #else
  out.shadowCoord = shadowCoordOf(worldPosition, vec3f(0.0) * transformedNormal);
  #endif
  #endif
  #ifdef USE_TRANSMISSION
  out.worldPosition = worldPosition.xyz;
  #endif
  return out;
}

#ifdef USE_IRIDESCENCE
#include <iridescence>
#endif
#include <physical_lighting>
#ifdef USE_TRANSMISSION
#include <transmission>
#endif
#ifdef USE_BUMPMAP
#include <bump>
#endif
#ifdef USE_SUBSURFACE
// Light carried under the surface past where it falls: each colour wrapped round the form as far as
// it travels (skin's red furthest), over the smooth shape, not the pores'.
fn subsurfaceScatter(L: vec3f, lightColor: vec3f, N: vec3f, albedo: vec3f) -> vec3f {
  let nl = dot(N, L);
  let wrapped = clamp((vec3f(nl) + u_draw.subsurfaceColor) / (vec3f(1.0) + u_draw.subsurfaceColor), vec3f(0.0), vec3f(1.0));
  return lightColor * albedo * RECIPROCAL_PI * (wrapped - vec3f(clamp(nl, 0.0, 1.0)));
}
#endif

#ifdef USE_ENVMAP
fn getIBLIrradiance(normal: vec3f) -> vec3f {
  let worldNormal = transformNormalByInverseViewMatrix(normal, u_frame.viewMatrix);
  let envMapColor = textureCubeUV(t_env, u_draw.envMapRotation * worldNormal, 1.0);
  return PI * envMapColor.rgb * u_draw.envMapIntensity;
}

fn getIBLRadiance(viewDir: vec3f, normal: vec3f, roughness: f32) -> vec3f {
  var reflectVec = reflect(-viewDir, normal);
  reflectVec = normalize(mix(reflectVec, normal, pow4(roughness)));
  reflectVec = transformNormalByInverseViewMatrix(reflectVec, u_frame.viewMatrix);
  let envMapColor = textureCubeUV(t_env, u_draw.envMapRotation * reflectVec, roughness);
  return envMapColor.rgb * u_draw.envMapIntensity;
}
#endif
#if NUM_POINT_LIGHTS > 0
fn getDistanceAttenuation(lightDistance: f32, cutoffDistance: f32, decayExponent: f32) -> f32 {
  var distanceFalloff = 1.0 / max(pow(lightDistance, decayExponent), 0.01);
  if (cutoffDistance > 0.0) {
    distanceFalloff *= pow2(saturate1(1.0 - pow4(lightDistance / cutoffDistance)));
  }
  return distanceFalloff;
}
#endif

#ifdef USE_STRANDS
// Hair's two highlights (Kajiya and Kay's model, as Scheuermann shifts it): light glancing off each
// strand's surface, white and tight, toward the root; and light that went into the strand and back out,
// coloured by it and broader, toward the tip. Both run across the strands, not along them, as hair's do.
fn strandSpecular(L: vec3f, lightColor: vec3f, N: vec3f, V: vec3f, T: vec3f, jitter: f32, tint: vec3f) -> vec3f {
  let H = normalize(L + V);
  let T1 = normalize(T + N * (0.1 + jitter));
  let T2 = normalize(T - N * (0.12 - jitter));
  let d1 = dot(T1, H);
  let d2 = dot(T2, H);
  let s1 = pow(sqrt(max(0.0, 1.0 - d1 * d1)), 260.0);
  let s2 = pow(sqrt(max(0.0, 1.0 - d2 * d2)), 90.0);
  let lit = smoothstep(-0.15, 0.35, dot(N, L));
  return lightColor * lit * (0.035 * s1 + 0.18 * s2 * tint);
}
#endif

@fragment
fn fs(in: Varyings, @builtin(front_facing) frontFacing: bool) -> @location(0) vec4f {
  var diffuseColor = vec4f(u_draw.diffuse, u_draw.opacity);
  let totalEmissiveRadiance = u_draw.emissive;
  #ifdef USE_MAP
  diffuseColor *= textureSample(t_map, s_map, in.mapUv);
  #endif
  #if defined(USE_COLOR) || defined(USE_INSTANCING)
  diffuseColor *= in.color;
  #endif
  #ifdef USE_ALPHATEST
  #ifdef USE_MAP
  // A mip averages thin texels away; scaled back up by how far down the chain this lookup is, a
  // strand keeps the coverage it had up close.
  let texel = in.mapUv * vec2f(textureDimensions(t_map, 0));
  let tdx = dpdx(texel);
  let tdy = dpdy(texel);
  let mipLevel = max(0.0, 0.5 * log2(max(dot(tdx, tdx), dot(tdy, tdy))));
  diffuseColor.a = min(1.0, diffuseColor.a * (1.0 + mipLevel * 0.25));
  #endif
  if (diffuseColor.a < ALPHA_TEST) {
    discard;
  }
  #endif
  var roughnessFactor = u_draw.roughness;
  #ifdef USE_DETAILMAP
  // The detail map's g: rougher or glossier than the material, 0.5 as it is.
  roughnessFactor *= textureSample(t_detail, s_detail, in.mapUv).y * 2.0;
  #endif
  let metalnessFactor = u_draw.metalness;

  let faceDirection = select(-1.0, 1.0, frontFacing);
  #ifdef FLAT_SHADED
  let fdx = dpdx(in.viewPosition);
  let fdy = dFdy3(in.viewPosition);
  var normal = normalize(cross(fdx, fdy));
  #else
  var normal = normalize(in.normal);
  #ifdef DOUBLE_SIDED
  normal *= faceDirection;
  #endif
  #endif
  let nonPerturbedNormal = normal;
  #ifdef USE_BUMPMAP
  #ifdef USE_MAP
  normal = perturbNormalArb(-in.viewPosition, normal, dHdxy_fwd(in.bumpMapUv, in.mapUv), faceDirection);
  #else
  normal = perturbNormalArb(-in.viewPosition, normal, dHdxy_fwd(in.bumpMapUv, in.bumpMapUv), faceDirection);
  #endif
  #endif
  let clearcoatNormal = nonPerturbedNormal;
  #ifdef USE_STRANDS
  // Which way the strand runs here (the texture's v), from how the place and the UV change across the pixel.
  let sq0 = dpdx(-in.viewPosition);
  let sq1 = dFdy3(-in.viewPosition);
  let sst0 = dpdx(in.mapUv);
  let sst1 = dFdy2(in.mapUv);
  var strand = cross(sq1, normal) * sst0.y + cross(normal, sq0) * sst1.y;
  strand *= inverseSqrt(max(dot(strand, strand), 1e-20));
  // Each strand's highlight a little off its neighbours', by its own shade in the texture.
  let strandJitter = (textureSample(t_map, s_map, in.mapUv).g - 0.9) * 0.5;
  // The second highlight has been through the strand: it is the hair's own colour, as bright as the hair is.
  let strandTint = diffuseColor.rgb;
  #endif

  var material: PhysicalMaterial;
  material.diffuseColor = diffuseColor.rgb;
  material.diffuseContribution = diffuseColor.rgb * (1.0 - metalnessFactor);
  material.metalness = metalnessFactor;
  let dxy = max(abs(dpdx(nonPerturbedNormal)), abs(dFdy3(nonPerturbedNormal)));
  let geometryRoughness = max(max(dxy.x, dxy.y), dxy.z);
  material.roughness = max(roughnessFactor, 0.0525);
  material.roughness += geometryRoughness;
  material.roughness = min(material.roughness, 1.0);
  #ifdef PHYSICAL
  material.ior = u_draw.ior;
  let specularIntensityFactor = u_draw.specularIntensity;
  let specularColorFactor = u_draw.specularColor;
  material.specularF90 = mix(specularIntensityFactor, 1.0, metalnessFactor);
  material.specularColor = min(pow2((material.ior - 1.0) / (material.ior + 1.0)) * specularColorFactor, vec3f(1.0)) * specularIntensityFactor;
  material.specularColorBlended = mix(material.specularColor, diffuseColor.rgb, metalnessFactor);
  #else
  material.specularColor = vec3f(0.04);
  material.specularColorBlended = mix(material.specularColor, diffuseColor.rgb, metalnessFactor);
  material.specularF90 = 1.0;
  #endif
  #ifdef USE_CLEARCOAT
  material.clearcoat = u_draw.clearcoat;
  material.clearcoatRoughness = u_draw.clearcoatRoughness;
  material.clearcoatF0 = vec3f(0.04);
  material.clearcoatF90 = 1.0;
  material.clearcoat = saturate1(material.clearcoat);
  material.clearcoatRoughness = max(material.clearcoatRoughness, 0.0525);
  material.clearcoatRoughness += geometryRoughness;
  material.clearcoatRoughness = min(material.clearcoatRoughness, 1.0);
  #endif
  #ifdef USE_IRIDESCENCE
  material.iridescence = u_draw.iridescence;
  material.iridescenceIOR = u_draw.iridescenceIOR;
  material.iridescenceThickness = u_draw.iridescenceThicknessMaximum;
  #endif
  #ifdef USE_SHEEN
  material.sheenColor = u_draw.sheenColor;
  material.sheenRoughness = clamp(u_draw.sheenRoughness, 0.0001, 1.0);
  #endif

  let geometryPosition = -in.viewPosition;
  let geometryNormal = normal;
  let geometryViewDir = select(normalize(in.viewPosition), vec3f(0.0, 0.0, 1.0), u_frame.isOrthographic > 0.5);
  #ifdef USE_CLEARCOAT
  let geometryClearcoatNormal = clearcoatNormal;
  #else
  let geometryClearcoatNormal = vec3f(0.0);
  #endif

  #ifdef USE_IRIDESCENCE
  let dotNVi = saturate1(dot(normal, geometryViewDir));
  if (material.iridescenceThickness == 0.0) {
    material.iridescence = 0.0;
  } else {
    material.iridescence = saturate1(material.iridescence);
  }
  if (material.iridescence > 0.0) {
    let iridescenceFresnelDielectric = evalIridescence(1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor);
    let iridescenceFresnelMetallic = evalIridescence(1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor);
    material.iridescenceFresnel = mix(iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness);
    material.iridescenceF0Dielectric = Schlick_to_F0(iridescenceFresnelDielectric, 1.0, dotNVi);
    material.iridescenceF0Metallic = Schlick_to_F0(iridescenceFresnelMetallic, 1.0, dotNVi);
  }
  #endif

  let dotNVms = saturate1(dot(geometryNormal, geometryViewDir));
  material.dfg = textureSampleLevel(t_dfg, s_linear, vec2f(material.roughness, dotNVms), 0.0).rg;
  #if NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0
  let EssMs = material.dfg.x + material.dfg.y;
  material.multiScatteringCompensation = 1.0 + material.specularColorBlended * (1.0 / EssMs - 1.0);
  #endif

  #if NUM_POINT_LIGHTS > 0
  for (var i = 0; i < NUM_POINT_LIGHTS; i++) {
    let lVector = u_frame.pointLightPosition[i].xyz - geometryPosition;
    let lightDirection = normalize(lVector);
    let lightDistance = length(lVector);
    var lightColor = u_frame.pointLightColor[i].xyz;
    lightColor *= getDistanceAttenuation(lightDistance, u_frame.pointLightPosition[i].w, u_frame.pointLightColor[i].w);
    RE_Direct_Physical(lightDirection, lightColor, geometryNormal, geometryViewDir, geometryClearcoatNormal, material);
    #ifdef USE_SUBSURFACE
    directDiffuse += subsurfaceScatter(lightDirection, lightColor, nonPerturbedNormal, material.diffuseContribution);
    #endif
    #ifdef USE_STRANDS
    directSpecular += strandSpecular(lightDirection, lightColor, geometryNormal, geometryViewDir, strand, strandJitter, strandTint);
    #endif
  }
  #endif

  #if NUM_DIR_LIGHT_SHADOWS > 0
  let shadow = select(1.0, directionalShadow(in.shadowCoord), u_draw.receiveShadow > 0.5);
  #endif
  #if NUM_DIR_LIGHTS > 0
  for (var i = 0; i < NUM_DIR_LIGHTS; i++) {
    var lightColor = u_frame.dirLightColor[i].xyz;
    #if NUM_DIR_LIGHT_SHADOWS > 0
    if (i == 0) { lightColor *= shadow; }
    #endif
    RE_Direct_Physical(u_frame.dirLightDirection[i].xyz, lightColor, geometryNormal, geometryViewDir, geometryClearcoatNormal, material);
    #ifdef USE_SUBSURFACE
    directDiffuse += subsurfaceScatter(u_frame.dirLightDirection[i].xyz, lightColor, nonPerturbedNormal, material.diffuseContribution);
    #endif
    #ifdef USE_STRANDS
    directSpecular += strandSpecular(u_frame.dirLightDirection[i].xyz, lightColor, geometryNormal, geometryViewDir, strand, strandJitter, strandTint);
    #endif
  }
  #endif

  var iblIrradiance = vec3f(0.0);
  var irradiance = u_frame.ambientLightColor;
  #if NUM_HEMI_LIGHTS > 0
  for (var i = 0; i < NUM_HEMI_LIGHTS; i++) {
    let dotNL = dot(geometryNormal, u_frame.hemiLightDirection[i].xyz);
    let hemiDiffuseWeight = 0.5 * dotNL + 0.5;
    irradiance += mix(u_frame.hemiLightGroundColor[i].xyz, u_frame.hemiLightSkyColor[i].xyz, hemiDiffuseWeight);
  }
  #endif

  var radiance = vec3f(0.0);
  var clearcoatRadiance = vec3f(0.0);
  #ifdef USE_ENVMAP
  iblIrradiance += getIBLIrradiance(geometryNormal);
  radiance += getIBLRadiance(geometryViewDir, geometryNormal, material.roughness);
  #ifdef USE_CLEARCOAT
  clearcoatRadiance += getIBLRadiance(geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness);
  #endif
  #endif

  RE_IndirectDiffuse_Physical(irradiance, geometryNormal, geometryViewDir, material);
  RE_IndirectSpecular_Physical(radiance, iblIrradiance, clearcoatRadiance, geometryNormal, geometryViewDir, geometryClearcoatNormal, material);

  var totalDiffuse = directDiffuse + indirectDiffuse;
  let totalSpecular = directSpecular + indirectSpecular;

  #ifdef USE_TRANSMISSION
  material.transmission = u_draw.transmission;
  material.transmissionAlpha = 1.0;
  material.thickness = u_draw.thickness;
  material.attenuationDistance = u_draw.attenuationDistance;
  material.attenuationColor = u_draw.attenuationColor;
  let pos = in.worldPosition;
  let v = normalize(u_frame.cameraPosition - pos);
  let n = transformNormalByInverseViewMatrix(normal, u_frame.viewMatrix);
  let transmitted = getIBLVolumeRefraction(
    n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
    pos, u_draw.modelMatrix, u_frame.viewMatrix, u_frame.glProjectionMatrix, material.ior, material.thickness,
    material.attenuationColor, material.attenuationDistance);
  material.transmissionAlpha = mix(material.transmissionAlpha, transmitted.a, material.transmission);
  totalDiffuse = mix(totalDiffuse, transmitted.rgb, material.transmission);
  #endif

  var outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
  #ifdef USE_SHEEN
  outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
  #endif
  #ifdef USE_CLEARCOAT
  let dotNVcc = saturate1(dot(geometryClearcoatNormal, geometryViewDir));
  let Fcc = F_Schlick(material.clearcoatF0, material.clearcoatF90, dotNVcc);
  outgoingLight = outgoingLight * (1.0 - material.clearcoat * Fcc) + (clearcoatSpecularDirect + clearcoatSpecularIndirect) * material.clearcoat;
  #endif

  #ifdef OPAQUE
  diffuseColor.a = 1.0;
  #endif
  #ifdef USE_TRANSMISSION
  diffuseColor.a *= material.transmissionAlpha;
  #endif
  return linearToOutputTexel(vec4f(outgoingLight, diffuseColor.a));
}
`;
