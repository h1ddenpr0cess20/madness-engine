import { standingCharacter } from './base.js';
import { torsoFabric, limbFabric, shoeFabric } from './base.js';

export default standingCharacter({
  name:'lifeguard-standing-remake',
  scale:1.46,skin:'#bd805e',eyeColor:'#466d87',brow:'#65452e',mood:1,shoulders:1.06,
  faceDetails:s=>s.part('face',()=>{
    // Fine sun freckles and a slightly stronger lower-eyelid plane.
    for(const side of [-1,1]){
      s.ellipsoid([side*0.047,0.659,0.079],[0.012,0.005,0.004],{color:'#c58a68',mat:'skin',bone:'head',k:0.001});
      for(let i=0;i<5;i++){
        const x=side*(0.021+i*0.009),y=0.637+(i%2)*0.006;
        s.sphere([x,y,0.088-Math.abs(x)*0.09],0.0015+(i%2)*0.0004,{color:'#925c43',mat:'detail',bone:'head',k:0});
      }
      s.limb([side*0.017,0.657,0.088],[side*0.05,0.653,0.081],0.0016,0.0011,{color:'#895c4a',mat:'detail',bone:'head',k:0.0002});
    }
    s.sphere([0.008,0.647,0.111],0.0017,{color:'#985f49',mat:'detail',bone:'head',k:0});
    s.sphere([-0.008,0.647,0.111],0.0017,{color:'#985f49',mat:'detail',bone:'head',k:0});
  }),
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
