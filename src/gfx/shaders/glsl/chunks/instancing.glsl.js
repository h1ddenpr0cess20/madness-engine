export default `// An instanced mesh's copies: where each stands and how it is turned (x, y, z, yaw), and its scale and tint.
#ifdef USE_INSTANCING
  in vec4 instancePlace;
  in vec4 instanceLook;
  // Turned about y the way the mesher's Batch.stamp turns a model.
  vec3 instanceTurn( vec3 v, float yaw ) {
    float c = cos( yaw ), s = sin( yaw );
    return vec3( v.x * c + v.z * s, v.y, - v.x * s + v.z * c );
  }
#endif
`;
