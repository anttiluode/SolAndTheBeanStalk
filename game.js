/* Sol and the Beanstalk — input, traversal, story and persistence. */
(function(){
"use strict";
const B=globalThis.BeanWorld,R=globalThis.BeanRender,canvas=document.getElementById("world");
const $=id=>document.getElementById(id);
const names=["I","II","III","IV","V"];
const fromHash=decodeURIComponent((location.hash.match(/seed-([^&]+)/)||[])[1]||"the-last-bean");
const seed=fromHash.slice(0,60)||"the-last-bean";
const world=B.makeWorld(seed),saveKey="sol-beanstalk:v2:"+seed;
let saved=null;try{saved=JSON.parse(localStorage.getItem(saveKey)||"null");}catch(_){}
let state=B.sanitizeSaved(saved,seed),selected="climber",paused=true,started=false,silent=true,context=null;
let renderer;
try{renderer=R.create(canvas,world);}
catch(e){$("fatal").hidden=false;$("fatal-msg").textContent=String(e.message||e);return;}
const player={x:world.islands[state.current].x,y:world.islands[state.current].y+.15,
 z:world.islands[state.current].z,moving:false,vy:0,onGround:true};
const keys=new Set(),growth=state.spans.map(x=>x?1:0);
let lastFrame=0,time=0,toastTimer=0,following=null,drag=null,storyAfterContinue=null,lastIsland=state.current;
renderer.updatePin(state.rooted);renderer.updateHeart(state.heart);renderer.updateKeeper(state.ending);
for(const event of state.events){const m=event.match(/^bloom-(\d)-(\d+)$/);if(m)renderer.addBloom(+m[1],+m[2]);}
function store(){try{localStorage.setItem(saveKey,JSON.stringify(state));}catch(_){}}
function toast(msg,seconds=3){
 $("toast").textContent=msg;$("toast").classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),seconds*1000);
}
function sound(notes=[440,659],duration=.36){
 if(silent)return;
 try{
  context=context||new (window.AudioContext||window.webkitAudioContext)();
  if(context.state==="suspended")context.resume();
  const now=context.currentTime;
  for(let i=0;i<notes.length;i++){
   const osc=context.createOscillator(),gain=context.createGain();
   osc.type=i%2?"sine":"triangle";osc.frequency.setValueAtTime(notes[i],now);
   gain.gain.setValueAtTime(.0001,now+i*.07);
   gain.gain.exponentialRampToValueAtTime(.075/(i+1),now+i*.07+.02);
   gain.gain.exponentialRampToValueAtTime(.0001,now+i*.07+duration);
   osc.connect(gain).connect(context.destination);osc.start(now+i*.07);osc.stop(now+i*.07+duration+.02);
  }
 }catch(_){}
}
function overlayShow(id){
 const el=$(id);el.hidden=false;requestAnimationFrame(()=>el.classList.add("show"));paused=true;
}
function overlayHide(id){
 const el=$(id);el.classList.remove("show");el.hidden=true;
 paused=!!document.querySelector(".overlay.show:not([hidden])");
}
function selectSeed(name){
 if(!Object.hasOwn(state.inventory,name))return;
 selected=name;
 for(const button of document.querySelectorAll(".seed")){
  const active=button.dataset.seed===selected;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
 }
 renderHud();
}
function autoSelect(){
 if(state.current===2&&!state.rooted&&state.inventory.root)selectSeed("root");
 else if(state.current===3&&!state.heart&&state.inventory.pulse)selectSeed("pulse");
 else if(state.inventory.climber)selectSeed("climber");
 else if(state.inventory.bloom)selectSeed("bloom");
}
function renderHud(){
 const i=state.current,entry=B.STORY[i];
 $("chapter-number").textContent=names[i];$("region").textContent=(entry.name+" · "+entry.sub).toUpperCase();
 const objective=state.ending?"THE END · A STORY YOU GREW":i===4?"THE KEEPER · YOU MUST CHOOSE":i===2&&!state.rooted?"THE PIN · ROOT IT BEFORE CLIMBING":i===3&&!state.heart?"THE HOLLOW · AWAKEN THE HEART":state.spans[i]?"FOLLOW THE BLOSSOMING BRIDGE":"GROW A VINE TO THE NEXT ISLAND";
 $("objective").textContent=objective;
 const progress=$("progress").children;for(let j=0;j<progress.length;j++)progress[j].classList.toggle("on",j<=i);
 for(const [type,count] of Object.entries(state.inventory))$("count-"+type).textContent=count;
 const need=i===2&&!state.rooted?"A ROOT CAN CARRY THIS LOAD":i===3&&!state.heart?"THE HEART NEEDS A PULSE":state.spans[i]?"THE VINE IS READY TO CROSS":"A PATH IS WAITING TO GROW";
 $("action-label").textContent=state.current===4?"THE LAST DECISION":need;
 $("action-hint").textContent=state.ending?"The story is complete.":i===4?"Choose what holds the sky.":state.spans[i]?"Cross the vine, or press F to ride it.":selected==="climber"?"Sow a green seed to grow a bridge.":selected==="root"?"Roots find supports that leaves cannot see.":selected==="pulse"?"A crystal heartbeat needs a blue pulse.":"Plant a flower to remember this island.";
 $("sow").innerHTML=i===4?'THE FINAL CHOICE <span>E</span>':state.spans[i]?'FOLLOW GROWN VINE <span>F</span>':'SOW '+selected.toUpperCase()+' <span>E</span>';
 $("load-wrap").hidden=!(i===2||i===4);
 const load=state.rooted?42:94;
 $("load-fill").style.width=load+"%";
 $("load-text").textContent=state.rooted?"ROOTED · STABLE":"STRAINED · 94%";
}
function showStory(i,then){
 const entry=B.STORY[i];storyAfterContinue=then||null;
 $("story-label").textContent="FIELD NOTE · "+names[i]+" · "+entry.sub.toUpperCase();
 $("story-title").textContent=entry.name;
 $("story-voice").textContent=entry.voice;
 $("story-body").textContent=entry.note+(entry.reward?" "+entry.reward:"");
 overlayShow("story-overlay");
 sound([440,554,698],.65);
}
function restorePlayer(i){
 const island=world.islands[i];
 player.x=island.x;player.z=island.z;player.y=island.y+.08;player.vy=0;player.onGround=true;
 lastIsland=i;following=null;
}
function arrived(i){
 const result=B.enter(state,i);
 if(!result.ok)return;
 state=result.state;
 if(result.kind==="arrival"){
  autoSelect();renderHud();store();sound([392,523,659,784],.85);
  showStory(i,i===4?showEnding:null);
 }else{renderHud();store();}
}
function showEnding(){
 $("ending-title").textContent=state.ending?state.ending==="keep"?"The Roots Remember":"The Unfastened Sky":"Find what carries the load.";
 $("ending-intro").textContent="Below you, every vine you grew glimmers in the clouds. The keeper has held this one old pin for so long that roots have grown around his hands. He does not ask you to defeat him. He asks what the world should carry next.";
 $("choice-buttons").hidden=!!state.ending;
 $("epilogue").hidden=!state.ending;
 if(state.ending){
  $("epilogue-text").textContent=state.ending==="keep"?
   "You plant the last root beside the keeper. It spreads through ancient stone and finds a hundred small ways to share the weight. Far below, a child climbs a flowered bridge and never knows your name.":
   "You unfasten the oldest chain. The sky does not fall. It takes a breath and rearranges itself. Some familiar paths vanish; an orchard of wild seeds drifts free above the clouds.";
  $("epilogue-moral").textContent=state.ending==="keep"?"A world can be held by many hands.":"Letting go is not always the same as giving up.";
 }
 overlayShow("ending-overlay");
}
function sow(){
 if(!started||paused)return;
 if(state.current===4){showEnding();return;}
 const island=world.islands[state.current],dist=Math.hypot(player.x-island.x,player.z-island.z);
 if(dist>island.r*1.02){toast("Find firm ground on this island before planting.");return;}
 const result=B.act(state,selected);
 if(!result.ok){toast(result.message,4);sound([220],.20);return;}
 state=result.state;store();renderHud();
 if(result.event.startsWith("bridge-")){
  const n=Number(result.event.slice(7));growth[n]=0;
  toast(result.message,4);sound([329,494,659],.80);
 }else if(result.event==="stabilized"){
  renderer.updatePin(true);toast(result.message,5);sound([261,392,523],.9);autoSelect();
 }else if(result.event==="awakened"){
  renderer.updateHeart(true);toast(result.message,5);sound([220,440,660,880],.9);autoSelect();
 }else if(result.event.startsWith("bloom-")){
  renderer.addBloom(state.current,state.blooms);toast(result.message,3);sound([523,659,784],.65);
 }
}
function follow(){
 if(!started||paused)return;
 const i=state.current;if(i>=4||!state.spans[i]){toast("Grow a bridge before following it.");return;}
 if(growth[i]<.97){toast("The vine is still growing. Let it flower.");return;}
 const b=world.spans[i],distance=Math.hypot(player.x-b.start.x,player.z-b.start.z);
 if(distance>world.islands[i].r*1.3){toast("Walk nearer to the beginning of your vine.");return;}
 following={i,t:0};player.vy=0;toast("The vine carries you through the cloud.",2);sound([392,587],.5);
}
function choose(kind){
 const result=B.act(state,kind);
 if(!result.ok){toast(result.message);return;}
 state=result.state;renderer.updateKeeper(state.ending);store();sound(kind==="keep"?[330,440,550,660]:[523,392,329,261],1.3);showEnding();
}
function reset(){
 const next=(Date.now().toString(36)+"-"+Math.floor(Math.random()*10000).toString(36));
 location.hash="seed-"+next;location.reload();
}
function start(){
 started=true;overlayHide("welcome");paused=false;renderHud();
 if(saved&&state.visited.slice(1).some(Boolean)){toast("Your garden remembers your last visit.",4);}
 else showStory(0);
 if(state.ending)showEnding();
}
$("start").addEventListener("click",start);
$("story-next").addEventListener("click",()=>{overlayHide("story-overlay");const cb=storyAfterContinue;storyAfterContinue=null;if(cb)cb();else paused=false;});
$("sow").addEventListener("click",()=>{if(state.current<4&&state.spans[state.current])follow();else sow();});
$("choose-keep").addEventListener("click",()=>choose("keep"));
$("choose-release").addEventListener("click",()=>choose("release"));
$("play-again").addEventListener("click",reset);
$("reset").addEventListener("click",()=>{if(confirm("Grow a new world? This world's progress stays saved under its seed."))reset();});
$("help").addEventListener("click",()=>overlayShow("help-overlay"));
$("close-help").addEventListener("click",()=>{overlayHide("help-overlay");paused=false;});
$("sound").addEventListener("click",()=>{silent=!silent;$("sound").textContent=silent?"♪ Sound off":"♫ Sound on";$("sound").setAttribute("aria-pressed",String(!silent));if(!silent)sound([392,494,659],.55);});
for(const el of document.querySelectorAll(".seed"))el.addEventListener("click",()=>selectSeed(el.dataset.seed));
function onKey(e,down){
 const key=e.key.toLowerCase();
 const k={arrowup:"w",arrowdown:"s",arrowleft:"a",arrowright:"d"}[key]||key;
 if(["w","a","s","d"," ","arrowup","arrowdown","arrowleft","arrowright","shift"].includes(key))e.preventDefault();
 if(down){if(e.repeat&&["e","f"," ","1","2","3","4"].includes(k))return;
  if(k>="1"&&k<="4"){selectSeed(["climber","root","bloom","pulse"][Number(k)-1]);return;}
  if(k==="escape"){
   if(!$("help-overlay").hidden){overlayHide("help-overlay");paused=false;}
   else if(!$("story-overlay").hidden){$("story-next").click();}
   return;
  }
  if(k==="e"){sow();return;}if(k==="f"){follow();return;}
  if(k===" "&&!paused&&started&&player.onGround&&!following){player.vy=8.4;player.onGround=false;sound([440],.14);}
  keys.add(k);
 }else keys.delete(k);
}
addEventListener("keydown",e=>onKey(e,true));
addEventListener("keyup",e=>onKey(e,false));
addEventListener("blur",()=>keys.clear());
canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);canvas.classList.add("drag");});
canvas.addEventListener("pointermove",e=>{
 if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
 renderer.camera.yaw-=dx*.006;renderer.camera.pitch=B.clamp(renderer.camera.pitch+dy*.0045,.12,1.13);
 drag.x=e.clientX;drag.y=e.clientY;
});
canvas.addEventListener("pointerup",e=>{if(drag&&!drag.moved&&!paused){
 const i=state.current,b=world.spans[i];
 if(b&&!state.spans[i]){
  const pt=renderer.project([b.end.x,b.end.y+1.4,b.end.z]);
  if(pt&&Math.hypot(pt.x-e.clientX,pt.y-e.clientY)<90)sow();
 }
 }
 drag=null;canvas.classList.remove("drag");
});
canvas.addEventListener("wheel",e=>{e.preventDefault();renderer.camera.distance=B.clamp(renderer.camera.distance+Math.sign(e.deltaY)*1.3,6,32);},{passive:false});
canvas.addEventListener("contextmenu",e=>e.preventDefault());
for(const el of document.querySelectorAll("[data-move]")){
 const k=el.dataset.move;
 el.addEventListener("pointerdown",e=>{e.preventDefault();keys.add(k);el.setPointerCapture(e.pointerId);});
 for(const ev of ["pointerup","pointercancel","lostpointercapture"])el.addEventListener(ev,()=>keys.delete(k));
}
$("touch-jump").addEventListener("click",()=>{if(player.onGround&&!paused){player.vy=8.4;player.onGround=false;}});
$("touch-follow").addEventListener("click",follow);
const touch=matchMedia("(pointer:coarse)");function checkTouch(){$("touch").style.display=touch.matches?"flex":"none";}
checkTouch();touch.addEventListener?.("change",checkTouch);
let airTime=0;
function simulate(dt){
 if(paused||!started)return;
 state.time+=dt;
 for(let i=0;i<growth.length;i++)if(state.spans[i])growth[i]=Math.min(1,growth[i]+dt*.29);
 if(following){
  const b=world.spans[following.i];
  following.t=Math.min(1,following.t+dt*.23);const t=following.t,p=renderer.bridgePoint(b,t);
  player.x=p[0];player.z=p[2];player.y=p[1]+.19;player.vy=0;player.onGround=true;player.moving=true;
  if(t>=1){const next=b.to;following=null;restorePlayer(next);arrived(next);}
  return;
 }
 let forward=(keys.has("w")?1:0)-(keys.has("s")?1:0);
 let sideways=(keys.has("d")?1:0)-(keys.has("a")?1:0);
 const len=Math.hypot(forward,sideways);
 player.moving=len>0;
 const speed=(keys.has("shift")?7.5:5.2);
 if(len){forward/=len;sideways/=len;const yaw=renderer.camera.yaw;
  const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*sideways)*speed*dt;
  const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*sideways)*speed*dt;
  player.x+=dx;player.z+=dz;
 }
 const effective=state.spans.map((x,i)=>x&&growth[i]>.95);
 const ground=B.groundAt(world,player.x,player.z,effective);
 player.vy-=18*dt;player.y+=player.vy*dt;
 const floor=ground.height+.07;
 if(Number.isFinite(floor)&&player.y<=floor&&player.vy<=0){
  player.y=floor;player.vy=0;player.onGround=true;airTime=0;
 }else{player.onGround=false;airTime+=dt;}
 const checkpoint=world.islands[state.current];
 if(player.y<checkpoint.y-21){
  restorePlayer(state.current);toast("The cloud catches you and returns you to the last garden.",3);sound([261,220],.50);
 }
 if(player.onGround&&ground.kind==="island"){
  const id=ground.index;
  if(id!==state.current&&id>=0&&
     (id===0||state.spans[id-1])&&Math.hypot(player.x-world.islands[id].x,player.z-world.islands[id].z)<world.islands[id].r*.67){
   lastIsland=id;arrived(id);
  }
 }
}
function tick(now){
 const dt=Math.min(.05,lastFrame?(now-lastFrame)/1000:.016);lastFrame=now;
 time+=dt;simulate(dt);
 renderer.frame(time,player,state,growth);
 requestAnimationFrame(tick);
}
renderHud();requestAnimationFrame(tick);
addEventListener("webglcontextlost",e=>{e.preventDefault();toast("The graphics device reset. Reload the page to restore the garden.",12);});
globalThis.BeanDebug={world,get state(){return state},get player(){return player},renderer,
 sow,follow,enter:i=>arrived(i),selectSeed,showEnding,restorePlayer};
})();
