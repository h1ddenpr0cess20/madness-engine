export default `// Shadow-map depth: the position through the light's view, nothing else.

struct Depth { modelViewMatrix: mat4x4f, projectionMatrix: mat4x4f };
@group(0) @binding(0) var<uniform> u_depth: Depth;

#ifdef USE_INSTANCING
#include <instancing>

@vertex
fn vs(@location(0) position: vec3f, @location(5) instancePlace: vec4f, @location(6) instanceLook: vec4f) -> @builtin(position) vec4f {
  let transformed = instanceTurn(position, instancePlace.w) * instanceLook.x + instancePlace.xyz;
  return u_depth.projectionMatrix * (u_depth.modelViewMatrix * vec4f(transformed, 1.0));
}
#else
@vertex
fn vs(@location(0) position: vec3f) -> @builtin(position) vec4f {
  return u_depth.projectionMatrix * (u_depth.modelViewMatrix * vec4f(position, 1.0));
}
#endif
`;
