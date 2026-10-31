import { standingCharacter } from './base.js';
import { torsoFabric, limbFabric, shoeFabric } from './base.js';

export default standingCharacter({
  name:'punk-standing-remake',
  scale:1.44,skin:'#dfad91',eyeColor:'#527c80',brow:'#32252a',mood:1,shoulders:1.03,
  faceDetails:s=>s.part('face',()=>{
    // Deliberately graphic brow and eye framing, balanced by natural cheek planes.
    for(const side of [-1,1]){
      s.flake([side*0.014,0.706,0.076],[side*0.061,0.701,0.063],[0,0,1],0.0065,0.004,0.32,{color:'#342a31',mat:'hair',bone:'head',k:0.001});
      s.limb([side*0.022,0.659,0.089],[side*0.054,0.655,0.08],0.002,0.0012,{color:'#30252d',mat:'detail',bone:'head',k:0.0002});
      s.limb([side*0.047,0.634,0.086],[side*0.066,0.627,0.078],0.0014,0.0007,{color:'#895e55',mat:'detail',bone:'head',k:0.0002});
    }
    s.ellipsoid([0,0.607,0.092],[0.014,0.0045,0.004],{color:'#9c665c',mat:'skin',bone:'head',k:0.0008});
    s.sphere([-0.062,0.646,0.078],0.002,{color:'#a06a60',mat:'skin',bone:'head',k:0.0002});
  }),
  hair:s=>s.part('hair',()=>{
    // Asymmetric, choppy indigo shag with one longer side fringe.
    s.ellipsoid([0,0.746,-0.004],[0.086,0.043,0.088],{color:'#343047',mat:'hair',bone:'head',k:0.006});
    for(let i=0;i<8;i++){
      const x=-0.068+i*0.019;
      const endY=0.765+(i%3)*0.012;
      s.flake([x,0.77,0.035],[x+0.015,endY,0.078],[0,0,1],0.014,0.008,0.32,{color:i%2?'#625b8c':'#454064',mat:'hair',bone:'head',k:0.002});
    }
    s.flake([-0.08,0.75,0.025],[-0.06,0.675,0.064],[0,0,1],0.019,0.012,0.34,{color:'#454064',mat:'hair',bone:'head',k:0.002});
  }),
  clothes:(s,J)=>{
    // Cropped asymmetrical sweatshirt: one angled colour-blocked front panel.
    torsoFabric(s,{y0:0.365,y1:0.545,clearance:0.016,color:'#37364a',material:'woven',bone:'spine',across:28,down:16});
    torsoFabric(s,{y0:0.365,y1:0.445,angle0:-0.92,angle1:0.72,clearance:0.02,color:'#715b80',material:'woven',bone:'spine',across:16,down:12});
    torsoFabric(s,{y0:0.445,y1:0.545,angle0:-0.92,angle1:0.72,clearance:0.02,color:'#715b80',material:'woven',bone:'chest',across:16,down:12});
    for(const side of [-1,1]){
      const S=side>0?'L':'R';
      limbFabric(s,{a:J['shoulder'+S],b:J['elbow'+S],radiusA:0.039,radiusB:0.029,color:'#37364a',material:'woven',bone:'arm'+S,clearance:0.012});
      limbFabric(s,{a:J['elbow'+S],b:J['wrist'+S],radiusA:0.029,radiusB:0.021,color:'#37364a',material:'woven',bone:'fore'+S,clearance:0.01});
      limbFabric(s,{a:J['hip'+S],b:J['knee'+S],radiusA:0.052,radiusB:0.038,color:'#25262d',material:'canvas',bone:'thigh'+S,clearance:0.013});
      limbFabric(s,{a:J['knee'+S],b:J['ankle'+S],radiusA:0.036,radiusB:0.025,color:'#25262d',material:'canvas',bone:'shin'+S,clearance:0.011});
      shoeFabric(s,{ankle:J['ankle'+S],color:'#9d645c',bone:'foot'+S,clearance:0.012});
    }
    // Two irregular seam bands are cut into the sweatshirt body, not added as props.
    torsoFabric(s,{y0:0.425,y1:0.434,angle0:-0.92,angle1:0.72,clearance:0.023,color:'#c2a36d',material:'woven',bone:'spine',across:12,down:2});
  },
});
