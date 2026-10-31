import { standingCharacter, hold } from './base.js';
export default standingCharacter({
 name:'nonna-standing-remake',scale:1.24,skin:'#b8795e',eyeColor:'#49372c',brow:'#858079',mood:1,girth:1.17,shoulders:0.92,
 hair:s=>s.part('hair',()=>{
  // Silver hair with a soft part and a compact low bun.
  s.ellipsoid([0,0.748,-0.004],[0.093,0.052,0.096],{color:'#aaa69e',mat:'hair',bone:'head',k:0.012});
  s.sphere([0,0.694,-0.104],0.034,{color:'#aaa69e',mat:'hair',bone:'head',k:0.01});
  for(const side of [-1,1])s.limb([side*0.074,0.75,0],[side*0.067,0.675,0.035],0.012,0.009,{color:'#aaa69e',mat:'hair',bone:'head',k:0.004});
 }),
 clothes:(s,J)=>s.part('clothes',()=>{
  // Printed house dress: shaped bodice, gathered waist, generous A-line skirt.
  s.ellipsoid([0,0.454,0],[0.101,0.105,0.07],{color:'#63766d',mat:'cotton',bone:'spine',k:0.014});
  s.ellipsoid([0,0.51,0],[0.098,0.048,0.067],{color:'#63766d',mat:'cotton',bone:'chest',k:0.012});
  s.ellipsoid([0,0.337,0],[0.092,0.046,0.064],{color:'#a7a18d',mat:'cotton',bone:'hips',k:0.012});
  // Full skirt is built as an independent flared shell with a softly weighted hem.
  s.shape(p=>{
   const y=Math.max(0.075,Math.min(0.405,p[1]));
   const t=(y-0.075)/0.33,rx=0.145-(0.145-0.088)*t,rz=0.096-(0.096-0.063)*t;
   return Math.hypot(Math.max(Math.hypot(p[0]/rx,p[2]/rz)-1,0)*Math.min(rx,rz),Math.max(0.075-p[1],p[1]-0.405,0))+Math.min(Math.max((Math.hypot(p[0]/rx,p[2]/rz)-1)*Math.min(rx,rz),0.075-p[1],p[1]-0.405),0);
  },[[-0.15,0.075,-0.1],[0.15,0.405,0.1]],{color:'#a7a18d',mat:'cotton',bone:'hips',k:0.015});
  for(const side of [-1,1]){
   s.limb([side*0.09,0.505,0],[side*0.125,0.4,0],0.035,0.028,{color:'#63766d',mat:'cotton',bone:side>0?'armL':'armR',k:0.009});
   s.limb([side*0.125,0.4,0],[side*0.145,0.295,0.016],0.024,0.019,{color:'#63766d',mat:'cotton',bone:side>0?'foreL':'foreR',k:0.008});
   s.limb([side*0.054,0.31,0],[side*0.06,0.17,0.005],0.047,0.034,{color:'#a7a18d',mat:'cotton',bone:side>0?'thighL':'thighR',k:0.01});
   s.limb([side*0.06,0.17,0.005],[side*0.06,0.05,0],0.03,0.023,{color:'#a7a18d',mat:'cotton',bone:side>0?'shinL':'shinR',k:0.008});
   s.ellipsoid([side*0.06,0.026,0.047],[0.032,0.019,0.059],{color:'#51443c',mat:'leather',bone:side>0?'footL':'footR',k:0.008});
  }
  // Muted floral embroidery on the bodice and a practical apron with deep pockets.
  for(const x of [-0.055,-0.025,0.025,0.055]){
   s.sphere([x,0.475,0.069],0.006,{color:'#d6c7a5',mat:'cotton',bone:'spine',k:0.002});
   s.sphere([x+0.009,0.486,0.068],0.004,{color:'#b7a17c',mat:'cotton',bone:'spine',k:0.001});
  }
  s.flake([-0.073,0.415,0.073],[0.073,0.415,0.073],[0,1,0],0.04,0.01,0.12,{color:'#d8d0b8',mat:'cotton',bone:'hips',k:0.003});
  s.box([-0.035,0.382,0.091],[0.042,0.043,0.006],0.004,{color:'#b8b29f',mat:'cotton',bone:'hips',k:0.002});
  s.box([0.035,0.382,0.091],[0.042,0.043,0.006],0.004,{color:'#b8b29f',mat:'cotton',bone:'hips',k:0.002});
  // Small shawl collar, buttons and a wooden spoon carried in one hand.
  s.flake([-0.045,0.55,0.055],[-0.018,0.5,0.076],[0,0,1],0.014,0.01,0.18,{color:'#e0d7c3',mat:'cotton',bone:'chest',k:0.002});
  s.flake([0.045,0.55,0.055],[0.018,0.5,0.076],[0,0,1],0.014,0.01,0.18,{color:'#e0d7c3',mat:'cotton',bone:'chest',k:0.002});
  for(const y of [0.48,0.45,0.42])s.sphere([0.008,y,0.079],0.003,{color:'#79684f',mat:'wood',bone:'spine',k:0.001});
  const h=J.handR;
  s.limb([h[0],h[1]-0.025,h[2]+0.02],[h[0]+0.008,h[1]+0.13,h[2]+0.02],0.005,0.005,{color:'#8b633e',mat:'wood',bone:'handR',k:0.002});
  s.ellipsoid([h[0]+0.008,h[1]+0.15,h[2]+0.02],[0.017,0.023,0.008],{color:'#8b633e',mat:'wood',bone:'handR',k:0.003});
 }),
 accessories:s=>s.part('face-detail',()=>{
  // Character-specific age lines and soft smile folds; face stays naturally proportioned.
  for(const side of [-1,1]){
   s.limb([side*0.048,0.662,0.086],[side*0.068,0.655,0.078],0.0015,0.0015,{color:'#815a4b',mat:'skin',bone:'head',k:0});
   s.sphere([side*0.058,0.63,0.086],0.0025,{color:'#93634f',mat:'skin',bone:'head',k:0});
  }
  s.limb([-0.017,0.612,0.094],[0.017,0.612,0.094],0.0015,0.0015,{color:'#86594b',mat:'skin',bone:'head',k:0});
 }),
 style:{attack:'smite',heavy:0.28,after(k,{clip,time,seed}){
  if(['ko','hit','attack'].includes(clip))return;
  const T=time+seed;
  hold(k,'armR',-1.15,0,-0.18);hold(k,'foreR',-0.7+Math.sin(T*8)*0.18,0,0);
  hold(k,'armL',0.08,0,0.48);hold(k,'foreL',-1.22,0.75,0);
  k.turn('head',0.04,Math.sin(T*1.2)*0.05,0);
 }}
});
