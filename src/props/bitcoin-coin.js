import { createCoin } from './coin.js';

/**
 * Creates the Bitcoin alternate of the struck coin. The symbol is painted as a
 * high-contrast grayscale canvas so the existing coin relief machinery raises
 * it from both faces. Bitcoin's genesis year (2009) is struck beneath it.
 *
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {string} [options.metal]
 * @returns {Promise<ReturnType<typeof createCoin>>}
 */
export async function createBitcoinCoin(GFX, { radius = 0.3, metal = 'gold' } = {}) {
  let logo = null;
  if (typeof document !== 'undefined') {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      // White is raised by createCoin's displacement relief; black remains flat.
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 390px Arial, Helvetica, sans-serif';
      ctx.fillText('₿', size / 2, size / 2 + 4);
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
