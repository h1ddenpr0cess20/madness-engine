import { standingCharacter, jacket, trousers, addHair, hold } from './base.js';

export default standingCharacter({
  name:'punk-standing-remake',scale:1.44,skin:'#dfad91',eyeColor:'#527c80',brow:'#32252a',mood:1,shoulders:1.03,
  hair:(s)=>s.part('hair',()=>{
    s.ellipsoid([0,0.744,-0.006],[0.086,0.045,0.086],{color:'#252128',mat:'hair',bone:'head',k:0.01});
    // Green upright mohawk, individual tapered spikes rather than a painted scalp.
    for(let i=0;i<7;i++){
      const z=-0.065+i*0.022;
      s.cone([0,0.91,z],0.018,0.15,{color:'#4c9a43',mat:'hair',bone:'head',k:0.006});
    }
  }),
  clothes:(s,J)=>{
    jacket(s,J,{torso:'#24232a',sleeve:'#24232a',material:'leather',girth:0.92});
    trousers(s,J,{color:'#4a2730',material:'denim',shoeColor:'#a52a32',boots:true});
    s.part('clothes',()=>{
      // Separate tartan bands over the denim trousers.
      for(const y of [0.29,0.24,0.19,0.14]) s.limb([-0.11,y,0.025],[0.11,y,0.025],0.003,0.003,{color:'#c1a34a',mat:'cotton',bone:'hips',k:0.001});
      s.box([0,0.36,0.076],[0.09,0.009,0.006],0.003,{color:'#b7b7b2',mat:'metal',bone:'hips',k:0.001});
      for(const side of [-1,1]){
        for(let i=0;i<4;i++)s.sphere([side*(0.075+i*0.006),0.515-i*0.008,0.025],0.006,{color:'#c8c7c1',mat:'metal',bone:'chest',k:0.001});
        s.limb([side*0.035,0.49,0.085],[side*0.052,0.44,0.09],0.003,0.003,{color:'#c8c7c1',mat:'metal',bone:'chest',k:0.001});
      }
      s.torus([0,0.45,-0.076],0.052,0.004,{color:'#dedbd0',mat:'cotton',bone:'chest',k:0.001,rot:[Math.PI/2,0,0]});
      s.limb([-0.025,0.415,-0.08],[0,0.49,-0.08],0.004,0.004,{color:'#dedbd0',mat:'cotton',bone:'chest',k:0.001});
      s.limb([0.025,0.415,-0.08],[0,0.49,-0.08],0.004,0.004,{color:'#dedbd0',mat:'cotton',bone:'chest',k:0.001});
      for(let i=0;i<5;i++)s.torus([-0.08+i*0.007,0.33-Math.sin(i/4*Math.PI)*0.035,0.06-i*0.012],0.008,0.002,{color:'#c2c5cb',mat:'metal',bone:'hips',k:0.001});
    });
  },
  style:{
    attack:'chop',twist:-0.6,
    after(k,{clip,time,seed}){
      if(['ko','hit','attack'].includes(clip))return;
      const T=time+seed;
      if(clip==='idle'){
        const bounce=Math.max(0,Math.sin(T*7));
        k.move('root',0,bounce*0.018,0);
        hold(k,'armL',-0.25,0,0.22);hold(k,'foreL',-1.25,0,0);
        hold(k,'armR',-0.25,0,-0.22);hold(k,'foreR',-1.25,0,0);
        k.turn('head',Math.sin(T*7)*0.16,0,0);
      }
    },
  },
});
