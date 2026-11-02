/**
 * Sets what an avatar's stage reflects to the equirectangular `canvas`:
 * prefiltered once and put on the stage's scene as its environment. With
 * `mirror`, the canvas is turned over first, since a sphere wraps a map round
 * the other way to the way a reflection reads one: what the glass then shows
 * is where the backdrop has it. `width` is the size it is copied down to.
 * Without a canvas or a renderer (tests under Node), it does nothing.
 */
export function reflect(stage, GFX, canvas, { mirror = false, width = 512, paint = null } = {}) {
  if (!canvas || !stage?._renderer || typeof document === 'undefined') return null;
  try {
    let source = canvas;
    if (mirror || paint || canvas.width > width) {
      source = document.createElement('canvas');
      source.width = width; source.height = width / 2;
      const ctx = source.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      if (mirror) { ctx.translate(width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(canvas, 0, 0, width, width / 2);
      paint?.(ctx, width, width / 2);
    }
    const tex = new GFX.Texture(source);
    tex.mapping = GFX.EquirectangularReflectionMapping;
    tex.colorSpace = GFX.SRGBColorSpace;
    tex.needsUpdate = true;
    const pmrem = new GFX.PMREMGenerator(stage._renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose(); tex.dispose();
    if (stage._scene) stage._scene.environment = env;
    return env;
  } catch {
    return null;
  }
}
