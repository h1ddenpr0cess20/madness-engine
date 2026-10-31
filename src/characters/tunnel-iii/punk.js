import { standingCharacter, hold } from './base.js';
export default standingCharacter({
 name:'punk-standing-remake',scale:1.44,skin:'#dfad91',eyeColor:'#527c80',brow:'#32252a',mood:1,shoulders:1.03,
 hair:s=>s.part('hair',()=>{
  // Dark cropped sides and individually sculpted teal crest spikes.
  s.ellipsoid([0,0.744,-0.006],[0.086,0.04,0.086],{color:'#252128',mat:'hair',bone:'head',k:0.01});
  for(let i=0;i<9;i++){
   const z=-0.075+i*0.018,h=0.11+(i%3)*0.025;
   s.cone([0,0.82+h*0.5,z],0.013+(i%2)*0.003,h,{color:i%2?'#4b8f83':'#68a99a',mat:'hair',bone:'head',k:0.004,rot:[(i-4)*0.03,0,(i%3-1)*0.06]});
  }
 }),
 clothes:(s,J)=>s.part('clothes',()=>{
  // Cropped sleeveless denim vest over a faded long-sleeve mesh shirt.
  s.ellipsoid([0,0.448,0],[0.097,0.101,0.067],{color:'#4b4a4d',mat:'cotton',bone:'spine',k:0.012});
  s.ellipsoid([0,0.507,0],[0.105,0.049,0.071],{color:'#4b4a4d',mat:'cotton',bone:'chest',k:0.012});
  s.ellipsoid([0,0.45,0.014],[0.105,0.105,0.068],{color:'#354a58',mat:'denim',bone:'spine',k:0.01});
  s.ellipsoid([0,0.511,0.012],[0.11,0.05,0.073],{color:'#354a58',mat:'denim',bone:'chest',k:0.01});
  for(const side of [-1,1]){
   s.limb([side*0.09,0.505,0],[side*0.13,0.4,0],0.034,0.027,{color:'#4b4a4d',mat:'cotton',bone:side>0?'armL':'armR',k:0.009});
   s.limb([side*0.13,0.4,0],[side*0.15,0.29,0.016],0.023,0.018,{color:'#4b4a4d',mat:'cotton',bone:side>0?'foreL':'foreR',k:0.008});
   s.limb([side*0.052,0.31,0],[side*0.06,0.17,0.005],0.048,0.034,{color:'#34343a',mat:'denim',bone:side>0?'thighL':'thighR',k:0.01});
   s.limb([side*0.06,0.17,0.005],[side*0.06,0.05,0],0.031,0.024,{color:'#34343a',mat:'denim',bone:side>0?'shinL':'shinR',k:0.008});
   // High-top canvas boots with contrasting rubber toe and ankle panels.
   s.ellipsoid([side*0.06,0.065,0.025],[0.034,0.043,0.035],{color:'#a34e45',mat:'cotton',bone:side>0?'shinL':'shinR',k:0.008});
   s.ellipsoid([side*0.06,0.021,0.05],[0.038,0.018,0.069],{color:'#d0c7b4',mat:'rubber',bone:side>0?'footL':'footR',k:0.006});
   for(let n=0;n<4;n++)s.sphere([side*0.06+0.012,0.055+n*0.015,0.058],0.002,{color:'#d0c7b4',mat:'metal',bone:side>0?'shinL':'shinR',k:0.001});
  }
  // Uneven hand-cut vest lapels, patch pockets and contrast seam lines.
  s.flake([-0.035,0.54,0.062],[-0.08,0.43,0.071],[0,0,1],0.024,0.012,0.22,{color:'#263b48',mat:'denim',bone:'chest',k:0.003});
  s.flake([0.035,0.54,0.062],[0.08,0.43,0.071],[0,0,1],0.024,0.012,0.22,{color:'#263b48',mat:'denim',bone:'chest',k:0.003});
  s.box([-0.058,0.454,0.083],[0.04,0.05,0.007],0.004,{color:'#526875',mat:'denim',bone:'spine',k:0.002});
  s.box([0.058,0.454,0.083],[0.04,0.05,0.007],0.004,{color:'#526875',mat:'denim',bone:'spine',k:0.002});
  for(const side of [-1,1])for(let n=0;n<4;n++)s.sphere([side*0.06,0.435+n*0.012,0.089],0.0025,{color:'#b6a98c',mat:'metal',bone:'spine',k:0.001});
  // One-sided plaid overskirt panel over narrow black work trousers.
  s.flake([-0.01,0.34,0.065],[0.105,0.19,0.055],[0,0,1],0.04,0.012,0.28,{color:'#8a4b50',mat:'cotton',bone:'hips',k:0.003});
  for(let n=0;n<4;n++)s.limb([-0.005,0.32-n*0.03,0.078],[0.09,0.25-n*0.025,0.065],0.0015,0.0015,{color:'#d0b77c',mat:'cotton',bone:'hips',k:0.001});
  // Belt, chain and small safety-pin details.
  s.limb([-0.075,0.354,0.067],[0.075,0.354,0.067],0.004,0.004,{color:'#1e2024',mat:'leather',bone:'hips',k:0.001});
  s.box([0.018,0.354,0.073],[0.018,0.014,0.006],0.003,{color:'#b6b4a9',mat:'metal',bone:'hips',k:0.001});
  s.limb([-0.07,0.34,0.07],[-0.105,0.28,0.07],0.002,0.002,{color:'#b6b4a9',mat:'metal',bone:'hips',k:0.001});
  for(let n=0;n<3;n++)s.sphere([-0.085+n*0.012,0.515-n*0.012,0.078],0.003,{color:'#c4c1b7',mat:'metal',bone:'chest',k:0.001});
 }),
 accessories:s=>s.part('face-detail',()=>{
  // Graphic eyeliner, a brow bar and a small lower-lip ring.
  for(const side of [-1,1])s.limb([side*0.018,0.688,0.09],[side*0.052,0.687,0.084],0.002,0.002,{color:'#30272a',mat:'skin',bone:'head',k:0.001});
  s.sphere([0.09,0.66,0.006],0.0035,{color:'#b7b4a9',mat:'metal',bone:'head',k:0.001});
  s.torus([0,0.607,0.094],0.006,0.0015,{color:'#b7b4a9',mat:'metal',bone:'head',k:0.001,rot:[Math.PI/2,0,0]});
 }),
 style:{attack:'chop',twist:-0.6,after(k,{clip,time,seed}){
  if(['ko','hit','attack'].includes(clip))return;
  const T=time+seed;
  if(clip==='idle'){
   const bounce=Math.max(0,Math.sin(T*7));
   k.move('root',0,bounce*0.018,0);
   hold(k,'armL',-0.25,0,0.22);hold(k,'foreL',-1.25,0,0);
   hold(k,'armR',-0.25,0,-0.22);hold(k,'foreR',-1.25,0,0);
   k.turn('head',Math.sin(T*7)*0.16,0,0);
  }
 }}
});
