import { standingCharacter, jacket, trousers, addHair, hold } from './base.js';

export default standingCharacter({
  name:'lifeguard-standing-remake',scale:1.46,skin:'#bd805e',eyeColor:'#466d87',brow:'#65452e',mood:1,shoulders:1.06,
  hair:(s)=>addHair(s,{color:'#513a2a',cap:[0.091,0.043,0.094]}),
  clothes:(s,J)=>{
    jacket(s,J,{torso:'#f2cf32',sleeve:'#f2cf32',material:'cotton',girth:0.98,collar:'#fff0d0'});
    trousers(s,J,{color:'#c82b32',material:'cotton',short:true,shoeColor:'#b77d5a'});
    s.part('clothes',()=>{
      // Distinct quartered surf cap, brim, and chin straps.
      s.ellipsoid([0,0.754,-0.005],[0.103,0.052,0.105],{color:'#f1cf31',mat:'cotton',bone:'head',k:0.01});
      s.flake([-0.065,0.756,0.02],[0.065,0.756,0.02],[0,1,0],0.028,0.028,0.18,{color:'#c92c35',mat:'cotton',bone:'head',k:0.004});
      s.limb([-0.078,0.68,0.015],[-0.02,0.592,0.07],0.003,0.003,{color:'#e7c63a',mat:'cotton',bone:'head',k:0.001});
      s.limb([0.078,0.68,0.015],[0.02,0.592,0.07],0.003,0.003,{color:'#e7c63a',mat:'cotton',bone:'head',k:0.001});
      // Rescue tube sits diagonally across the back with a separate strap.
      s.limb([0.085,0.53,-0.01],[-0.07,0.34,-0.07],0.006,0.006,{color:'#24242a',mat:'cotton',bone:'chest',k:0.002});
      s.limb([-0.09,0.43,-0.075],[-0.075,0.29,-0.075],0.022,0.022,{color:'#f16b27',mat:'plastic',bone:'spine',k:0.012});
      s.limb([-0.075,0.29,-0.075],[0.01,0.27,-0.075],0.022,0.022,{color:'#f16b27',mat:'plastic',bone:'hips',k:0.012});
      const h=J.handR;
      s.limb([h[0],h[1]+0.015,h[2]+0.01],[h[0],h[1]+0.045,h[2]+0.01],0.006,0.006,{color:'#d4d4d0',mat:'metal',bone:'handR',k:0.001});
    });
  },
  style:{
    attack:'smite',
    after(k,{clip,time,seed}){
      if(['ko','hit','attack'].includes(clip))return;
      const T=time+seed,blow=Math.max(0,Math.sin(T*3));
      hold(k,'armR',-0.55,0.42,-0.38);hold(k,'foreR',-1.8,0,0);
      hold(k,'armL',-1.28,0,0.62+blow*0.12);hold(k,'foreL',-0.08,0,0);
      k.turn('chest',-0.04*blow,0,0);
    },
  },
});
