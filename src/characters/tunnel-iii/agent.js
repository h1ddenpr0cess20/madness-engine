import { standingCharacter, jacket, trousers, addHair, hold } from './base.js';

export default standingCharacter({
  name:'agent-standing-remake',scale:1.45,skin:'#bd8e73',eyeColor:'#425b79',brow:'#2c211b',mood:0,shoulders:1.02,
  hair:(s)=>addHair(s,{color:'#211b18',cap:[0.094,0.05,0.095],locks:[
    [[-0.075,0.755,0.01],[-0.02,0.79,0.075],0.018],
    [[0.075,0.755,0.01],[0.025,0.79,0.075],0.018],
  ]}),
  clothes:(s,J)=>{
    jacket(s,J,{torso:'#25364e',sleeve:'#25364e',material:'wool',girth:1.02,collar:'#e8e4dc'});
    trousers(s,J,{color:'#25364e',material:'wool',shoeColor:'#17191d'});
    s.part('clothes',()=>{
      // White shirt, separate red tie, lapels and buttons over the jacket.
      s.box([0,0.485,0.087],[0.029,0.067,0.008],0.004,{color:'#eeeae1',mat:'cotton',bone:'chest',k:0.002});
      s.limb([0,0.52,0.096],[0,0.405,0.102],0.009,0.014,{color:'#9e3039',mat:'cotton',bone:'chest',k:0.002});
      s.flake([-0.032,0.535,0.078],[-0.075,0.405,0.075],[0,0,1],0.02,0.012,0.28,{color:'#1b293d',mat:'wool',bone:'chest',k:0.003});
      s.flake([0.032,0.535,0.078],[0.075,0.405,0.075],[0,0,1],0.02,0.012,0.28,{color:'#1b293d',mat:'wool',bone:'chest',k:0.003});
      for(const y of [0.39,0.36])s.sphere([0.035,y,0.09],0.004,{color:'#c0a46e',mat:'metal',bone:'spine',k:0.001});
      // Handset and briefcase are distinct hard-surface accessories.
      const r=J.handR,l=J.handL;
      s.box([r[0],r[1]+0.028,r[2]+0.012],[0.012,0.035,0.006],0.003,{color:'#15171b',mat:'plastic',bone:'handR',k:0.001});
      s.box([l[0],l[1]-0.06,l[2]+0.018],[0.065,0.046,0.018],0.007,{color:'#57422f',mat:'leather',bone:'handL',k:0.003});
      s.torus([l[0],l[1]-0.027,l[2]+0.025],0.022,0.003,{color:'#b6a16f',mat:'metal',bone:'handL',k:0.001,rot:[Math.PI/2,0,0]});
    });
  },
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
