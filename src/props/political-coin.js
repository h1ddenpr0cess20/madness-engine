import { createCoin } from './coin.js';

const SIZE = 512;

function canvasOf(draw) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#fff';
  draw(ctx);
  return canvas;
}

function donkey(ctx) {
  ctx.beginPath();
  // Long-bodied donkey in profile, with the two tall ears as the key identifier.
  ctx.moveTo(112, 224);
  ctx.bezierCurveTo(132, 192, 190, 180, 250, 193);
  ctx.bezierCurveTo(278, 200, 299, 187, 311, 164);
  ctx.lineTo(323, 116);
  ctx.bezierCurveTo(326, 101, 340, 94, 347, 106);
  ctx.lineTo(353, 153);
  ctx.lineTo(368, 105);
  ctx.bezierCurveTo(372, 91, 385, 92, 389, 106);
  ctx.lineTo(385, 168);
  ctx.bezierCurveTo(409, 180, 423, 201, 421, 225);
  ctx.lineTo(448, 232);
  ctx.bezierCurveTo(460, 236, 459, 248, 447, 252);
  ctx.lineTo(418, 258);
  ctx.bezierCurveTo(409, 280, 393, 295, 374, 301);
  ctx.lineTo(388, 378); ctx.lineTo(361, 378); ctx.lineTo(340, 306);
  ctx.lineTo(312, 301); ctx.lineTo(297, 378); ctx.lineTo(270, 378);
  ctx.lineTo(269, 299); ctx.lineTo(197, 292); ctx.lineTo(178, 378);
  ctx.lineTo(151, 378); ctx.lineTo(155, 278);
  ctx.bezierCurveTo(133, 270, 117, 257, 112, 240);
  ctx.closePath();
  ctx.fill();

  // Tail, with a small tuft.
  ctx.beginPath();
  ctx.moveTo(117, 225); ctx.bezierCurveTo(96, 211, 88, 193, 96, 176);
  ctx.bezierCurveTo(101, 164, 102, 151, 96, 142);
  ctx.bezierCurveTo(90, 132, 99, 127, 107, 135);
  ctx.bezierCurveTo(121, 149, 120, 168, 115, 185);
  ctx.bezierCurveTo(111, 199, 119, 210, 130, 215);
  ctx.closePath(); ctx.fill();

  // Recessed eye, nostril, mane and hoof separations.
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(374, 185, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(438, 242, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(305, 177); ctx.lineTo(314, 192); ctx.lineTo(324, 198);
  ctx.lineTo(318, 204); ctx.lineTo(302, 190); ctx.closePath(); ctx.fill();
  ctx.fillRect(157, 355, 16, 5);
  ctx.fillRect(276, 355, 16, 5);
  ctx.fillRect(365, 355, 16, 5);
}

function elephant(ctx) {
  ctx.beginPath();
  // Elephant in profile: broad ear, heavy body, curved trunk and four legs.
  ctx.moveTo(145, 176);
  ctx.bezierCurveTo(122, 158, 97, 169, 94, 194);
  ctx.bezierCurveTo(91, 217, 108, 235, 132, 243);
  ctx.lineTo(94, 275);
  ctx.bezierCurveTo(77, 289, 82, 311, 100, 316);
  ctx.bezierCurveTo(116, 320, 130, 307, 130, 291);
  ctx.lineTo(157, 266);
  ctx.bezierCurveTo(178, 286, 198, 296, 222, 300);
  ctx.lineTo(215, 379); ctx.lineTo(245, 379); ctx.lineTo(260, 304);
  ctx.lineTo(310, 303); ctx.lineTo(329, 379); ctx.lineTo(358, 379);
  ctx.lineTo(354, 294);
  ctx.bezierCurveTo(381, 280, 400, 254, 405, 224);
  ctx.bezierCurveTo(411, 193, 394, 165, 368, 149);
  ctx.bezierCurveTo(344, 135, 313, 126, 281, 127);
  ctx.bezierCurveTo(241, 126, 210, 138, 188, 158);
  ctx.bezierCurveTo(174, 146, 156, 146, 144, 157);
  ctx.bezierCurveTo(136, 164, 137, 171, 145, 176);
  ctx.closePath();
  ctx.fill();

  // Tail and a clean tusk highlight.
  ctx.beginPath();
  ctx.moveTo(400, 208); ctx.bezierCurveTo(421, 214, 428, 233, 423, 251);
  ctx.bezierCurveTo(419, 267, 410, 276, 401, 281);
  ctx.lineTo(397, 265); ctx.bezierCurveTo(410, 249, 410, 230, 400, 208);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(145, 185, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Ear crease and trunk wrinkles give the silhouette definition at coin scale.
  ctx.beginPath();
  ctx.moveTo(166, 176); ctx.bezierCurveTo(190, 154, 221, 164, 235, 190);
  ctx.bezierCurveTo(247, 215, 237, 246, 215, 255);
  ctx.bezierCurveTo(190, 265, 165, 244, 160, 218);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(91, 281); ctx.bezierCurveTo(103, 274, 116, 276, 128, 284);
  ctx.lineTo(122, 292); ctx.bezierCurveTo(112, 285, 104, 286, 97, 294);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(219, 355, 17, 5);
  ctx.fillRect(337, 355, 17, 5);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(128, 234); ctx.bezierCurveTo(143, 231, 154, 239, 157, 251);
  ctx.bezierCurveTo(147, 250, 137, 246, 128, 234);
  ctx.closePath(); ctx.fill();
}

function mascotLogo(draw) {
  return canvasOf(draw);
}

/**
 * Two-sided U.S. party-mascot coin: Democratic donkey on the front,
 * Republican elephant on the reverse. Both faces carry 2026 and the same rim motto.
 *
 * @param {object} GFX
 * @param {object} [options]
 * @param {number} [options.radius]
 * @param {string} [options.metal]
 * @returns {ReturnType<typeof createCoin>}
 */
export function createPoliticalCoin(GFX, { radius = 0.3, metal = 'gold' } = {}) {
  return createCoin(GFX, {
    radius,
    logo: mascotLogo(donkey),
    backLogo: mascotLogo(elephant),
    metal,
    year: '2026',
    motto: 'IN CHAINS WE RUST',
  });
}
