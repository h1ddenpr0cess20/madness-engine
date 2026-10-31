import { standingCharacter, hold } from './base.js';
export default standingCharacter({
 name:'lifeguard-standing-remake',scale:1.46,skin:'#bd805e',eyeColor:'#466d87',brow:'#65452e',mood:1,shoulders:1.06,
 hair:s=>s.part('hair',()=>{
  s.ellipsoid([0,0.748,-0.006],[0.09,0.043,0.09],{color:'#624a37',mat:'hair',bone:'head',k:0.01});
  s.limb([-0.06,0.75,0.025],[0.035,0.77,0.06],0.014,0.01,{color:'#624a37',mat:'hair',bone:'head',k:0.003});
 }),
 clothes:(s,J)=>s.part('clothes',()=>{
  // Athletic sun-shirt with raglan seams, vented side panels and rolled cuffs.
  s.ellipsoid([0,0.45,0],[0.098,0.105,0.067],{color:'#e7e0cf',mat:'cotton',bone:'spine',k:0.014});
  s.ellipsoid([0,0.511,0],[0.105,0.05,0.071],{color:'#e7e0cf',mat:'cotton',bone:'chest',k:0.012});
  for(const side of [-1,1]){
   s.limb([side*0.09,0.51,0],[side*0.13,0.405,0],0.038,0.029,{color:'#d05b43',mat:'cotton',bone:side>0?'armL':'armR',k:0.01});
   s.limb([side*0.13,0.405,0],[side*0.15,0.30,0.016],0.026,0.02,{color:'#d05b43',mat:'cotton',bone:side>0?'foreL':'foreR',k:0.008});
   s.limb([side*0.054,0.31,0],[side*0.06,0.175,0.006],0.048,0.034,{color:'#315765',mat:'cloth',bone:side>0?'thighL':'thighR',k:0.01});
   s.limb([side*0.06,0.175,0.006],[side*0.06,0.05,0],0.03,0.023,{color:'#315765',mat:'cloth',bone:side>0?'shinL':'shinR',k:0.008});
   s.ellipsoid([side*0.06,0.025,0.048],[0.032,0.018,0.06],{color:'#d9d1bd',mat:'rubber',bone:side>0?'footL':'footR',k:0.007});
   s.limb([side*0.09,0.51,0.045],[side*0.13,0.405,0.034],0.003,0.003,{color:'#f2c66d',mat:'cotton',bone:side>0?'armL':'armR',k:0.001});
   s.limb([side*0.14,0.37,0.023],[side*0.14,0.35,0.023],0.004,0.004,{color:'#f2c66d',mat:'cotton',bone:side>0?'foreL':'foreR',k:0.001});
  }
  // Collarless quarter zip, chest pocket, and high-visibility rescue insignia.
  s.flake([-0.028,0.55,0.045],[0,0.515,0.078],[0,0,1],0.014,0.009,0.16,{color:'#315765',mat:'cotton',bone:'chest',k:0.002});
  s.limb([0,0.523,0.08],[0,0.465,0.08],0.002,0.002,{color:'#a6a094',mat:'metal',bone:'chest',k:0.001});
  s.box([0.052,0.475,0.072],[0.035,0.034,0.006],0.003,{color:'#d05b43',mat:'cotton',bone:'chest',k:0.002});
  s.limb([0.052,0.463,0.077],[0.052,0.487,0.077],0.002,0.002,{color:'#f2e9d5',mat:'cotton',bone:'chest',k:0.001});
  s.limb([0.04,0.475,0.077],[0.064,0.475,0.077],0.002,0.002,{color:'#f2e9d5',mat:'cotton',bone:'chest',k:0.001});
  // Board shorts with a broad waistband, side gussets and curved hems.
  s.ellipsoid([0,0.337,0],[0.09,0.043,0.063],{color:'#315765',mat:'cloth',bone:'hips',k:0.012});
  for(const side of [-1,1]){
   s.limb([side*0.053,0.33,0],[side*0.06,0.245,0.005],0.052,0.041,{color:'#315765',mat:'cloth',bone:side>0?'thighL':'thighR',k:0.012});
   s.limb([side*0.025,0.37,0.064],[side*0.07,0.37,0.047],0.002,0.002,{color:'#e5bd67',mat:'cotton',bone:'hips',k:0.001});
  }
  // Rescue canister clipped diagonally across the back, with shoulder webbing.
  s.limb([0.075,0.535,-0.045],[-0.075,0.345,-0.06],0.006,0.006,{color:'#283b43',mat:'cotton',bone:'chest',k:0.002});
  s.limb([-0.085,0.43,-0.07],[-0.07,0.31,-0.07],0.02,0.02,{color:'#e66e43',mat:'plastic',bone:'spine',k:0.01});
  s.limb([-0.07,0.31,-0.07],[0.015,0.29,-0.07],0.02,0.02,{color:'#e66e43',mat:'plastic',bone:'hips',k:0.01});
  const h=J.handR;s.limb([h[0],h[1]+0.02,h[2]+0.015],[h[0],h[1]+0.052,h[2]+0.015],0.004,0.004,{color:'#c5b58c',mat:'metal',bone:'handR',k:0.001});
 }),
 accessories:s=>s.part('face-detail',()=>{
  // Sun-squint details, warm nose bridge and a tiny healed cheek mark.
  for(const side of [-1,1]){
   s.limb([side*0.018,0.658,0.09],[side*0.05,0.655,0.086],0.0015,0.0015,{color:'#86594a',mat:'skin',bone:'head',k:0});
   s.sphere([side*0.059,0.637,0.082],0.002,{color:'#a66e57',mat:'skin',bone:'head',k:0});
  }
 }),
 style:{attack:'smite',after(k,{clip,time,seed}){
  if(['ko','hit','attack'].includes(clip))return;
  const T=time+seed,breath=Math.sin(T*2.8);
  hold(k,'armR',-0.48,0.35,-0.3);hold(k,'foreR',-1.75,0,0);
  hold(k,'armL',-1.18,0,0.58);hold(k,'foreL',-0.12,0,0);
  k.turn('chest',-0.025*breath,0,0);
 }}
});
