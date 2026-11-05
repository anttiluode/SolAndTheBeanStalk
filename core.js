/* Sol and the Beanstalk: deterministic, renderer-independent world rules.
   This module runs in browsers and Node without dependencies. */
(function(root,factory){
  const game=factory();
  if(typeof module==="object" && module.exports)module.exports=game;
  else root.BeanWorld=game;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const STORY=[
 {name:"The Last Bean",sub:"Below the clouds",voice:"My grandmother left me one bean and a question: who holds up the sky?",note:"Sow the green seed. A route is not found here. It is grown.",reward:""},
 {name:"The Chain Orchard",sub:"The first borrowed path",voice:"The vines held, so we climbed. Then we climbed the vines. Nobody looked up at the hook.",note:"The pods caught in these branches belong to anyone brave enough to reach them.",reward:"Two green seeds. A bloom."},
 {name:"The Hanging Garden",sub:"The forgotten pin",voice:"Every leaf thanked the chain. The chain thanked one small pin. The pin had nobody to thank.",note:"A new bridge would tear the load loose. Root this island before you grow farther.",reward:"A root seed, and another climber."},
 {name:"The Hollow Heart",sub:"A chamber inside the stalk",voice:"I thought the great stalk was a ladder. Inside, I heard it breathing.",note:"The blue pulse pod can awaken what the roots have kept alive.",reward:"A pulse seed, and another climber."},
 {name:"Above the Giant",sub:"Where the sky is fastened",voice:"There was no monster above the clouds. Only a keeper, tired from holding them.",note:"Now decide what a good gardener does with a world that has grown too heavy.",reward:"One last root."}
];
function hash(s){let h=2166136261>>>0;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0;}
function rng(seed){let a=hash(seed)||1;return function(){a^=a<<13;a^=a>>>17;a^=a<<5;return (a>>>0)/4294967296}}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function lerp(a,b,t){return a+(b-a)*t}
function makeWorld(seed){
  seed=String(seed||"the-last-bean").slice(0,60);
  const rand=rng(seed), bases=[[0,2,0],[15,8,-10],[7,15,-26],[24,23,-37],[12,32,-54]];
  const radii=[8.7,8.2,8.6,8.2,10.2];
  const islands=bases.map((p,i)=>({
    id:i, name:STORY[i].name, subtitle:STORY[i].sub,
    x:p[0]+(i?rand()-.5:0)*2.4, y:p[1], z:p[2]+(i?rand()-.5:0)*2.4,
    r:radii[i], tilt:rand()*6.28, hue:[.34,.11,.04,.53,.77][i], detailSeed:Math.floor(rand()*2147483647),
    form:i===3?"hollow":i===4?"heart":i===2?"chain":"garden"
  }));
  const spans=[];
  for(let i=0;i<islands.length-1;i++){
    const a=islands[i],b=islands[i+1];
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
    const ra=a.r*.58,rb=b.r*.58;
    spans.push({id:i,from:i,to:i+1,
      start:{x:a.x+ux*ra,y:a.y+.16,z:a.z+uz*ra},
      end:{x:b.x-ux*rb,y:b.y+.16,z:b.z-uz*rb},
      width:1.6,load:[.29,.49,.66,.77][i],length:len-ra-rb});
  }
  return {seed,hash:hash(seed),islands,spans,story:STORY.map(s=>({...s}))};
}
function initial(seed){
 return {version:2,seed:String(seed||"the-last-bean"),visited:[true,false,false,false,false],
   spans:[false,false,false,false],current:0,inventory:{climber:1,root:0,bloom:1,pulse:0},
   rooted:false,heart:false,blooms:0,ending:null,events:[],time:0,plantings:0};
}
function copy(s){return JSON.parse(JSON.stringify(s))}
function enter(state,index){
 const s=copy(state);
 index=Number(index);
 if(!(index>=0&&index<=4))return {ok:false,state:s,message:"There is no island there."};
 if(index>0&&!s.spans[index-1])return {ok:false,state:s,message:"First grow a path to this island."};
 s.current=index;
 if(!s.visited[index]){
  s.visited[index]=true;
  if(index===1){s.inventory.climber+=2;s.inventory.bloom++;}
  if(index===2){s.inventory.climber++;s.inventory.root++;}
  if(index===3){s.inventory.climber++;s.inventory.pulse++;}
  if(index===4){s.inventory.root++;}
  s.events.push("arrived-"+index);
  return {ok:true,state:s,message:STORY[index].voice,kind:"arrival",island:index};
 }
 return {ok:true,state:s,message:"The path still remembers you.",kind:"return",island:index};
}
function act(state,kind){
 const s=copy(state),i=s.current,inv=s.inventory;
 if(s.ending)return {ok:false,state:s,message:"This story has ended. A new world can grow."};
 function fail(msg){return {ok:false,state:s,message:msg}};
 function success(msg,event){s.plantings++;s.events.push(event);return {ok:true,state:s,message:msg,event}};
 if(kind==="climber"){
   if(i>=4)return fail("No higher island waits. The choice is here.");
   if(s.spans[i])return fail("A living bridge already grows here. Cross it.");
   if(!inv.climber)return fail("You need a green climber seed.");
   if(i===2&&!s.rooted)return fail("The pin is overloaded. Plant a golden root to share its weight.");
   if(i===3&&!s.heart)return fail("The hollow heart is silent. Awaken it with a blue pulse.");
   inv.climber--;s.spans[i]=true;
   return success(["A green thread leaps toward the cloud orchard.","The orchard reaches for the hanging garden.","The repaired pin holds. The stalk grows higher.","The heartbeat travels upward, carrying the last bridge."][i],"bridge-"+i);
 }
 if(kind==="root"){
   if(!inv.root)return fail("You have no golden root seeds.");
   if(i===2&&!s.rooted){
     inv.root--;s.rooted=true;
     return success("The root finds stone beneath the hanging pin. The chain loses some of its burden.","stabilized");
   }
   return fail(i===4?"At the summit, use the final choice to plant the last root.":"This place needs a bridge, not a root. Save it for a strained pin.");
 }
 if(kind==="pulse"){
   if(!inv.pulse)return fail("You have no blue pulse seeds.");
   if(i===3&&!s.heart){
     inv.pulse--;s.heart=true;
     return success("Something vast takes its first slow breath beneath your feet.","awakened");
   }
   return fail("The pulse wants a sleeping heart. Find the hollow stalk.");
 }
 if(kind==="bloom"){
   if(!inv.bloom)return fail("Your flower pods are spent. More wait in the orchard.");
   inv.bloom--;s.blooms++;
   return success("A flower remembers this place. It will shine for whoever comes next.","bloom-"+i+"-"+s.blooms);
 }
 if(kind==="keep"){
   if(i!==4||!s.visited[4])return fail("The choice waits at the summit.");
   if(!inv.root)return fail("You need the last root pod to carry this choice.");
   inv.root--;s.ending="keep";
   return success("The great pin becomes a garden of roots. Far below, someone will climb without knowing your name.","ending-keep");
 }
 if(kind==="release"){
   if(i!==4||!s.visited[4])return fail("The choice waits at the summit.");
   s.ending="release";
   return success("You release the oldest chain. The sky does not fall; it changes shape. Seeds scatter toward an unknown morning.","ending-release");
 }
 return fail("That seed has no name.");
}
function hint(s){
 if(s.ending)return s.ending==="keep"?"The sky is held. Your garden remains.":"The old sky is free. A new garden can begin.";
 if(s.current===4)return "THE SUMMIT · Choose: carry the load, or let the sky change.";
 if(s.spans[s.current])return "CROSS THE GROWN BRIDGE · Follow the luminous flowers to the next island.";
 if(s.current===2&&!s.rooted)return "THE PIN IS STRAINED · Select the golden ROOT seed [2], then sow [E].";
 if(s.current===3&&!s.heart)return "THE HOLLOW HEART · Select the blue PULSE seed [4], then sow [E].";
 return "GROW A PATH · Select green CLIMBER [1], then sow [E].";
}
function groundAt(world,x,z,spans){
 let h=-Infinity,kind="void",index=-1;
 for(const p of world.islands){
  const dx=x-p.x,dz=z-p.z;
  const v=Math.hypot(dx,dz);
  if(v<=p.r*.99){const wave=Math.sin(dx*.37+p.tilt)*Math.cos(dz*.31-p.tilt)*.16;
   const g=p.y+wave-.1*Math.pow(v/p.r,4);
   if(g>h){h=g;kind="island";index=p.id}
  }
 }
 for(const b of world.spans){
  if(!spans[b.id])continue;
  const dx=b.end.x-b.start.x,dz=b.end.z-b.start.z,den=dx*dx+dz*dz;
  const t=clamp(((x-b.start.x)*dx+(z-b.start.z)*dz)/den,0,1);
  const qx=b.start.x+dx*t,qz=b.start.z+dz*t;
  const dist=Math.hypot(x-qx,z-qz),width=b.width*.64;
  if(dist<width){
    const y=lerp(b.start.y,b.end.y,t)+Math.sin(t*Math.PI)*.55;
    if(y>h){h=y;kind="bridge";index=b.id}
  }
 }
 return {height:h,kind,index};
}
function sanitizeSaved(input,seed){
 if(!input||input.version!==2||input.seed!==seed)return initial(seed);
 const d=initial(seed);
 if(!Array.isArray(input.visited)||input.visited.length!==5||
    !Array.isArray(input.spans)||input.spans.length!==4)return d;
 d.visited=input.visited.map(Boolean);d.visited[0]=true;
 d.spans=input.spans.map(Boolean);
 d.current=clamp(Number(input.current)||0,0,4);
 if(!d.visited[d.current]||(d.current>0&&!d.spans[d.current-1]))d.current=0;
 for(const k of Object.keys(d.inventory))d.inventory[k]=clamp(Math.floor(Number(input.inventory?.[k])||0),0,20);
 d.rooted=!!input.rooted;d.heart=!!input.heart;d.blooms=clamp(Number(input.blooms)||0,0,99);
 d.ending=["keep","release"].includes(input.ending)?input.ending:null;
 d.events=Array.isArray(input.events)?input.events.slice(-30).filter(x=>typeof x==="string"):[];
 d.plantings=clamp(Number(input.plantings)||0,0,200);
 d.time=clamp(Number(input.time)||0,0,1e7);
 return d;
}
return {STORY,hash,rng,makeWorld,initial,enter,act,hint,groundAt,sanitizeSaved,clamp,lerp};
});
