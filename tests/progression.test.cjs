"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const B=require("../core.js");
test("same seed makes exactly the same world, another seed changes details",()=>{
 const a=B.makeWorld("one"),b=B.makeWorld("one"),c=B.makeWorld("two");
 assert.deepEqual(a,b);assert.notDeepEqual(a.islands,c.islands);
 assert.equal(a.islands.length,5);assert.equal(a.spans.length,4);
 for(const x of a.spans){assert.ok(x.length>0&&x.length<30);assert.ok(x.start.y<x.end.y);}
});
test("there is an uninterrupted procedural walkable corridor when grown",()=>{
 for(const seed of ["a","b","cloud-1105","tree # 🌱"]){
  const w=B.makeWorld(seed),grown=[true,true,true,true];
  for(const s of w.spans)for(let i=0;i<=100;i++){
   const t=i/100,x=B.lerp(s.start.x,s.end.x,t),z=B.lerp(s.start.z,s.end.z,t);
   assert.ok(Number.isFinite(B.groundAt(w,x,z,grown).height),"gap at bridge "+s.id+" t "+t+" seed "+seed);
  }
 }
});
test("cannot skip an island without a bridge",()=>{
 const s=B.initial("seed");
 assert.equal(B.enter(s,2).ok,false);
 assert.equal(B.act(s,"root").ok,false);
 assert.equal(B.act(s,"pulse").ok,false);
 assert.equal(B.act(s,"keep").ok,false);
 assert.equal(B.act(s,"release").ok,false);
});
function chapter(s,action){const r=B.act(s,action);assert.ok(r.ok,action+" failed: "+r.message);return r.state;}
function walk(s,i){const r=B.enter(s,i);assert.ok(r.ok,"walk to "+i+" failed: "+r.message);return r.state;}
test("all five chapters, resource economy, repaired pin, heart, two endings",()=>{
 let s=B.initial("once");
 s=chapter(s,"climber");assert.deepEqual(s.spans,[true,false,false,false]);
 s=walk(s,1);assert.equal(s.inventory.climber,2);
 s=chapter(s,"climber");s=walk(s,2);
 assert.equal(B.act(s,"climber").ok,false,"unrooted pin must block bridge");
 s=chapter(s,"root");assert.equal(s.rooted,true);
 s=chapter(s,"climber");s=walk(s,3);
 assert.equal(B.act(s,"climber").ok,false,"sleeping heart must block bridge");
 s=chapter(s,"pulse");s=chapter(s,"climber");s=walk(s,4);
 assert.equal(s.inventory.root,1);
 const saved=JSON.parse(JSON.stringify(s));
 let kept=chapter(s,"keep");assert.equal(kept.ending,"keep");
 assert.equal(B.act(kept,"release").ok,false);
 let released=chapter(saved,"release");assert.equal(released.ending,"release");
 assert.deepEqual(released.spans,[true,true,true,true]);
 assert.ok(kept.events.includes("stabilized")&&kept.events.includes("awakened"));
});
test("revisiting doesn't duplicate pods",()=>{
 let s=B.initial("seed");s=chapter(s,"climber");s=walk(s,1);
 const inventory={...s.inventory};s=walk(s,1);assert.deepEqual(s.inventory,inventory);
});
test("bloom spends only its own inventory; saved state restores safely",()=>{
 let s=B.initial("seed");s=chapter(s,"bloom");
 assert.equal(s.inventory.bloom,0);assert.equal(s.blooms,1);
 assert.equal(B.act(s,"bloom").ok,false);
 assert.deepEqual(B.sanitizeSaved(s,"seed").inventory,s.inventory);
 assert.equal(B.sanitizeSaved(s,"different").current,0);
 assert.equal(B.sanitizeSaved({version:2,seed:"seed",spans:[],visited:[]},"seed").current,0);
});
test("green seed isn't consumed on a failed root or pulse intervention",()=>{
 let s=B.initial("seed");const old=JSON.stringify(s);
 assert.equal(B.act(s,"pulse").ok,false);assert.equal(JSON.stringify(s),old);
});
