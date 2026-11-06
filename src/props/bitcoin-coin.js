import { createCoin } from './coin.js';

/**
 * Creates the Bitcoin alternate of the struck coin. The Bitcoin mark is
 * supplied as a high-contrast canvas so the existing relief machinery raises
 * it from both faces. Bitcoin's creation year is struck beneath the symbol.
 *
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {string} [options.metal]
 * @returns {ReturnType<typeof createCoin>}
 */
export function createBitcoinCoin(GFX, { radius = 0.3, metal = 'gold' } = {}) {
  let logo = null;
  if (typeof document !== 'undefined') {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      // Build the ₿ mark from paths so its appearance does not depend on a
      // platform font having the Bitcoin currency glyph.
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      ctx.save();
      // Scale the mark inward to leave room for the builder's year engraving.
      ctx.translate(256, 256);
      ctx.scale(0.82, 0.78);
      ctx.translate(-299, -256);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(172, 82);
      ctx.lineTo(281, 82);
      ctx.bezierCurveTo(373, 82, 408, 127, 408, 197);
      ctx.bezierCurveTo(408, 245, 386, 272, 348, 286);
      ctx.bezierCurveTo(401, 301, 426, 338, 426, 391);
      ctx.bezierCurveTo(426, 469, 369, 497, 277, 497);
      ctx.lineTo(172, 497);
      ctx.closePath();
      ctx.fill();

      // The two counters make the character read as a B rather than a solid bar.
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(239, 143);
      ctx.lineTo(281, 143);
      ctx.bezierCurveTo(326, 143, 344, 160, 344, 198);
      ctx.bezierCurveTo(344, 233, 323, 249, 281, 249);
      ctx.lineTo(239, 249);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(239, 316);
      ctx.lineTo(285, 316);
      ctx.bezierCurveTo(333, 316, 360, 332, 360, 376);
      ctx.bezierCurveTo(360, 420, 333, 436, 285, 436);
      ctx.lineTo(239, 436);
      ctx.closePath();
      ctx.fill();

      // Bitcoin's paired vertical strokes extend beyond the top and bottom of B.
      ctx.fillStyle = '#fff';
      ctx.fillRect(195, 52, 17, 136);
      ctx.fillRect(230, 52, 17, 136);
      ctx.fillRect(195, 391, 17, 100);
      ctx.fillRect(230, 391, 17, 100);
      ctx.restore();
      logo = canvas;
    }
  }

  return createCoin(GFX, {
    radius,
    logo,
    metal,
    year: '2009',
    motto: 'IN CHAINS WE TRUST',
  });
}
