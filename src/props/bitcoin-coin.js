import { COIN_METALS, createCoin } from './coin.js';

/**
 * Bitcoin's familiar Bitboy mark, rendered from the published vector path
 * rather than a font glyph or an approximation. The shared coin builder
 * handles the year and lettering, preserving the original date geometry.
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
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fff';

      // White Bitcoin B from Bitcoin Design's published Bitboy vector.
      // Its orange circular surround is intentionally omitted: the coin
      // itself supplies the circular field and metallic relief.
      const mark = new Path2D('M48.3110008,84.375c-.3920021.9720001-1.3850021,2.4309998-3.6210022,1.8769989.0790024.1139984-5.7449989-1.4329987-5.7449989-1.4329987l-3.9199982,9.0410004,10.2799988,2.5629959c1.9109993.4790039,3.7879982.9790039,5.632,1.4530029l-3.2670021,13.1269989,7.8910027,1.9690018,3.2369995-12.9869995c2.1580009.5839996,4.25,1.125,6.2980003,1.6340027l-3.2260017,12.9259949,7.8999977,1.9690018,3.2700043-13.1019974c13.4729996,2.5479965,23.6039963,1.5199966,27.8659973-10.663002,3.4370041-9.8099976-.1699982-15.4690018-7.2579956-19.1600037,5.1609955-1.1899948,9.0509949-4.5859985,10.0879974-11.5979958,1.4329987-9.5820007-5.8629996-14.7310028-15.8379974-18.1669998l3.2350006-12.9780006-7.8990021-1.9689999-3.151001,12.6359997c-2.0790024-.5180016-4.2099991-1.0060005-6.3310013-1.4890022l3.1709976-12.7199974-7.8939972-1.9690018-3.2389984,12.9760017-15.9309998-3.9459991-2.1020012,8.4369965s5.8610001,1.3430023,5.7369995,1.427002c3.2000008.7989998,3.7770004,2.9160004,3.6809998,4.5940018l-8.8639984,35.5519981ZM85.6869965,87.302002c-2.4440002,9.810997-18.9599991,4.5069962-24.317997,3.1759949l4.3380013-17.3889999c5.3549957,1.3350067,22.5299988,3.9810028,19.9799957,14.2130051ZM88.1269989,61.8499985c-2.2259979,8.9240036-15.9749985,4.3889999-20.4349976,3.2770004l3.9319992-15.7719994c4.4589996,1.1119995,18.8239975,3.1870003,16.5029984,12.4949989Z');
      ctx.save();
      // The source vector uses a 144 × 145 viewBox. Fit its B mark into the
      // same 512 px square canvas used by the original coin-logo pipeline.
      ctx.translate(size / 2, size / 2);
      ctx.rotate(14 * Math.PI / 180);
      ctx.scale(3.35, 3.35);
      ctx.translate(-72, -72.5);
      ctx.fill(mark);
      ctx.restore();
      logo = canvas;
    }
  }

  return createCoin(GFX, {
    radius,
    logo,
    metal,
    year: '2009',
    motto: 'IN CHAINS WE RUST',
  });
}

export const assetViewer = {
  id: 'bitcoin-coin',
  name: 'bitcoin coin',
  category: 'Animated props',
  group: 'coin',
  options: { metal: COIN_METALS },
  async build({ GFX, metal = 'gold', renderer = null } = {}) {
    const { studioEnvironment } = await import('./metalglobe.js');
    const coin = createBitcoinCoin(GFX, { radius: 0.3, metal });
    coin.spinRate = 0.9;
    return Object.assign(coin, { frame: { center: [0, 0, 0], radius: 0.34 }, environment: studioEnvironment(GFX, renderer) });
  },
};
