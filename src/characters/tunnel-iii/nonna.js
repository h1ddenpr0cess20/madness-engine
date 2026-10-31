import { standingCharacter } from './base.js';
import { torsoFabric, limbFabric, skirtFabric, shoeFabric } from './base.js';

export default standingCharacter({
  name:'nonna-standing-remake',
  scale:1.24,skin:'#b8795e',eyeColor:'#49372c',brow:'#858079',mood:1,girth:1.17,shoulders:0.92,
  hair:s=>s.part('hair',()=>{
    // Silver-grey soft bob, gently curled under at the jaw.
    s.ellipsoid([0,0.748,-0.004],[0.095,0.055,0.098],{color:'#aaa69e',mat:'hair',bone:'head',k:0.006});
    for(const side of [-1,1]){
      s.flake([side*0.075,0.755,0.01],[side*0.068,0.652,0.055],[0,0,1],0.019,0.012,0.34,{color:'#aaa69e',mat:'hair',bone:'head',k:0.002});
      s.sphere([side*0.064,0.66,0.052],0.015,{color:'#aaa69e',mat:'hair',bone:'head',k:0.002});
    }
    s.flake([-0.05,0.781,0.034],[0.015,0.792,0.063],[0,0,1],0.016,0.008,0.35,{color:'#aaa69e',mat:'hair',bone:'head',k:0.002});
  }),
  clothes:(s,J)=>{
    // Soft plum knit top; the neckline and body are continuous fitted cloth.
    torsoFabric(s,{y0:0.365,y1:0.545,clearance:0.015,color:'#6c475e',material:'wool',bone:'spine',across:28,down:16});
    for(const side of [-1,1]){
      const S=side>0?'L':'R';
      limbFabric(s,{a:J['shoulder'+S],b:J['elbow'+S],radiusA:0.038,radiusB:0.028,color:'#6c475e',material:'wool',bone:'arm'+S,clearance:0.012});
      limbFabric(s,{a:J['elbow'+S],b:J['wrist'+S],radiusA:0.028,radiusB:0.021,color:'#6c475e',material:'wool',bone:'fore'+S,clearance:0.01});
      shoeFabric(s,{ankle:J['ankle'+S],color:'#574a46',bone:'foot'+S,clearance:0.01});
    }
    // Warm ochre full skirt with a gentle flare, pleated from the natural waist.
    skirtFabric(s,{y0:0.075,y1:0.405,topX:0.093,topZ:0.071,hemX:0.158,hemZ:0.112,clearance:0.018,pleat:0.0035,color:'#9a8359',material:'wool',bone:'hips'});
    // Narrow woven waist facing and a small collar insert are separate sewn bands.
    torsoFabric(s,{y0:0.385,y1:0.405,clearance:0.02,color:'#d3c4a5',material:'cotton',bone:'hips',across:24,down:3});
  },
});
