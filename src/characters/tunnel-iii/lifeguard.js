import { standingCharacter } from './base.js';
import { torsoFabric, limbFabric, shoeFabric } from './base.js';

export default standingCharacter({
  name:'lifeguard-standing-remake',
  scale:1.46,skin:'#bd805e',eyeColor:'#466d87',brow:'#65452e',mood:1,shoulders:1.06,
  hair:s=>s.part('hair',()=>{
    // Sun-lightened, tightly waved crop; irregular clumps form a natural hairline.
    s.ellipsoid([0,0.75,-0.004],[0.091,0.043,0.09],{color:'#916c49',mat:'hair',bone:'head',k:0.006});
    for(let i=0;i<7;i++){
      const x=-0.065+i*0.021;
      s.sphere([x,0.772,0.034+Math.cos(i*1.7)*0.012],0.016,{color:i%2?'#a17b52':'#876443',mat:'hair',bone:'head',k:0.002});
    }
  }),
  clothes:(s,J)=>{
    // High-neck sun shirt, cut with a pale centre panel and coral side panels.
    torsoFabric(s,{y0:0.365,y1:0.545,clearance:0.016,color:'#f0e4d0',material:'woven',bone:'spine',across:28,down:16});
    torsoFabric(s,{y0:0.365,y1:0.545,angle0:-1.5,angle1:-0.55,clearance:0.019,color:'#c65e4c',material:'woven',bone:'spine',across:12,down:16});
    torsoFabric(s,{y0:0.365,y1:0.545,angle0:0.55,angle1:1.5,clearance:0.019,color:'#c65e4c',material:'woven',bone:'spine',across:12,down:16});
    for(const side of [-1,1]){
      const S=side>0?'L':'R';
      limbFabric(s,{a:J['shoulder'+S],b:J['elbow'+S],radiusA:0.041,radiusB:0.031,color:'#c65e4c',material:'woven',bone:'arm'+S,clearance:0.012});
      // Forearms are intentionally bare for heat management and grip.
      limbFabric(s,{a:J['hip'+S],b:[J['knee'+S][0],0.246,J['knee'+S][2]],radiusA:0.057,radiusB:0.05,color:'#315765',material:'woven',bone:'thigh'+S,clearance:0.013});
      shoeFabric(s,{ankle:J['ankle'+S],color:'#d9d1bd',material:'sole',bone:'foot'+S,clearance:0.009});
    }
    // A separate high-waist waistband and flat side panels finish the board shorts.
    torsoFabric(s,{y0:0.318,y1:0.36,clearance:0.018,color:'#315765',material:'woven',bone:'hips',across:24,down:5});
  },
});
