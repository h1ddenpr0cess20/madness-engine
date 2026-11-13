export default `// MeshStandardMaterial and MeshPhysicalMaterial: the physically based model (adapted from three.js; see LICENSE).

#ifdef PHYSICAL
  #define IOR
  #define USE_SPECULAR
#endif

#include <common>
#include <output>

uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
uniform bool receiveShadow;

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
  uniform float ior;
#endif
#ifdef USE_SPECULAR
  uniform float specularIntensity;
  uniform vec3 specularColor;
#endif
#ifdef USE_CLEARCOAT
  uniform float clearcoat;
  uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
  uniform float iridescence;
  uniform float iridescenceIOR;
  uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
  uniform vec3 sheenColor;
  uniform float sheenRoughness;
#endif
#ifdef USE_TRANSMISSION
  uniform float transmission;
  uniform float thickness;
  uniform float attenuationDistance;
  uniform vec3 attenuationColor;
  in vec3 vWorldPosition;
#endif

in vec3 vViewPosition;
#ifndef FLAT_SHADED
  in vec3 vNormal;
#endif
#if defined( USE_COLOR ) || defined( USE_INSTANCING )
  in vec4 vColor;
#endif
#ifdef USE_MAP
  uniform sampler2D map;
  in vec2 vMapUv;
#endif
#ifdef USE_EMISSIVEMAP
  uniform sampler2D emissiveMap;
#endif
#ifdef USE_DETAILMAP
  uniform sampler2D detailMap;
  uniform float detailScale;
#endif
#ifdef USE_ANTITILE
  // A tile repeated over a street or a lawn shows as a grid from any height. Here each lookup takes the tile twice,
  // shifted by amounts a slow noise picks (one of eight), and blends them: the pattern never lines up the same way
  // twice, and the mip level follows the true layout, so there are no seams (after Inigo Quilez's texture repetition).
  float antiTileHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
  float antiTileNoise( vec2 p ) {
    vec2 i = floor( p ), f = fract( p );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix( mix( antiTileHash( i ), antiTileHash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( antiTileHash( i + vec2( 0.0, 1.0 ) ), antiTileHash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
  }
  vec4 untiled( sampler2D s, vec2 uv, vec2 dx, vec2 dy ) {
    float l = antiTileNoise( uv * 0.37 ) * 8.0;
    float ia = floor( l ), f = fract( l );
    vec2 offA = sin( vec2( 3.0, 7.0 ) * ia ), offB = sin( vec2( 3.0, 7.0 ) * ( ia + 1.0 ) );
    return mix( textureGrad( s, uv + offA, dx, dy ), textureGrad( s, uv + offB, dx, dy ), smoothstep( 0.2, 0.8, f ) );
  }
  #define TILED( s, uv ) untiled( s, uv, dFdx( uv ), dFdy( uv ) )
#else
  #define TILED( s, uv ) texture( s, uv )
#endif
#ifdef USE_SUBSURFACE
  uniform vec3 subsurfaceColor;

  // Light carried under the surface past where it falls: each colour wrapped round the form as far as
  // it travels (skin's red furthest), over the smooth shape, not the pores'.
  vec3 subsurfaceScatter( vec3 L, vec3 lightColor, vec3 N, vec3 albedo ) {
    float nl = dot( N, L );
    vec3 wrapped = clamp( ( nl + subsurfaceColor ) / ( 1.0 + subsurfaceColor ), 0.0, 1.0 );
    return lightColor * albedo * RECIPROCAL_PI * ( wrapped - clamp( nl, 0.0, 1.0 ) );
  }
#endif
#ifdef USE_BUMPMAP
  uniform sampler2D bumpMap;
  uniform float bumpScale;
  in vec2 vBumpMapUv;

  vec2 dHdxy_fwd() {
    vec2 dSTdx = dFdx( vBumpMapUv );
    vec2 dSTdy = dFdy( vBumpMapUv );
    float Hll = bumpScale * TILED( bumpMap, vBumpMapUv ).x;
    float dBx = bumpScale * TILED( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
    float dBy = bumpScale * TILED( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
    vec2 dH = vec2( dBx, dBy );
    #ifdef USE_DETAILMAP
      // The detail map, on the colour map's layout: how much of the fine bump shows here (b), and a
      // relief of its own (r) for what the tile cannot hold: creases, wrinkles, folds.
      vec3 detail = texture( detailMap, vMapUv ).xyz;
      dH *= detail.z;
      dH += detailScale * ( vec2( texture( detailMap, vMapUv + dFdx( vMapUv ) ).x, texture( detailMap, vMapUv + dFdy( vMapUv ) ).x ) - detail.x );
    #endif
    return dH;
  }

  vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
    vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
    vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
    vec3 vN = surf_norm;
    vec3 R1 = cross( vSigmaY, vN );
    vec3 R2 = cross( vN, vSigmaX );
    float fDet = dot( vSigmaX, R1 ) * faceDirection;
    vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
    return normalize( abs( fDet ) * surf_norm - vGrad );
  }
#endif

uniform sampler2D dfgLUT;
uniform vec3 ambientLightColor;
#if NUM_DIR_LIGHTS > 0
  uniform vec3 directionalLightDirection[ NUM_DIR_LIGHTS ];
  uniform vec3 directionalLightColor[ NUM_DIR_LIGHTS ];
#endif
#if NUM_POINT_LIGHTS > 0
  uniform vec3 pointLightPosition[ NUM_POINT_LIGHTS ];
  uniform vec3 pointLightColor[ NUM_POINT_LIGHTS ];
  uniform float pointLightDistance[ NUM_POINT_LIGHTS ];
  uniform float pointLightDecay[ NUM_POINT_LIGHTS ];

  float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
    float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
    if ( cutoffDistance > 0.0 ) {
      distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
    }
    return distanceFalloff;
  }
#endif
#if NUM_HEMI_LIGHTS > 0
  uniform vec3 hemisphereLightDirection[ NUM_HEMI_LIGHTS ];
  uniform vec3 hemisphereLightSkyColor[ NUM_HEMI_LIGHTS ];
  uniform vec3 hemisphereLightGroundColor[ NUM_HEMI_LIGHTS ];
#endif

#ifdef USE_ENVMAP
  uniform sampler2D envMap;
  uniform float envMapIntensity;
  uniform mat3 envMapRotation;
  #include <cube_uv>

  vec3 getIBLIrradiance( const in vec3 normal ) {
    vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
    vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
    return PI * envMapColor.rgb * envMapIntensity;
  }

  vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
    vec3 reflectVec = reflect( - viewDir, normal );
    reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
    reflectVec = transformNormalByInverseViewMatrix( reflectVec, viewMatrix );
    vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
    return envMapColor.rgb * envMapIntensity;
  }
#endif

#include <iridescence>
#include <physical_lighting>
#include <transmission>
#include <shadow_pars_fragment>

out highp vec4 pc_fragColor;

#ifdef USE_STRANDS
  // Hair's two highlights (Kajiya and Kay's model, as Scheuermann shifts it): light glancing off each
  // strand's surface, white and tight, toward the root; and light that went into the strand and back out,
  // coloured by it and broader, toward the tip. Both run across the strands, not along them, as hair's do.
  vec3 strandSpecular( vec3 L, vec3 lightColor, vec3 N, vec3 V, vec3 T, float jitter, vec3 tint ) {
    vec3 H = normalize( L + V );
    vec3 T1 = normalize( T + N * ( 0.1 + jitter ) ), T2 = normalize( T - N * ( 0.12 - jitter ) );
    float d1 = dot( T1, H ), d2 = dot( T2, H );
    float s1 = pow( sqrt( max( 0.0, 1.0 - d1 * d1 ) ), 260.0 );
    float s2 = pow( sqrt( max( 0.0, 1.0 - d2 * d2 ) ), 90.0 );
    float lit = smoothstep( -0.15, 0.35, dot( N, L ) );
    return lightColor * lit * ( 0.035 * s1 + 0.18 * s2 * tint );
  }
#endif

void main() {
  vec4 diffuseColor = vec4( diffuse, opacity );
  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  vec3 totalEmissiveRadiance = emissive;
  #ifdef USE_EMISSIVEMAP
    totalEmissiveRadiance *= texture( emissiveMap, vMapUv ).rgb;
  #endif
  #if defined( EMISSIVE_SCATTER ) && defined( USE_MAP )
    {
      // Each repeat of the map (a window) by its own chance; the vertex colour (a building's tint) shuffles them.
      #ifdef EMISSIVE_CELLS
        float seed = dot( floor( vMapUv * EMISSIVE_CELLS ), vec2( 12.9898, 78.233 ) );
      #else
        float seed = dot( floor( vMapUv ), vec2( 12.9898, 78.233 ) );
      #endif
      #if defined( USE_COLOR ) || defined( USE_INSTANCING )
        seed += dot( vColor.rgb, vec3( 39.3, 11.1, 23.7 ) ) * 17.0;
      #endif
      float on = fract( sin( seed ) * 43758.5453 ), bright = fract( sin( seed * 1.7 + 3.1 ) * 24634.6345 );
      totalEmissiveRadiance *= step( on, EMISSIVE_SCATTER ) * ( 0.6 + 0.8 * bright );
    }
  #endif

  #ifdef USE_MAP
    diffuseColor *= TILED( map, vMapUv );
    #ifdef USE_ANTITILE
      // And the whole drifts a little lighter and darker over tens of tiles, as a real surface weathers.
      diffuseColor.rgb *= 0.86 + 0.28 * antiTileNoise( vMapUv * 0.045 + 17.0 );
    #endif
  #endif
  #if defined( USE_COLOR ) || defined( USE_INSTANCING )
    diffuseColor *= vColor;
  #endif
  #ifdef USE_ALPHATEST
    #ifdef USE_MAP
      // A mip averages thin texels away; scaled back up by how far down the chain this lookup is, a
      // strand keeps the coverage it had up close.
      vec2 texel = vMapUv * vec2( textureSize( map, 0 ) );
      vec2 tdx = dFdx( texel ), tdy = dFdy( texel );
      float mipLevel = max( 0.0, 0.5 * log2( max( dot( tdx, tdx ), dot( tdy, tdy ) ) ) );
      diffuseColor.a = min( 1.0, diffuseColor.a * ( 1.0 + mipLevel * 0.25 ) );
    #endif
    if ( diffuseColor.a < ALPHA_TEST ) discard;
  #endif
  float roughnessFactor = roughness;
  #ifdef USE_DETAILMAP
    // The detail map's g: rougher or glossier than the material, 0.5 as it is.
    roughnessFactor *= texture( detailMap, vMapUv ).y * 2.0;
  #endif
  float metalnessFactor = metalness;

  float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
  #ifdef FLAT_SHADED
    vec3 fdx = dFdx( vViewPosition );
    vec3 fdy = dFdy( vViewPosition );
    vec3 normal = normalize( cross( fdx, fdy ) );
  #else
    vec3 normal = normalize( vNormal );
    #ifdef DOUBLE_SIDED
      normal *= faceDirection;
    #endif
  #endif
  vec3 nonPerturbedNormal = normal;
  #ifdef USE_BUMPMAP
    normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
  #endif
  #ifdef USE_CLEARCOAT
    vec3 clearcoatNormal = nonPerturbedNormal;
  #endif
  #ifdef USE_STRANDS
    // Which way the strand runs here (the texture's v), from how the place and the UV change across the pixel.
    vec3 sq0 = dFdx( - vViewPosition ), sq1 = dFdy( - vViewPosition );
    vec2 sst0 = dFdx( vMapUv ), sst1 = dFdy( vMapUv );
    vec3 strand = cross( sq1, normal ) * sst0.y + cross( normal, sq0 ) * sst1.y;
    strand *= inversesqrt( max( dot( strand, strand ), 1e-20 ) );
    // Each strand's highlight a little off its neighbours', by its own shade in the texture.
    float strandJitter = ( texture( map, vMapUv ).g - 0.9 ) * 0.5;
    // The second highlight has been through the strand: it is the hair's own colour, as bright as the hair is.
    vec3 strandTint = diffuseColor.rgb;
  #endif

  PhysicalMaterial material;
  material.diffuseColor = diffuseColor.rgb;
  material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
  material.metalness = metalnessFactor;
  vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
  float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
  material.roughness = max( roughnessFactor, 0.0525 );
  material.roughness += geometryRoughness;
  material.roughness = min( material.roughness, 1.0 );
  #ifdef IOR
    material.ior = ior;
    float specularIntensityFactor = specularIntensity;
    vec3 specularColorFactor = specularColor;
    material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
    material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
    material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
  #else
    material.specularColor = vec3( 0.04 );
    material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
    material.specularF90 = 1.0;
  #endif
  #ifdef USE_CLEARCOAT
    material.clearcoat = clearcoat;
    material.clearcoatRoughness = clearcoatRoughness;
    material.clearcoatF0 = vec3( 0.04 );
    material.clearcoatF90 = 1.0;
    material.clearcoat = saturate( material.clearcoat );
    material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
    material.clearcoatRoughness += geometryRoughness;
    material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
  #endif
  #ifdef USE_IRIDESCENCE
    material.iridescence = iridescence;
    material.iridescenceIOR = iridescenceIOR;
    material.iridescenceThickness = iridescenceThicknessMaximum;
  #endif
  #ifdef USE_SHEEN
    material.sheenColor = sheenColor;
    material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
  #endif

  vec3 geometryPosition = - vViewPosition;
  vec3 geometryNormal = normal;
  vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
  vec3 geometryClearcoatNormal = vec3( 0.0 );
  #ifdef USE_CLEARCOAT
    geometryClearcoatNormal = clearcoatNormal;
  #endif

  #ifdef USE_IRIDESCENCE
    float dotNVi = saturate( dot( normal, geometryViewDir ) );
    if ( material.iridescenceThickness == 0.0 ) {
      material.iridescence = 0.0;
    } else {
      material.iridescence = saturate( material.iridescence );
    }
    if ( material.iridescence > 0.0 ) {
      vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
      vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
      material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
      material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
      material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
    }
  #endif

  float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
  material.dfg = textureLod( dfgLUT, vec2( material.roughness, dotNVms ), 0.0 ).rg;
  #if ( NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 )
    float EssMs = material.dfg.x + material.dfg.y;
    material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
  #endif

  #if NUM_POINT_LIGHTS > 0
    for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
      vec3 lVector = pointLightPosition[ i ] - geometryPosition;
      vec3 lightDirection = normalize( lVector );
      float lightDistance = length( lVector );
      vec3 lightColor = pointLightColor[ i ];
      lightColor *= getDistanceAttenuation( lightDistance, pointLightDistance[ i ], pointLightDecay[ i ] );
      RE_Direct_Physical( lightDirection, lightColor, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
      #ifdef USE_SUBSURFACE
        reflectedLight.directDiffuse += subsurfaceScatter( lightDirection, lightColor, nonPerturbedNormal, material.diffuseContribution );
      #endif
      #ifdef USE_STRANDS
        reflectedLight.directSpecular += strandSpecular( lightDirection, lightColor, geometryNormal, geometryViewDir, strand, strandJitter, strandTint );
      #endif
    }
  #endif

  #if NUM_DIR_LIGHTS > 0
    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
      vec3 lightColor = directionalLightColor[ i ];
      #if NUM_DIR_LIGHT_SHADOWS > 0
        if ( i == 0 ) lightColor *= receiveShadow ? directionalShadow() : 1.0;
      #endif
      RE_Direct_Physical( directionalLightDirection[ i ], lightColor, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
      #ifdef USE_SUBSURFACE
        reflectedLight.directDiffuse += subsurfaceScatter( directionalLightDirection[ i ], lightColor, nonPerturbedNormal, material.diffuseContribution );
      #endif
      #ifdef USE_STRANDS
        reflectedLight.directSpecular += strandSpecular( directionalLightDirection[ i ], lightColor, geometryNormal, geometryViewDir, strand, strandJitter, strandTint );
      #endif
    }
  #endif

  vec3 iblIrradiance = vec3( 0.0 );
  vec3 irradiance = ambientLightColor;
  #if NUM_HEMI_LIGHTS > 0
    for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
      float dotNL = dot( geometryNormal, hemisphereLightDirection[ i ] );
      float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
      irradiance += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );
    }
  #endif

  vec3 radiance = vec3( 0.0 );
  vec3 clearcoatRadiance = vec3( 0.0 );
  #ifdef USE_ENVMAP
    iblIrradiance += getIBLIrradiance( geometryNormal );
    radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
    #ifdef USE_CLEARCOAT
      clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
    #endif
  #endif

  RE_IndirectDiffuse_Physical( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
  RE_IndirectSpecular_Physical( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

  vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

  #ifdef USE_TRANSMISSION
    material.transmission = transmission;
    material.transmissionAlpha = 1.0;
    material.thickness = thickness;
    material.attenuationDistance = attenuationDistance;
    material.attenuationColor = attenuationColor;
    vec3 pos = vWorldPosition;
    vec3 v = normalize( cameraPosition - pos );
    vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
    vec4 transmitted = getIBLVolumeRefraction(
      n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
      pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
      material.attenuationColor, material.attenuationDistance );
    material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
    totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
  #endif

  vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
  #ifdef USE_SHEEN
    outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
  #endif
  #ifdef USE_CLEARCOAT
    float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
    vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
    outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
  #endif

  #ifdef OPAQUE
    diffuseColor.a = 1.0;
  #endif
  #ifdef USE_TRANSMISSION
    diffuseColor.a *= material.transmissionAlpha;
  #endif
  pc_fragColor = linearToOutputTexel( vec4( outgoingLight, diffuseColor.a ) );
}
`;
