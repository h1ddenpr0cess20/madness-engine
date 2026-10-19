/**
 * The film the picture is shot on, as Rock 'n' Roller II, III and Metroll
 * shoot theirs: a grade on the picture and nothing else (a CSS filter on the
 * canvas: the noir's black and white, a western's sepia, London's fog), a
 * vignette shading its edges (or a sandstorm's haze), a fine grain dancing
 * over it as on a print, and, where the film says so, the interface on the
 * same stock (the noir's).
 *
 *     const film = createFilm(host, { ui: [hud] });
 *     film.set(noir.film);       // moods/*: the film of each set
 *     film.set(GRADES.sepia);    // moods/grades: every grade, on its game's film
 *     film.set(null);            // straight
 *
 * The stage has one (`stage.film`), and `stage.setMood` sets it.
 */

/** The grain: fractal noise, grey, on a tile 180 pixels square. */
export const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

/** How the grain dances: from place to place (in % of its size), in `steps` jumps between each, round in `duration` ms. */
export const DANCE = Object.freeze({ places: [[0, 0], [-7, 4], [5, -6], [-3, -2], [0, 0]], steps: 4, duration: 500 });

/**
 * @param host  the element the picture is in; the vignette and the grain go over it
 * @param options
 *   - `canvas`: a function giving the picture's canvas (the first canvas in `host`)
 *   - `ui`: elements shot on the same film as the picture where a film says so
 * @returns { set(film), current, ui }: a film is { filter, grain, vignette, ui },
 *   each null (or missing) for none
 */
export function createFilm(host, { canvas = () => host.querySelector('canvas'), ui = [] } = {}) {
  const doc = host.ownerDocument;
  let vignette = null, frame = null, grain = null, dance = null;

  const layer = (parent, style = {}) => {
    const el = doc.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, { position: 'absolute', inset: '0', pointerEvents: 'none', display: 'none' }, style);
    parent.appendChild(el);
    return el;
  };
  // Over the picture, the vignette and then the grain; the grain is twice the picture's size, so it can dance without showing an edge.
  const layers = () => {
    if (vignette) return;
    if (globalThis.getComputedStyle?.(host).position === 'static') host.style.position = 'relative';
    vignette = layer(host);
    frame = layer(host, { overflow: 'hidden' });
    grain = layer(frame, { inset: '-50%', display: '', mixBlendMode: 'overlay', backgroundImage: GRAIN });
  };
  const still = () => Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const show = (el, on) => { el.style.display = on ? '' : 'none'; };

  const film = {
    /** The film the picture is on now, or null. */
    current: null,
    /** What is shot on the same film as the picture where a film says so; add to it as the interface is built. */
    ui: [...ui],

    /** Shoots the picture on `next` (null for none). */
    set(next = null) {
      film.current = next;
      const picture = canvas();
      if (picture) picture.style.filter = next?.filter ?? '';
      for (const el of film.ui) el.style.filter = next?.ui ?? '';
      if (next?.vignette || next?.grain) layers();
      if (!vignette) return film;
      if (next?.vignette) vignette.style.background = next.vignette;
      show(vignette, Boolean(next?.vignette));
      show(frame, Boolean(next?.grain));
      if (next?.grain) {
        grain.style.opacity = String(next.grain);
        if (!dance && !still() && grain.animate) {
          const keyframes = DANCE.places.map(([x, y]) => ({ transform: `translate(${x}%, ${y}%)`, easing: `steps(${DANCE.steps})` }));
          dance = grain.animate(keyframes, { duration: DANCE.duration, iterations: Infinity });
        }
      } else if (dance) {
        dance.cancel();
        dance = null;
      }
      return film;
    },
  };
  return film;
}
