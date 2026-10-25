export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
in vec3 position;
#ifdef USE_MAP
  in vec2 uv;
  uniform mat3 mapTransform;
  out vec2 vMapUv;
#endif
#ifdef USE_COLOR
  in vec3 color;
#endif
#if defined( USE_COLOR ) || defined( USE_INSTANCING )
  out vec4 vColor;
#endif
#include <instancing>
void main() {
  #ifdef USE_MAP
    vMapUv = ( mapTransform * vec3( uv, 1 ) ).xy;
  #endif
  #if defined( USE_COLOR ) || defined( USE_INSTANCING )
    vColor = vec4( 1.0 );
  #endif
  #ifdef USE_COLOR
    vColor.rgb *= color;
  #endif
  vec3 transformed = position;
  #ifdef USE_INSTANCING
    vColor.rgb *= instanceLook.yzw;
    transformed = instanceTurn( transformed, instancePlace.w ) * instanceLook.x + instancePlace.xyz;
  #endif
  vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`;
