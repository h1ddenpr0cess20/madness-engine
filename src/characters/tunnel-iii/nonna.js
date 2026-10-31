import { standingCharacter, jacket, skirtShape, addHair, glasses, hold } from './base.js';

export default standingCharacter({
  name:'nonna-standing-remake', scale:1.24, skin:'#b8795e', eyeColor:'#49372c', brow:'#77716b', mood:1, girth:1.17, shoulders:0.92,
  hair:(s)=>s.part('hair',()=>{
    s.ellipsoid([0,0.748,-0.006],[0.105,0.062,0.108],{color:'#aaa49a',mat:'hair',bone:'head',k:0.012});
    s.sphere([0,0.71,-0.105],0.038,{color:'#aaa49a',mat:'hair',bone:'head',k:0.012});
  }),
  clothes:(s,J)=>{
    skirtShape(s,{top:0.39,bottom:0.075,upper:0.09,hem:0.145,color:'#29242a',mat:'wool'});
    jacket(s,J,{torso:'#51424a',sleeve:'#51424a',material:'wool',girth:1.12});
    s.part('clothes',()=>{
      // Separate scarf cloth draped over crown and tied at the nape.
      s.ellipsoid([0,0.758,-0.005],[0.118,0.078,0.116],{color:'#282329',mat:'wool',bone:'head',k:0.012});
      s.flake([0,0.718,-0.07],[0.045,0.635,-0.115],[0,0,-1],0.025,0.018,0.38,{color:'#282329',mat:'wool',bone:'head',k:0.006});
      s.flake([0,0.718,-0.07],[-0.045,0.635,-0.115],[0,0,-1],0.025,0.018,0.38,{color:'#282329',mat:'wool',bone:'head',k:0.006});
      s.limb([-0.025,0.49,0.08],[0.025,0.49,0.08],0.004,0.004,{color:'#d6c6ad',mat:'metal',bone:'chest',k:0.001});
      // Spoon handle and bowl are parented to the right hand.
      const h=J.handR;
      s.limb([h[0],h[1]-0.025,h[2]+0.02],[h[0]+0.01,h[1]+0.145,h[2]+0.02],0.006,0.006,{color:'#9b6840',mat:'wood',bone:'handR',k:0.002});
      s.ellipsoid([h[0]+0.01,h[1]+0.16,h[2]+0.02],[0.019,0.027,0.009],{color:'#9b6840',mat:'wood',bone:'handR',k:0.004});
    });
    s.part('accessories',()=>{
      const h=J.handL;
      s.torus([h[0],h[1]-0.06,h[2]+0.01],0.025,0.003,{color:'#c3a56e',mat:'metal',bone:'handL',k:0.001});
    });
  },
  accessories:(s)=>glasses(s,{rim:'#75624e',size:0.021}),
  style:{
    attack:'smite',heavy:0.28,twist:0,
    after(k,{clip,time,seed}){
      if(['ko','hit','attack'].includes(clip))return;
      const T=time+seed;
      hold(k,'armR',-1.2,0,-0.2); hold(k,'foreR',-0.72+Math.sin(T*9)*0.2,0,0);
      hold(k,'armL',0.08,0,0.48); hold(k,'foreL',-1.22,0.75,0);
      k.turn('head',0.04,Math.sin(T*9)*0.055,0);
    },
  },
});
