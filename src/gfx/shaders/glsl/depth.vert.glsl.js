export default `// Depth only, for the shadow map.

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
in vec3 position;
#include <instancing>
void main() {
  vec3 transformed = position;
  #ifdef USE_INSTANCING
    transformed = instanceTurn( transformed, instancePlace.w ) * instanceLook.x + instancePlace.xyz;
  #endif
  gl_Position = projectionMatrix * ( modelViewMatrix * vec4( transformed, 1.0 ) );
}
`;
