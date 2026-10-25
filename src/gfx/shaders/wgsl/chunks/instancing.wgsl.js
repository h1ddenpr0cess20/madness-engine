export default `// An instanced mesh's copies are turned about y the way the mesher's Batch.stamp turns a model.
fn instanceTurn(v: vec3f, yaw: f32) -> vec3f {
  let c = cos(yaw);
  let s = sin(yaw);
  return vec3f(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}
`;
