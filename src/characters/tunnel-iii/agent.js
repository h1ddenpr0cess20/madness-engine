import { standingCharacter, hold } from './base.js';

const ink='#26333a', teal='#526e70', stone='#c8b9a1', rust='#98614c', leather='#514237';

export default standingCharacter({
  name:'agent-standing-remake',
  scale:1.45,
  skin:'#bd8e73',
  eyeColor:'#536b70',
  brow:'#45352d',
  mood:0,
  shoulders:1.02,
  hair:(s)=>s.part('hair',()=>{
    // Short, softly swept dark hair with a natural hairline.
    s.ellipsoid([0,0.748,-0.004],[0.09,0.045,0.091],{color:'#302822',mat:'hair',bone:'head',k:0.01});
    s.limb([-0.078,0.748,0.012],[-0.025,0.777,0.062],0.014,0.01,{color:'#302822',mat:'hair',bone:'head',k:0.004});
    s.limb([-0.025,0.777,0.062],[0.054,0.765,0.045],0.012,0.009,{color:'#302822',mat:'hair',bone:'head',k:0.003});
    s.limb([0.054,0.765,0.045],[0.078,0.738,0.012],0.009,0.007,{color:'#302822',mat:'hair',bone:'head',k:0.002});
  }),
  clothes:(s,J)=>s.part('clothes',()=>{
    // A textured teal mock-neck knit under a short, unstructured stone overshirt.
    s.ellipsoid([0,0.45,0.002],[0.094,0.102,0.068],{color:teal,mat:'cotton',bone:'spine',k:0.014});
    s.ellipsoid([0,0.511,0],[0.101,0.046,0.07],{color:teal,mat:'cotton',bone:'chest',k:0.012});
    s.limb([-0.025,0.55,0.025],[0.025,0.55,0.025],0.009,0.009,{color:ink,mat:'cotton',bone:'neck',k:0.002});
    // Open-front overshirt: two shaped front panels, back yoke, and sleeves.
    s.ellipsoid([0,0.451,-0.012],[0.105,0.105,0.069],{color:stone,mat:'cotton',bone:'spine',k:0.01});
    s.flake([-0.096,0.535,0.035],[-0.054,0.365,0.064],[0,0,1],0.031,0.013,0.22,{color:stone,mat:'cotton',bone:'chest',k:0.003});
    s.flake([0.096,0.535,0.035],[0.054,0.365,0.064],[0,0,1],0.031,0.013,0.22,{color:stone,mat:'cotton',bone:'chest',k:0.003});
    s.limb([-0.087,0.52,0],[-0.128,0.405,0.002],0.035,0.028,{color:stone,mat:'cotton',bone:'armR',k:0.009});
    s.limb([-0.128,0.405,0.002],[-0.145,0.3,0.016],0.026,0.02,{color:stone,mat:'cotton',bone:'foreR',k:0.008});
    s.limb([0.087,0.52,0],[0.128,0.405,0.002],0.035,0.028,{color:stone,mat:'cotton',bone:'armL',k:0.009});
    s.limb([0.128,0.405,0.002],[0.145,0.3,0.016],0.026,0.02,{color:stone,mat:'cotton',bone:'foreL',k:0.008});
    // Subtle topstitching, real pocket flaps, and matte snaps.
    for(const side of [-1,1]){
      s.box([side*0.062,0.443,0.073],[0.043,0.038,0.006],0.004,{color:'#b9aa92',mat:'cotton',bone:'spine',k:0.002});
      s.limb([side*0.042,0.469,0.078],[side*0.082,0.469,0.078],0.0015,0.0015,{color:'#897f70',mat:'cotton',bone:'spine',k:0});
    }
    s.limb([0,0.52,0.074],[0,0.37,0.074],0.002,0.002,{color:'#8b806f',mat:'cotton',bone:'chest',k:0.001});
    for(const y of [0.485,0.455,0.425,0.395])s.sphere([0.008,y,0.078],0.0025,{color:'#6e6559',mat:'metal',bone:'spine',k:0.001});
    // Rust tapered chinos, shaped at knee and ankle rather than cylindrical leggings.
    s.ellipsoid([0,0.337,0],[0.086,0.046,0.06],{color:rust,mat:'cotton',bone:'hips',k:0.012});
    for(const side of [-1,1]){
      s.limb([side*0.052,0.315,0],[side*0.06,0.174,0.005],0.046,0.033,{color:rust,mat:'cotton',bone:side>0?'thighL':'thighR',k:0.01});
      s.limb([side*0.06,0.174,0.005],[side*0.06,0.055,0],0.029,0.022,{color:rust,mat:'cotton',bone:side>0?'shinL':'shinR',k:0.008});
      s.limb([side*0.06,0.065,0.018],[side*0.06,0.052,0.018],0.031,0.024,{color:'#b18a70',mat:'cotton',bone:side>0?'shinL':'shinR',k:0.003});
      // Low-profile leather derby shoes with distinct sole and toe cap.
      s.ellipsoid([side*0.06,0.027,0.047],[0.033,0.021,0.06],{color:leather,mat:'leather',bone:side>0?'footL':'footR',k:0.008});
      s.ellipsoid([side*0.06,0.009,0.05],[0.034,0.007,0.063],{color:'#292b2b',mat:'rubber',bone:side>0?'footL':'footR',k:0.003});
    }
    // Slim cross-body document satchel and its woven strap.
    s.limb([0.075,0.535,-0.045],[-0.075,0.37,-0.06],0.006,0.006,{color:leather,mat:'leather',bone:'chest',k:0.002});
    s.box([-0.09,0.345,-0.065],[0.07,0.085,0.027],0.009,{color:leather,mat:'leather',bone:'hips',k:0.003});
    s.limb([-0.09,0.39,-0.047],[-0.09,0.365,-0.047],0.002,0.002,{color:'#b79a71',mat:'metal',bone:'hips',k:0.001});
    // Small phone in the right hand, separate from the clothing silhouette.
    const h=J.handR;
    s.box([h[0],h[1]+0.025,h[2]+0.014],[0.011,0.03,0.004],0.002,{color:'#25292b',mat:'plastic',bone:'handR',k:0.001});
  }),
  accessories:(s)=>s.part('face-detail',()=>{
    // A subtle lower-lid crease and natural cheek freckling.
    for(const side of [-1,1]){
      s.limb([side*0.019,0.658,0.09],[side*0.049,0.657,0.086],0.0012,0.0012,{color:'#8e6655',mat:'skin',bone:'head',k:0});
      s.sphere([side*0.058,0.638,0.083],0.0018,{color:'#936b58',mat:'skin',bone:'head',k:0});
    }
  }),
  style:{
    attack:'smite',
    after(k,{clip,time,seed}){
      if(['ko','hit','attack'].includes(clip))return;
      const T=time+seed;
      hold(k,'armR',-1.65,0,-0.42);hold(k,'foreR',-1.85,0,0);
      hold(k,'armL',0.04,0,0.2);hold(k,'foreL',-0.2,0,0);
      k.turn('head',0,-0.18+Math.sin(T*3)*0.045,0.1);
    },
  },
});
