/* Dependency-free WebGL2 organic world renderer. */
(function(root){
"use strict";
const B=root.BeanWorld,TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t,vec=(x,y,z)=>[x,y,z],
 add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),
 scale=(a,s)=>a.map(v=>v*s),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
 dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),normal=a=>scale(a,1/(Math.hypot(...a)||1));
const GOLD=[.95,.70,.34],PINK=[.93,.52,.65],BLUE=[.44,.83,.94],GREEN=[.48,.73,.35];
const PAL=[
 [[.33,.49,.35],[.23,.32,.33],[.87,.60,.57]],
 [[.42,.49,.28],[.37,.32,.29],[.98,.71,.42]],
 [[.37,.41,.33],[.33,.28,.30],[.96,.57,.38]],
 [[.26,.48,.52],[.27,.32,.47],[.58,.81,.97]],
 [[.40,.39,.53],[.31,.27,.43],[.98,.74,.89]]
];
function mesh(){return {v:[]};}
function tri(m,a,b,c,col,t=0){
 const n=normal(cross(sub(b,a),sub(c,a)));
 for(const p of [a,b,c])m.v.push(...p,...n,...col,t);
}
function quad(m,a,b,c,d,col,t=0){tri(m,a,b,c,col,t);tri(m,a,c,d,col,t);}
function tube(m,points,radius,color,sides=7,grow=false){
 if(points.length<2)return;
 const rings=[],last=points.length-1;
 for(let i=0;i<=last;i++){
  const t=normal(sub(points[Math.min(i+1,last)],points[Math.max(i-1,0)]));
  const ref=Math.abs(t[1])>.88?[1,0,0]:[0,1,0],u=normal(cross(t,ref)),v=normal(cross(u,t));
  const r=[];
  for(let k=0;k<sides;k++){const ang=k*TAU/sides,rad=radius*(1+.07*Math.sin(k*2.4+i*.6));
   r.push(add(points[i],add(scale(u,Math.cos(ang)*rad),scale(v,Math.sin(ang)*rad))));}
  rings.push(r);
 }
 for(let i=0;i<last;i++)for(let k=0;k<sides;k++){
  const kk=(k+1)%sides,c=color.map(x=>x*(.96+.05*Math.sin(i+k*.6)));
  quad(m,rings[i][k],rings[i][kk],rings[i+1][kk],rings[i+1][k],c,grow?(i+.5)/last:0);
 }
}
function orb(m,c,r,col,rings=6,sides=10,prog=0,stretch=[1,1,1]){
 for(let i=0;i<rings;i++)for(let k=0;k<sides;k++){
  function p(a,b){return [c[0]+Math.sin(a)*Math.cos(b)*r*stretch[0],c[1]+Math.cos(a)*r*stretch[1],c[2]+Math.sin(a)*Math.sin(b)*r*stretch[2]]}
  const a=i*Math.PI/rings,b=(i+1)*Math.PI/rings,x=k*TAU/sides,y=(k+1)*TAU/sides;
  quad(m,p(a,x),p(a,y),p(b,y),p(b,x),col,prog);
 }
}
function leaf(m,p,length,c,t=0){
 const a=p,b=add(p,[length*.20,length*.57,length*.08]),d=add(p,[-length*.17,length*.50,-length*.15]),tip=add(p,[length*.27,length,length*.14]);
 tri(m,a,b,tip,c,t);tri(m,a,tip,d,c,t);
}
function flower(m,p,r,c,t=0){
 for(let k=0;k<6;k++){
  const th=k*TAU/6,d=[Math.cos(th),0,Math.sin(th)],side=[-d[2],0,d[0]];
  const tip=add(p,add(scale(d,r),[0,r*.3,0])),l=add(p,scale(side,r*.25)),rr=add(p,scale(side,-r*.25));
  tri(m,l,tip,rr,c,t);
 }
 orb(m,add(p,[0,.06,0]),r*.21,GOLD,3,6,t);
}
function shard(m,p,r,c,t=0){
 const top=add(p,[0,r*2.3,0]),bottom=add(p,[0,-r*.7,0]);
 for(let k=0;k<6;k++){
  const a=k*TAU/6,b=(k+1)*TAU/6,v=add(p,[Math.cos(a)*r,r*.30,Math.sin(a)*r]),w=add(p,[Math.cos(b)*r,r*.30,Math.sin(b)*r]);
  tri(m,v,top,w,c.map(x=>x*(.83+.11*Math.sin(k))),t);tri(m,bottom,v,w,c.map(x=>x*.60),t);
 }
}
function bridgePoint(s,t){return [lerp(s.start.x,s.end.x,t),lerp(s.start.y,s.end.y,t)+Math.sin(Math.PI*t)*.55,lerp(s.start.z,s.end.z,t)];}
function bridgeMesh(span,seed){
 const m=mesh(),rand=B.rng(seed+"bridge"+span.id),pts=[];
 for(let i=0;i<=48;i++)pts.push(bridgePoint(span,i/48));
 tube(m,pts,.96,[.32,.39,.27],11,true);
 for(let k=0;k<3;k++){
  const pp=pts.map((p,i)=>{const a=i*.77+k*TAU/3;return add(p,[.58*Math.cos(a),.51*Math.sin(a),.38*Math.sin(a)]);});
  tube(m,pp,.17,k===1?[.36,.54,.29]:[.30,.50,.30],6,true);
 }
 const dx=span.end.x-span.start.x,dz=span.end.z-span.start.z,n=Math.hypot(dx,dz)||1,side=[-dz/n,0,dx/n];
 for(let i=3;i<48;i+=2){
  const t=i/48,sgn=i%4===1?1:-1,p=add(pts[i],add(scale(side,sgn*.82),[0,.35,0]));
  leaf(m,p,.35+rand()*.35,[.41,.68,.34],t);
  if(i%8===3)flower(m,add(p,[0,.18,0]),.30,[PINK,BLUE,GOLD][span.id%3],t);
 }
 return m;
}
function islandMesh(p,id,seed){
 const m=mesh(),rand=B.rng(seed+"island"+id),pal=PAL[id],N=48,R=6;
 function pos(r,k){const a=k*TAU/N,rr=p.r*r/R*(1+.06*Math.sin(a*5+p.tilt)+.04*Math.sin(a*11-p.tilt)),x=p.x+Math.cos(a)*rr,z=p.z+Math.sin(a)*rr;
  return [x,p.y+Math.sin((x-p.x)*.37+p.tilt)*Math.cos((z-p.z)*.31-p.tilt)*.16-.08*Math.pow(r/R,4),z];}
 for(let j=0;j<R;j++)for(let k=0;k<N;k++){
  const col=pal[0].map(x=>x*(.91+rand()*.16));
  quad(m,pos(j,k),pos(j,k+1),pos(j+1,k+1),pos(j+1,k),col);
 }
 for(let j=0;j<7;j++)for(let k=0;k<N;k++){
  function bottom(t,k){const a=k*TAU/N,rr=p.r*(1-.91*t)*(1+.06*Math.sin(a*5+p.tilt)+.04*Math.sin(a*11-p.tilt));
   return [p.x+rr*Math.cos(a),p.y-t*(p.r*.80+3),p.z+rr*Math.sin(a)];}
  quad(m,bottom(j/7,k+1),bottom(j/7,k),bottom((j+1)/7,k),bottom((j+1)/7,k+1),
     pal[1].map(x=>x*(.85-j*.07)));
 }
 for(let j=0;j<245;j++){
  const a=rand()*TAU,r=Math.sqrt(rand())*p.r*.87,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,y=p.y;
  if(rand()<.79)leaf(m,[x,y,z],.13+rand()*.30,[.37+rand()*.08,.54+rand()*.16,.26+rand()*.07]);
  else flower(m,[x,y+.08,z],.13+rand()*.13,pal[2]);
 }
 for(let j=0;j<5;j++){
  const a=rand()*TAU,r=p.r*(.30+rand()*.38),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,y=p.y;
  const height=2.5+rand()*3.4,path=[];
  for(let k=0;k<=11;k++){const t=k/11;path.push([x+.17*Math.sin(t*5+j),y+height*t,z+.16*Math.cos(t*4+j)]);}
  tube(m,path,.17,[.30,.34,.26],7);
  for(let k=0;k<3;k++){
   const q=path[7+k],end=[q[0]+(rand()-.5)*2.8,q[1]+.9,q[2]+(rand()-.5)*2.8];
   tube(m,[q,add(q,scale(sub(end,q),.55)),end],.08,[.30,.38,.24],5);
   orb(m,end,.66+rand()*.36,[.25+rand()*.12,.47+rand()*.13,.28+rand()*.12],5,8,0,[1,.85,1.1]);
   if(rand()<.6)flower(m,add(end,[0,.65,0]),.22,pal[2]);
  }
 }
 return m;
}
function worldMesh(world){
 const m=mesh(),cloud=mesh(),rand=B.rng(world.seed+"scene"),p=world.islands[3],path=[];
 for(let i=0;i<=100;i++){const t=i/100;path.push([p.x+8+Math.cos(t*TAU*2.1)*3.4,-8+75*t,p.z-5+Math.sin(t*TAU*1.7)*3.4]);}
 tube(m,path,2.05,[.23,.34,.28],12);
 for(let q=0;q<4;q++){
  const strand=path.map((v,j)=>add(v,[Math.sin(j*.25+q*TAU/4)*2,0,Math.cos(j*.25+q*TAU/4)*2]));
  tube(m,strand,.30,[.31,.46,.31],7);
 }
 for(let i=7;i<96;i+=4){
  const q=path[i],a=i*2.1,pt=add(q,[Math.sin(a)*2.4,0,Math.cos(a)*2.4]);
  leaf(m,pt,1.3,[.38,.63,.40]);if(i%12===7)flower(m,add(pt,[0,1.1,0]),.63,[.95,.63,.70]);
 }
 for(const [id,ox,oz] of [[1,1,5],[2,0,8],[2,-4,-5],[3,3,4],[4,-6,0]]){
  const q=world.islands[id],x=q.x+ox,z=q.z+oz,top=q.y+16,pts=[];
  for(let i=0;i<=28;i++)pts.push([x+.18*Math.sin(i*.54),top-i*.67,z+.12*Math.cos(i*.54)]);
  tube(m,pts,.10,[.48,.46,.36],6);
  for(let j=0;j<19;j++){
   const loop=[];for(let k=0;k<=11;k++){const t=k*TAU/11;loop.push([x+.31*Math.cos(t),top-j*.86+.41*Math.sin(t),z+.10*Math.sin(t+j)]);}
   tube(m,loop,.047,[.64,.56,.41],5);
  }
  orb(m,[x,top+.3,z],.40,[.75,.59,.41],4,7);
 }
 for(const q of world.islands)for(let i=0;i<9;i++){
  const a=rand()*TAU,r=q.r*(.30+rand()*.9);
  orb(cloud,[q.x+r*Math.cos(a),q.y-4-rand()*3,q.z+r*Math.sin(a)],
       2+rand()*4,[.57+rand()*.08,.71+rand()*.06,.78],4,8,0,[1.8,.3,1.2]);
 }
 for(let i=0;i<45;i++){
  shard(m,[-30+rand()*95,4+rand()*55,-95+rand()*120],.06+rand()*.15,[.60,.82,.95]);
 }
 return {solid:m,cloud};
}
function pinMesh(world,rooted){
 const m=mesh(),q=world.islands[2],at=[q.x+1,q.y+8,q.z+2],stem=[];
 orb(m,at,1.05,rooted?[.45,.72,.48]:[.78,.36,.27],7,11);
 for(let i=0;i<=18;i++){const t=i/18;stem.push([at[0]+.4*Math.sin(t*9),at[1]-8.6*t,at[2]+.38*Math.cos(t*9)]);}
 tube(m,stem,.25,rooted?[.35,.56,.29]:[.48,.38,.30],8);
 for(let j=0;j<(rooted?8:4);j++){
  const a=j*TAU/(rooted?8:4);
  if(rooted){
   const pts=[];for(let k=0;k<=17;k++){const t=k/17;pts.push([at[0]+Math.cos(a+t*2)*(.8+2*t),at[1]-9*t,at[2]+Math.sin(a+t*2)*(.8+2*t)]);}
   tube(m,pts,.12,[.40,.66,.33],6);flower(m,pts[11],.23,GOLD);
  }else shard(m,[at[0]+1.3*Math.cos(a),at[1]+.3,at[2]+1.3*Math.sin(a)],.35,[.98,.39,.27]);
 }
 return m;
}
function heartMesh(world,awake){
 const m=mesh(),q=world.islands[3],c=[q.x,q.y+4.5,q.z];
 for(let j=0;j<9;j++){
  const a=j*TAU/9,pts=[];
  for(let k=0;k<=18;k++){const t=k/18,rad=5.1-1.2*Math.sin(t*Math.PI),aa=a+t*.5;
   pts.push([c[0]+rad*Math.cos(aa),c[1]-4+8*t,c[2]+rad*Math.sin(aa)]);}
  tube(m,pts,.28,[.31,.44,.52],7);
 }
 orb(m,c,1.6,awake?[.53,.85,.96]:[.29,.44,.56],11,14);
 for(let i=0;i<8;i++){
  const a=i*TAU/8,rr=awake?2.2:1.4;
  shard(m,[c[0]+Math.cos(a)*rr,c[1]+.2*Math.sin(a*2),c[2]+Math.sin(a)*rr],.44,awake?[.73,.92,.98]:[.38,.59,.72]);
 }
 return m;
}
function keeperMesh(world,ending){
 const m=mesh(),q=world.islands[4],c=[q.x+2,q.y+3,q.z-2],stone=[.49,.44,.50];
 orb(m,add(c,[3,2,0]),2.1,stone,8,12,0,[.85,1.2,.8]);
 orb(m,add(c,[3,-1,-1]),3.5,[.37,.39,.44],8,12,0,[1.03,1.2,.83]);
 for(const s of [-1,1]){
  const arm=[add(c,[3+s*2,0,-2]),add(c,[3+s*3.2,-2,1]),add(c,[3+s*1.6,-1,2.5])];
  tube(m,arm,.55,stone,9);
  for(let i=0;i<3;i++)tube(m,[add(arm[2],[s*i*.20,0,0]),add(arm[2],[s*(.3+i*.22),-.5,1])],.15,stone,5);
 }
 for(let i=0;i<2;i++)orb(m,add(c,[2.45+i*1.2,2.6,1.5]),.14,GOLD,5,8);
 for(const d of [[-1,0,0],[1,1,0],[0,1.6,1]])shard(m,add(c,add([3,4.1,-1],d)),.52,[.70,.68,.78]);
 const pin=[q.x-2,q.y+5,q.z+2];orb(m,pin,1.2,ending==="keep"?GREEN:ending==="release"?BLUE:GOLD,8,12);
 for(let j=0;j<4;j++){const a=j*TAU/4;
  tube(m,[[pin[0]+Math.cos(a),pin[1],pin[2]+Math.sin(a)],[pin[0]+Math.cos(a)*1.7,pin[1]+3,pin[2]+Math.sin(a)*1.7],
    [pin[0]+Math.cos(a),pin[1]+6,pin[2]+Math.sin(a)]],.12,[.48,.59,.42],6);}
 return m;
}
function bloomMesh(world,id,num){
 const m=mesh(),q=world.islands[id],rand=B.rng(world.seed+"bloom"+id+num),a=num*2.399+id,r=q.r*(.18+rand()*.42);
 const x=q.x+Math.cos(a)*r,z=q.z+Math.sin(a)*r,h=1.5+rand()*1.2,pts=[];
 for(let i=0;i<=13;i++){const t=i/13;pts.push([x+.3*Math.sin(t*5),q.y+h*t,z+.2*Math.cos(t*4)]);}
 tube(m,pts,.09,[.37,.67,.32],6);
 for(let i=3;i<13;i+=3)leaf(m,pts[i],.48,GREEN);
 flower(m,pts[13],.79,[PINK,BLUE,GOLD,GREEN][num%4]);
 return m;
}
function targetMesh(world,index){
 const m=mesh(),s=world.spans[index],p=[s.end.x,s.end.y+1.45,s.end.z],col=[GREEN,GOLD,BLUE,PINK][index];
 tube(m,[[p[0],p[1]-1.1,p[2]],[p[0],p[1]+1,p[2]]],.09,[.55,.70,.48],7);
 shard(m,[p[0],p[1]+.9,p[2]],.39,col);
 for(let k=0;k<16;k++){
  const a=k*TAU/16,b=(k+1)*TAU/16;
  tri(m,[p[0]+.91*Math.cos(a),p[1]+.20,p[2]+.91*Math.sin(a)],
        [p[0]+.91*Math.cos(b),p[1]+.20,p[2]+.91*Math.sin(b)],
        [p[0]+1.02*Math.cos(a),p[1]+.21,p[2]+1.02*Math.sin(a)],col);
 }
 flower(m,[p[0],p[1]+1.7,p[2]],.37,[GOLD,PINK,BLUE,GREEN][index]);
 return m;
}
function avatarMesh(){
 const m=mesh();
 orb(m,[0,.63,0],.32,[.63,.70,.42],7,10,0,[1,1.6,.80]);orb(m,[0,1.30,0],.27,[.90,.72,.55],6,10);
 tube(m,[[0,.93,.14],[0,.62,.23],[0,.19,.33]],.23,[.58,.32,.33],8);
 orb(m,[.25,.69,.18],.23,[.79,.57,.30],5,9);
 for(const s of [-1,1]){
  tube(m,[[.17*s,.39,0],[.22*s,.08,.07]],.085,[.34,.39,.33],6);
  tube(m,[[.24*s,.93,0],[.32*s,.56,-.06]],.075,[.85,.69,.55],6);
 }
 orb(m,[0,1.52,0],.27,[.50,.67,.35],4,9,0,[1,.45,1]);
 return m;
}
function perspective(fov,ratio,n,f){const s=1/Math.tan(fov/2),nf=1/(n-f);return [s/ratio,0,0,0,0,s,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0];}
function look(eye,target){const z=normal(sub(eye,target)),x=normal(cross([0,1,0],z)),y=cross(z,x);
 return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function mult(a,b){const r=Array(16).fill(0);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)r[i+j*4]+=a[i+k*4]*b[k+j*4];return r;}
