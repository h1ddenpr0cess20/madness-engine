export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.

#include <common>
#include <output>

uniform vec3 diffuse;
uniform float opacity;
#ifdef USE_MAP
  uniform sampler2D map;
  in vec2 vMapUv;
#endif
#if defined( USE_COLOR ) || defined( USE_INSTANCING )
  in vec4 vColor;
#endif
out highp vec4 pc_fragColor;
void main() {
  vec4 diffuseColor = vec4( diffuse, opacity );
  #ifdef USE_MAP
    diffuseColor *= texture( map, vMapUv );
  #endif
  #if defined( USE_COLOR ) || defined( USE_INSTANCING )
    diffuseColor *= vColor;
  #endif
  vec3 indirectDiffuse = vec3( 1.0 );
  indirectDiffuse *= diffuseColor.rgb;
  vec3 outgoingLight = indirectDiffuse;
  #ifdef OPAQUE
    diffuseColor.a = 1.0;
  #endif
  pc_fragColor = linearToOutputTexel( vec4( outgoingLight, diffuseColor.a ) );
}
`;
