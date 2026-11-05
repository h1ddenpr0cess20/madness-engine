/**
 * Turns an equirectangular, grayscale elevation image into a canvas whose
 * alpha channel stores normalized height. CanvasTexture/heightOf can then
 * consume the same map, while the globe builders can sample it into vertices.
 *
 * `halfTurn` converts source maps whose left edge is 0°E into the engine's
 * conventional -180°E..+180°E layout (0°E in the middle).
 */
export function elevationToAlphaPixels(source, width, height, { halfTurn = false } = {}) {
  if (!source || source.length < width * height * 4) {
    throw new TypeError('elevation source must contain width × height RGBA pixels');
  }
  const output = new Uint8ClampedArray(width * height * 4);
  const shift = halfTurn ? Math.floor(width / 2) : 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceX = (x + shift) % width;
      const from = (y * width + sourceX) * 4;
      const to = (y * width + x) * 4;
      const value = Math.round(0.2126 * source[from] + 0.7152 * source[from + 1] + 0.0722 * source[from + 2]);
      output[to] = output[to + 1] = output[to + 2] = 255;
      output[to + 3] = value;
    }
  }
  return output;
}

/**
 * Loads a real elevation raster and places normalized height in its alpha.
 * The image must be an equirectangular global map with north at the top.
 */
export async function loadElevationMap(url, { halfTurn = false } = {}) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  try {
    await image.decode();
  } catch (error) {
    throw new Error(`could not decode elevation map: ${url}`, { cause: error });
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) throw new Error(`elevation map has no dimensions: ${url}`);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('could not create an elevation-map canvas context');
  ctx.drawImage(image, 0, 0);
  const source = ctx.getImageData(0, 0, width, height);
  const pixels = elevationToAlphaPixels(source.data, width, height, { halfTurn });
  const output = ctx.createImageData(width, height);
  output.data.set(pixels);
  ctx.putImageData(output, 0, 0);
  return canvas;
}