function transform(m,p){const x=p[0],y=p[1],z=p[2];return [m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14],m[3]*x+m[7]*y+m[11]*z+m[15]];}
const vs=[
 "#version 300 es","precision highp float;",
 "in vec3 aPosition;in vec3 aNormal;in vec3 aColor;in float aProgress;",
 "uniform mat4 uVP;uniform vec3 uOffset;",
 "out vec3 vPos;out vec3 vNormal;out vec3 vColor;out float vProgress;",
 "void main(){vec3 p=aPosition+uOffset;vPos=p;vNormal=aNormal;vColor=aColor;vProgress=aProgress;gl_Position=uVP*vec4(p,1.);}"
].join("\n");
const fs=[
 "#version 300 es","precision highp float;",
 "in vec3 vPos;in vec3 vNormal;in vec3 vColor;in float vProgress;",
 "uniform vec3 uEye;uniform float uVisible;uniform float uGlow;uniform float uAlpha;",
 "out vec4 outColor;",
 "void main(){",
 " if(vProgress>uVisible+.003)discard;",
 " vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.55,.87,.43));",
 " float sun=max(dot(n,light),0.);float shade=.48+sun*.70;",
 " float stripe=.98+.052*sin(vPos.x*3.2+vPos.y*2.1+vPos.z*4.6);",
 " float rim=pow(1.-abs(dot(n,normalize(uEye-vPos))),2.)*.17;",
 " vec3 c=vColor*(shade*stripe+rim)+vColor*uGlow*.28;",
 " float fog=smoothstep(38.,112.,distance(uEye,vPos))*.80;",
 " vec3 sky=mix(vec3(.28,.41,.50),vec3(.61,.67,.72),clamp((vPos.y+15.)/100.,0.,1.));",
 " c=mix(c,sky,fog);outColor=vec4(c,uAlpha);",
 "}"
].join("\n");
function create(canvas,world){
 const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,depth:true,powerPreference:"high-performance"});
 if(!gl)throw Error("WebGL2 is not available in this browser.");
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const uni={};for(const n of ["uVP","uOffset","uEye","uVisible","uGlow","uAlpha"])uni[n]=gl.getUniformLocation(program,n);
 const attrs=["aPosition","aNormal","aColor","aProgress"].map(n=>gl.getAttribLocation(program,n));
 function upload(m){
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(m.v),gl.STATIC_DRAW);
  for(const [i,size,offset] of [[0,3,0],[1,3,12],[2,3,24],[3,1,36]]){
   gl.enableVertexAttribArray(attrs[i]);gl.vertexAttribPointer(attrs[i],size,gl.FLOAT,false,40,offset);}
  gl.bindVertexArray(null);return {vao,buf,count:m.v.length/10};
 }
 function replace(old,m){gl.deleteBuffer(old.buf);gl.deleteVertexArray(old.vao);return upload(m);}
 const scenery=worldMesh(world),sky=upload(scenery.cloud),trees=upload(scenery.solid),
 islands=world.islands.map((p,i)=>upload(islandMesh(p,i,world.seed))),
 bridges=world.spans.map(s=>upload(bridgeMesh(s,world.seed))),
 beacons=world.spans.map((_,i)=>upload(targetMesh(world,i))),
 blooms=[],actor=upload(avatarMesh());
 const tip=upload((()=>{const m=mesh();orb(m,[0,0,0],.30,[.89,.99,.63],5,9);return m;})());
 let pin=upload(pinMesh(world,false)),heart=upload(heartMesh(world,false)),keeper=upload(keeperMesh(world,null));
 let width=0,height=0;
 const camera={yaw:-1.0,pitch:.47,distance:19,eye:[0,0,0],target:[0,0,0],vp:null};
 function resize(){
  const r=Math.min(devicePixelRatio||1,1.55),w=Math.max(1,Math.round(canvas.clientWidth*r)),h=Math.max(1,Math.round(canvas.clientHeight*r));
  if(w!==width||h!==height){canvas.width=w;canvas.height=h;width=w;height=h;gl.viewport(0,0,w,h);}
 }
 function updateCamera(player){
  const t=[player.x,player.y+1.15,player.z],p=camera.pitch;
  const e=[t[0]+Math.sin(camera.yaw)*Math.cos(p)*camera.distance,
           t[1]+Math.sin(p)*camera.distance,
           t[2]+Math.cos(camera.yaw)*Math.cos(p)*camera.distance];
  camera.eye=e;camera.target=t;
  camera.vp=mult(perspective(Math.PI/3,width/height,.12,250),look(e,t));
 }
 function draw(m,visible=1,glow=0,opacity=1,offset=[0,0,0]){
  if(!m||!m.count)return;
  gl.uniform3fv(uni.uOffset,offset);gl.uniform1f(uni.uVisible,visible);gl.uniform1f(uni.uGlow,glow);gl.uniform1f(uni.uAlpha,opacity);
  gl.bindVertexArray(m.vao);gl.drawArrays(gl.TRIANGLES,0,m.count);
 }
 function frame(time,player,state,growth){
  resize();updateCamera(player);gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.useProgram(program);
  gl.uniformMatrix4fv(uni.uVP,false,new Float32Array(camera.vp));gl.uniform3fv(uni.uEye,camera.eye);
  draw(trees);for(const m of islands)draw(m);draw(pin,1,.30);draw(heart,1,state.heart?.44+.24*Math.sin(time*1.5):.12);draw(keeper,1,.25);
  for(let i=0;i<4;i++){
   if(state.spans[i]){
    draw(bridges[i],growth[i]??1,.17);
    if((growth[i]??1)<.998){const p=bridgePoint(world.spans[i],growth[i]);draw(tip,1,1,1,p);}
   }else if(state.current===i)draw(beacons[i],1,.62+.18*Math.sin(time*1.6));
  }
  for(const m of blooms)draw(m,1,.40);
  const bob=player.moving?.05*Math.sin(time*9):0;
  draw(actor,1,.16,1,[player.x,player.y+bob,player.z]);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);draw(sky,1,.15,.15);gl.depthMask(true);gl.disable(gl.BLEND);
 }
 function project(p){
  if(!camera.vp)return null;
  const o=transform(camera.vp,p);if(o[3]<=.01)return null;
  const x=o[0]/o[3],y=o[1]/o[3];
  return {x:(x*.5+.5)*canvas.clientWidth,y:(1-(y*.5+.5))*canvas.clientHeight,visible:Math.abs(x)<1.3&&Math.abs(y)<1.3};
 }
 return {gl,camera,frame,project,bridgePoint,resize,
  addBloom:(id,n)=>blooms.push(upload(bloomMesh(world,id,n))),
  updatePin:rooted=>{pin=replace(pin,pinMesh(world,rooted));},
  updateHeart:awake=>{heart=replace(heart,heartMesh(world,awake));},
  updateKeeper:ending=>{keeper=replace(keeper,keeperMesh(world,ending));}
 };
}
root.BeanRender={create,bridgePoint};
})(typeof globalThis!=="undefined"?globalThis:this);
