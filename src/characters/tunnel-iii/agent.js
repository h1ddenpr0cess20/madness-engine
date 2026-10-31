import { standingCharacter } from './base.js';
import { torsoFabric, limbFabric, shoeFabric } from './base.js';

export default standingCharacter({
  name:'agent-standing-remake',
  scale:1.45,skin:'#bd8e73',eyeColor:'#536b70',brow:'#45352d',mood:0,shoulders:1.02,
  hair:s=>s.part('hair',()=>{
    // Loose, side-swept chestnut crop with a broken fringe.
    s.ellipsoid([0,0.75,-0.004],[0.091,0.047,0.09],{color:'#302822',mat:'hair',bone:'head',k:0.006});
    s.flake([-0.078,0.77,0.018],[-0.01,0.795,0.078],[0,0,1],0.018,0.009,0.32,{color:'#302822',mat:'hair',bone:'head',k:0.002});
    s.flake([-0.025,0.788,0.065],[0.058,0.762,0.055],[0,0,1],0.014,0.008,0.3,{color:'#302822',mat:'hair',bone:'head',k:0.002});
    s.flake([0.045,0.765,0.043],[0.079,0.735,0.012],[0,0,1],0.011,0.006,0.28,{color:'#302822',mat:'hair',bone:'head',k:0.001});
  }),
  clothes:(s,J)=>{
    // Base layer: close-fitting ink-blue knit.
    torsoFabric(s,{y0:0.365,y1:0.545,clearance:0.012,color:'#344f5c',material:'cotton',bone:'spine',across:28,down:16});
    // Outer utility overshirt is cut into separate back and front pattern pieces.
    torsoFabric(s,{y0:0.365,y1:0.445,angle0:1.48,angle1:4.80,clearance:0.019,color:'#b9aa91',material:'cotton',bone:'spine',across:20,down:12});
    torsoFabric(s,{y0:0.445,y1:0.545,angle0:1.48,angle1:4.80,clearance:0.019,color:'#c8bba5',material:'cotton',bone:'chest',across:20,down:12});
    torsoFabric(s,{y0:0.365,y1:0.445,angle0:-1.48,angle1:-0.10,clearance:0.019,color:'#c8bba5',material:'cotton',bone:'spine',across:12,down:12});
    torsoFabric(s,{y0:0.445,y1:0.545,angle0:-1.48,angle1:-0.10,clearance:0.019,color:'#c8bba5',material:'cotton',bone:'chest',across:12,down:12});
    torsoFabric(s,{y0:0.365,y1:0.445,angle0:0.10,angle1:1.48,clearance:0.019,color:'#c8bba5',material:'cotton',bone:'spine',across:12,down:12});
    torsoFabric(s,{y0:0.445,y1:0.545,angle0:0.10,angle1:1.48,clearance:0.019,color:'#c8bba5',material:'cotton',bone:'chest',across:12,down:12});
    for(const side of [-1,1]){
      limbFabric(s,{a:J['shoulder'+(side>0?'L':'R')],b:J['elbow'+(side>0?'L':'R')],radiusA:0.037,radiusB:0.027,color:'#c8bba5',material:'cotton',bone:'arm'+(side>0?'L':'R'),clearance:0.012});
      limbFabric(s,{a:J['elbow'+(side>0?'L':'R')],b:J['wrist'+(side>0?'L':'R')],radiusA:0.028,radiusB:0.021,color:'#c8bba5',material:'cotton',bone:'fore'+(side>0?'L':'R'),clearance:0.01});
      const S=side>0?'L':'R';
      limbFabric(s,{a:J['hip'+S],b:J['knee'+S],radiusA:0.051,radiusB:0.037,color:'#74685b',material:'cotton',bone:'thigh'+S,clearance:0.011});
      limbFabric(s,{a:J['knee'+S],b:J['ankle'+S],radiusA:0.034,radiusB:0.024,color:'#74685b',material:'cotton',bone:'shin'+S,clearance:0.01});
      shoeFabric(s,{ankle:J['ankle'+S],color:'#403b36',bone:'foot'+S,clearance:0.01});
    }
    // Chest patch pockets are independent surface-drafted cloth panels.
    torsoFabric(s,{y0:0.421,y1:0.461,angle0:-0.83,angle1:-0.48,clearance:0.027,color:'#b6a68d',material:'cotton',bone:'spine',across:7,down:4});
    torsoFabric(s,{y0:0.421,y1:0.461,angle0:0.48,angle1:0.83,clearance:0.027,color:'#b6a68d',material:'cotton',bone:'spine',across:7,down:4});
  },
});
