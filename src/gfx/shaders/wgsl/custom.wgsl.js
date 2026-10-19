export default `

struct Object {
  modelMatrix: mat4x4f,
  modelViewMatrix: mat4x4f,
  projectionMatrix: mat4x4f,
  viewMatrix: mat4x4f,
  normalMatrix: mat3x3f,
  cameraPosition: vec3f,
};
struct Material {
MATERIAL_FIELDS
};
@group(0) @binding(0) var<uniform> object: Object;
@group(0) @binding(1) var<uniform> material: Material;
`;
