/**
 * What moves, and what lies about, as it is drawn: speaker stacks that slam
 * down on the beat, pyro in the floor, lifts, security gates, flimsy panels,
 * bumpers and the pickups. Each `create…` gives { group, update(...) }; the
 * logic is in actors.js.
 */

const dark = (GFX, hex, o = {}) => new GFX.MeshStandardMaterial({ color: new GFX.Color(hex), roughness: 0.6, ...o });

/** A bumper: a squat chrome post with a glowing ring, which flashes when Rock bounces off it. */
/**
 * A bumper, by its `look`: 'post' (a pinball post, chrome with a lit ring),
 * 'rope' (a brass stanchion of a velvet rope, the rope looped round it),
 * 'podium' (a go-go dancer's lit cube) or 'drum' (a kick drum on its side,
 * the head facing up). Each flashes and swells when it throws Rock.
 */
export function createBumperMesh(GFX, { radius, look = 'post' }) {
  const group = new GFX.Group();
  const parts = [];
  let flashColour = [1, 0.23, 0.54], rest = [1, 0.23, 0.54];
  const ringMat = new GFX.MeshBasicMaterial({ color: new GFX.Color(...rest), toneMapped: false });
  if (look === 'rope') {
    const brass = dark(GFX, '#d8a848', { metalness: 0.9, roughness: 0.25 });
    const base = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.55, radius * 0.7, 0.08, 18), brass);
    base.position.y = 0.04;
    const post = new GFX.Mesh(new GFX.CylinderGeometry(0.05, 0.06, 0.8, 10), brass);
    post.position.y = 0.42;
    const knob = new GFX.Mesh(new GFX.SphereGeometry(0.1, 12, 8), brass);
    knob.position.y = 0.86;
    const velvet = new GFX.MeshStandardMaterial({ color: new GFX.Color('#b0102a'), roughness: 0.75 });
    const rope = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.72, 0.045, 8, 24), velvet);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.66;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.7, 0.025, 6, 24), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.09;
    parts.push(base, post, knob, rope);
    group.add(...parts, ring);
    rest = [1, 0.75, 0.3];
    flashColour = [1, 1, 0.8];
  } else if (look === 'podium') {
    const shell = dark(GFX, '#1a1424', { metalness: 0.3, roughness: 0.35 });
    const cube = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.6, 0.5, radius * 1.6), shell);
    cube.position.y = 0.25;
    const top = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.5, 0.04, radius * 1.5), ringMat);
    top.position.y = 0.51;
    const band = new GFX.Mesh(new GFX.BoxGeometry(radius * 1.64, 0.05, radius * 1.64), ringMat);
    band.position.y = 0.06;
    parts.push(cube);
    group.add(cube, top, band);
    rest = [0.2, 0.85, 1];
    flashColour = [1, 0.3, 0.8];
  } else if (look === 'drum') {
    const shellMat = dark(GFX, '#b81c2a', { metalness: 0.2, roughness: 0.3 });
    const chrome = dark(GFX, '#e8eaf0', { metalness: 0.9, roughness: 0.2 });
    const head = new GFX.MeshStandardMaterial({ color: new GFX.Color('#f2ece0'), roughness: 0.7 });
    const body = new GFX.Mesh(new GFX.CylinderGeometry(radius, radius, 0.42, 24), shellMat);
    body.position.y = 0.21;
    const skin = new GFX.Mesh(new GFX.CircleGeometry(radius * 0.96, 24), head);
    skin.rotation.x = -Math.PI / 2;
    skin.position.y = 0.425;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.98, 0.03, 6, 28), chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.42;
    const glow = new GFX.Mesh(new GFX.TorusGeometry(radius * 1.0, 0.025, 6, 28), ringMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.03;
    parts.push(body);
    group.add(body, skin, ring, glow);
    rest = [1, 0.6, 0.2];
    flashColour = [1, 1, 0.6];
  } else {
    const chrome = dark(GFX, '#eef0f6', { metalness: 0.55, roughness: 0.22, emissive: new GFX.Color('#4a3a58'), emissiveIntensity: 0.7 });
    const post = new GFX.Mesh(new GFX.CylinderGeometry(radius * 0.8, radius, 0.5, 20), chrome);
    post.position.y = 0.25;
    const cap = new GFX.Mesh(new GFX.SphereGeometry(radius * 0.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), chrome);
    cap.position.y = 0.5;
    const ring = new GFX.Mesh(new GFX.TorusGeometry(radius * 0.92, 0.04, 8, 28), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.22;
    parts.push(post, cap);
    group.add(post, cap, ring);
    flashColour = [1, 0.93, 0.94];
  }
  for (const m of parts) m.castShadow = true;
  return {
    group,
    update(since) {
      const flash = since >= 0 && since < 0.25 ? 1 - since / 0.25 : 0;
      ringMat.color.setRGB(...rest.map((v, i) => v + (flashColour[i] - v) * flash));
      group.scale.setScalar(1 + flash * 0.12);
    },
  };
}
