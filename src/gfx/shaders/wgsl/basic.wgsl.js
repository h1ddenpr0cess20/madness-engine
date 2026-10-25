export default `// MeshBasicMaterial and LineBasicMaterial: the colour, times the map and vertex colours.

#include <frame>
#include <draw>
#include <bindings>
#include <common>
#include <output>
#ifdef USE_INSTANCING
#include <instancing>
#endif

struct VertexInput {
  @location(0) position: vec3f,
  #ifdef USE_MAP
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
struct Varyings {
  @builtin(position) position: vec4f,
  #ifdef USE_MAP
  @location(0) mapUv: vec2f,
  #endif
  #if defined(USE_COLOR) || defined(USE_INSTANCING)
  @location(1) color: vec4f,
  #endif
};

@vertex
fn vs(in: VertexInput) -> Varyings {
  var out: Varyings;
  #ifdef USE_MAP
  out.mapUv = (u_draw.mapTransform * vec3f(in.uv, 1.0)).xy;
  #endif
  #if defined(USE_COLOR) || defined(USE_INSTANCING)
  out.color = vec4f(1.0);
  #endif
  #ifdef USE_COLOR
  out.color = vec4f(out.color.rgb * in.color, 1.0);
  #endif
  var transformed = in.position;
  #ifdef USE_INSTANCING
  out.color = vec4f(out.color.rgb * in.instanceLook.yzw, 1.0);
  transformed = instanceTurn(transformed, in.instancePlace.w) * in.instanceLook.x + in.instancePlace.xyz;
  #endif
  let mvPosition = u_draw.modelViewMatrix * vec4f(transformed, 1.0);
  out.position = u_frame.projectionMatrix * mvPosition;
  return out;
}

@fragment
fn fs(in: Varyings) -> @location(0) vec4f {
  var diffuseColor = vec4f(u_draw.diffuse, u_draw.opacity);
  #ifdef USE_MAP
  diffuseColor *= textureSample(t_map, s_map, in.mapUv);
  #endif
  #if defined(USE_COLOR) || defined(USE_INSTANCING)
  diffuseColor *= in.color;
  #endif
  var indirectDiffuse = vec3f(1.0);
  indirectDiffuse *= diffuseColor.rgb;
  let outgoingLight = indirectDiffuse;
  #ifdef OPAQUE
  diffuseColor.a = 1.0;
  #endif
  return linearToOutputTexel(vec4f(outgoingLight, diffuseColor.a));
}
`;
