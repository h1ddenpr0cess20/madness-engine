export default `// Anti-tiling: a tile repeated over a street or a lawn shows as a grid from any height. Each lookup takes the
// tile twice, shifted by amounts a slow noise picks (one of eight), and blends them: the pattern never lines up the
// same way twice, and the mip level follows the true layout, so there are no seams (after Inigo Quilez).

fn antiTileHash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn antiTileNoise(p: vec2f) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(antiTileHash(i), antiTileHash(i + vec2f(1.0, 0.0)), f.x), mix(antiTileHash(i + vec2f(0.0, 1.0)), antiTileHash(i + vec2f(1.0, 1.0)), f.x), f.y);
}

fn untiled(t: texture_2d<f32>, s: sampler, uv: vec2f, dx: vec2f, dy: vec2f) -> vec4f {
  let l = antiTileNoise(uv * 0.37) * 8.0;
  let ia = floor(l);
  let f = fract(l);
  let offA = sin(vec2f(3.0, 7.0) * ia);
  let offB = sin(vec2f(3.0, 7.0) * (ia + 1.0));
  return mix(textureSampleGrad(t, s, uv + offA, dx, dy), textureSampleGrad(t, s, uv + offB, dx, dy), smoothstep(0.2, 0.8, f));
}
`;
