/**
 * A stand-in for the stage the avatar apps (Krystal, Vibey, Slimey) were
 * written for: they hand their model to `stage.setObject` and dress the
 * scene round it (a room, a table, reflections). Here what they hand over
 * goes into `group`, to stand anywhere; what they would dress the scene
 * with goes into a scene of its own that nothing draws. `renderer` is for
 * the reflections they bake, if there is one; without it they do without.
 */
export function standIn(GFX, renderer = null) {
  const group = new GFX.Group();
  const backstage = new GFX.Scene();
  // A real element where there is a page (one of them watches its size), with a camera and controls of its own that
  // move nothing: what they frame, they frame for themselves.
  const stage = typeof document !== 'undefined' ? document.createElement('div') : {};
  Object.assign(stage, {
    _scene: backstage,
    _renderer: renderer,
    _camera: new GFX.PerspectiveCamera(35, 1, 0.01, 100),
    _controls: { target: new GFX.Vector3(), addEventListener() {}, removeEventListener() {}, update() {} },
    // The lights and the ground they would set: stand-ins too, in the scene nothing draws.
    _key: new GFX.DirectionalLight('#ffffff', 1),
    _fill: new GFX.DirectionalLight('#ffffff', 0.5),
    _ground: new GFX.Group(),
    setObject(o) { group.add(o); },
  });
  for (const name of ['addEventListener', 'removeEventListener', 'setPointerCapture', 'releasePointerCapture']) stage[name] ??= () => {};
  stage.hasPointerCapture ??= () => false;
  return { group, stage };
}
