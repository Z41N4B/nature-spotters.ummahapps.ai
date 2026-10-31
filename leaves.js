/* Leaf sketches and a leaf finder for common trees and bushes in England.
   Each sketch is drawn from a few numbers (shape, lobes, teeth, veins), so the leaves share one pencil style. */
(function(){
"use strict";

/* ---------- sketch engine ---------- */
function frac(x){return x-Math.floor(x)}
function simpleSides(o){
  var a=o.a||1,b=o.b||1,W=o.w||.35,N=o.N||150,am=a/(a+b),tmax=Math.pow(am,a)*Math.pow(1-am,b);
  function side(s){
    var pts=[],ws=W*(1+(o.lop||0)*s*.5);
    for(var i=0;i<=N;i++){
      var t=i/N,f;
      if(o.tri)f=t<o.tri?Math.sin(t/o.tri*Math.PI/2):Math.pow((1-t)/(1-o.tri),o.triB||1);
      else f=Math.pow(t,a)*Math.pow(1-t,b)/tmax;
      if(o.cusp&&t>1-o.cusp)f*=Math.pow((1-t)/o.cusp,.6)*.5+.5*((1-t)/o.cusp);
      var w=ws*f;
      if(o.ln){var g=Math.pow(Math.abs(Math.sin(o.ln*Math.PI*t+(o.lph||0))),o.lp||.6);w*=1-o.ld*(1-g)*Math.min(1,t/(o.lfade||.01))}
      var env=Math.min(1,f*2.5);
      if(o.td)w+=o.td*W*Math.pow(frac(o.tn*t+(o.tph||0)),o.tp||1)*env;
      if(o.td2)w+=o.td2*W*frac(o.tn*3*t)*env;
      if(o.wv)w*=1+o.wv*Math.sin(o.wn*Math.PI*2*t);
      var y=-t;
      if(o.heart)y+=o.heart*W*Math.pow(Math.max(0,1-t/.25),2);
      if(o.lopY&&s>0)y+=o.lopY*Math.pow(1-t,6);
      if(o.notch&&t>.86)y+=o.notch*(t-.86)/.14;
      pts.push([s*Math.max(0,w),y]);
    }
    return pts;
  }
  return [side(-1),side(1)];
}
function T(pts,cx,cy,S,deg){
  var r=(deg||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  return pts.map(function(p){return [cx+(p[0]*c-p[1]*s)*S,cy+(p[0]*s+p[1]*c)*S]});
}
function D(pts,close){return "M"+pts.map(function(p){return p[0].toFixed(1)+" "+p[1].toFixed(1)}).join("L")+(close?"Z":"")}
function Board(){this.f=[];this.v=[];this.n=[];this.x0=1e9;this.y0=1e9;this.x1=-1e9;this.y1=-1e9}
Board.prototype.box=function(pts){var me=this;pts.forEach(function(p){if(p[0]<me.x0)me.x0=p[0];if(p[0]>me.x1)me.x1=p[0];if(p[1]<me.y0)me.y0=p[1];if(p[1]>me.y1)me.y1=p[1]})};
Board.prototype.fill=function(pts){this.box(pts);this.f.push(D(pts,true))};
Board.prototype.vein=function(pts){this.box(pts);this.v.push(D(pts))};
Board.prototype.line=function(pts,w,kind){this.box(pts);this.n.push([D(pts),w||1.6,kind||"stem"])};

function addSimple(bd,o,cx,cy,S,deg){
  var sd=simpleSides(o),L=sd[0],R=sd[1],N=L.length-1;
  bd.fill(T(L.concat(R.slice().reverse()),cx,cy,S,deg));
  var tipY=L[N][1];
  bd.vein(T([[0,0],[0,tipY*.96]],cx,cy,S,deg));
  var nv=o.nv==null?6:o.nv;
  for(var k=1;k<=nv;k++){
    var t=k/(nv+1)*.9,j=Math.min(N,Math.round((t+(o.va||.1))*N));
    [L,R].forEach(function(side){var p=side[j],st=[0,-t],m=[p[0]*.5,(st[1]+p[1])/2-.015];bd.vein(T([st,m,[p[0]*.86,p[1]+.01]],cx,cy,S,deg))});
  }
  if(o.pet)bd.line(T([[0,0],[0,o.pet]],cx,cy,S,deg),1.8);
}
function addPalm(bd,o,cx,cy,S){
  var pts=[],N=420;
  for(var i=1;i<N;i++){
    var th=-Math.PI+2*Math.PI*i/N,r=o.c||.2;
    o.lobes.forEach(function(L){[1,-1].forEach(function(sg){
      if(L[0]===0&&sg<0)return;
      var x=(th-sg*L[0]*Math.PI/180)/L[2],bmp=o.round?Math.exp(-x*x*1.6):Math.pow(Math.max(0,1-Math.abs(x)),o.lp||1);
      r=Math.max(r,L[1]*bmp);
    })});
    if(o.td)r*=1+o.td*Math.pow(frac(o.tn*Math.abs(th)/Math.PI*(o.lobes.length*2-1)),o.tp||1)*Math.min(1,(r-(o.c||.2))*4);
    r*=Math.min(1,(Math.PI-Math.abs(th))/(o.sinus||.3));
    pts.push([r*Math.sin(th),-r*Math.cos(th)]);
  }
  bd.fill(T(pts,cx,cy,S,0));
  o.lobes.forEach(function(L){[1,-1].forEach(function(sg){
    if(L[0]===0&&sg<0)return;var a=sg*L[0]*Math.PI/180,l=L[1]*.88;
    bd.vein(T([[0,0],[Math.sin(a)*l,-Math.cos(a)*l]],cx,cy,S,0));
    for(var k=1;k<=2;k++){var q=l*k/3.2;[1,-1].forEach(function(z){var b=a+z*.5;bd.vein(T([[Math.sin(a)*q,-Math.cos(a)*q],[Math.sin(a)*q+Math.sin(b)*l*.22,-Math.cos(a)*q-Math.cos(b)*l*.22]],cx,cy,S,0))})}
  })});
  bd.line(T([[0,0],[0,o.pet||.6]],cx,cy,S,0),2);
}
function addFan(bd,o,cx,cy,S){
  var pts=[[0,0]];
  for(var i=0;i<=80;i++){var th=-1.1+2.2*i/80,r=1-.38*Math.exp(-Math.pow(th/.09,2))+.025*Math.sin(th*26);pts.push([r*Math.sin(th),-r*Math.cos(th)])}
  bd.fill(T(pts,cx,cy,S,0));
  for(var k=0;k<=12;k++){var a=-1+2*k/12;bd.vein(T([[0,0],[Math.sin(a)*.92,-Math.cos(a)*.92]],cx,cy,S,0))}
  bd.line(T([[0,0],[0,.7]],cx,cy,S,0),2);
}
function addPinnate(bd,o,cx,cy,S){
  var n=o.pairs,len=o.len||1,st=o.start||.12;
  bd.line(T([[0,o.pet||.15],[0,-len]],cx,cy,S,0),1.6);
  for(var i=0;i<n;i++){
    var t=st+i*(1-st-.1)/Math.max(1,n-1),sc=o.leaf.s*(o.grow?(1-o.grow+o.grow*i/Math.max(1,n-1)):1);
    [-1,1].forEach(function(sg){addSimple(bd,o.leaf,cx,cy-t*len*S,S*sc,sg*(o.ang||70))});
  }
  addSimple(bd,o.leaf,cx,cy-len*S,S*o.leaf.s*(o.termS||1),0);
}
function addHand(bd,o,cx,cy,S){
  bd.line(T([[0,0],[0,o.pet||.6]],cx,cy,S,0),2);
  for(var i=0;i<o.n;i++){
    var ang=-o.spread+2*o.spread*i/(o.n-1),sc=1-o.shrink*Math.pow(Math.abs(ang)/o.spread,2);
    var g=(o.gap||0)*S,r=ang*Math.PI/180;bd.line([[cx,cy],[cx+Math.sin(r)*g,cy-Math.cos(r)*g]],1.4);addSimple(bd,o.leaf,cx+Math.sin(r)*g,cy-Math.cos(r)*g,S*o.leaf.s*sc,ang);
  }
}
function twig(bd,cx,cy,S,len){bd.line(T([[0,len/2],[0,-len/2]],cx,cy,S,0),2.4)}
function addPine(bd,o,cx,cy,S){
  twig(bd,cx,cy,S,1.1);
  for(var k=0;k<9;k++){
    var y=.45-k*.11,side=k%2?1:-1,a0=side*(35+(k*13)%20);
    [-9,9].forEach(function(d){var a=(a0+d)*Math.PI/180,l=.62-k*.02,bend=side*.06;
      bd.line(T([[0,y],[Math.sin(a)*l*.5+bend,y-Math.cos(a)*l*.5],[Math.sin(a)*l+bend*.5,y-Math.cos(a)*l]],cx,cy,S,0),1.5,"needle")});
  }
}
function addYew(bd,o,cx,cy,S){
  twig(bd,cx,cy,S,1.2);
  var nd={w:.11,a:.6,b:.45,nv:0};
  for(var k=0;k<13;k++){var y=.5-k*.08;[-1,1].forEach(function(sg){addSimple(bd,nd,cx,cy+y*S,S*(.3-k*.006),sg*(78-k*2))})}
  addSimple(bd,nd,cx,cy-.58*S,S*.22,0);
}
function addSpruce(bd,o,cx,cy,S){
  twig(bd,cx,cy,S,1.2);
  for(var k=0;k<26;k++){var y=.52-k*.042,sg=k%2?1:-1,a=sg*(48+(k*17)%28)*Math.PI/180,l=.17;
    bd.line(T([[0,y],[Math.sin(a)*l,y-Math.cos(a)*l]],cx,cy,S,0),1.4,"needle")}
  for(var j=0;j<10;j++){var yy=.45-j*.1,aa=((j%3)-1)*.35;bd.line(T([[0,yy],[Math.sin(aa)*.09,yy-.09]],cx,cy,S,0),1.3,"needle")}
}
function addLarch(bd,o,cx,cy,S){
  bd.line(T([[-.05,.6],[0,0],[.04,-.6]],cx,cy,S,0),2.4);
  [[-.02,.38,-1],[.0,.05,1],[.03,-.3,-1],[.04,-.58,1]].forEach(function(p){
    var dir=p[2]*60;
    for(var k=0;k<15;k++){var a=(dir-70+140*k/14)*Math.PI/180,l=.3+.04*Math.sin(k*1.7);
      bd.line(T([[p[0],p[1]],[p[0]+Math.sin(a)*l,p[1]-Math.cos(a)*l]],cx,cy,S,0),1.2,"needle")}
  });
}
function addCypress(bd,o,cx,cy,S){
  var sc={w:.13,a:.8,b:.8,td:.45,tn:9,tp:1.2,nv:0};
  bd.line(T([[0,.65],[0,-.6]],cx,cy,S,0),2);
  for(var k=0;k<6;k++){var y=.45-k*.19,sg=k%2?1:-1,l=.62-k*.07;
    addSimple(bd,sc,cx,cy+y*S,S*l,sg*48);
    addSimple(bd,sc,cx+sg*Math.sin(48*Math.PI/180)*l*.45*S,cy+(y-Math.cos(48*Math.PI/180)*l*.45)*S,S*l*.4,sg*95);
  }
  addSimple(bd,sc,cx,cy-.6*S,S*.4,0);
}
var DRAW={s:addSimple,p:addPalm,fan:addFan,pn:addPinnate,h:addHand,pine:addPine,yew:addYew,spruce:addSpruce,larch:addLarch,cypress:addCypress};
/* ---------- pencil look ----------
   Graphite outline and veins, coloured-pencil hatching inside, all roughened by two shared SVG filters. */
var GRAPHITE="#47433D",STEM="#8A5A34";
var PENCIL={
 oak:["#8DB255","#4E6E2A"],beech:["#9ACB5B","#4C7A2A"],hornbeam:["#8CC45E","#46792D"],birch:["#9CD067","#4F8A2E"],
 holly:["#3F7A45","#1F4A2A"],ivy:["#4E7F45","#27482A"],laurel:["#4F8D4A","#285A2B"],privet:["#5F9750","#2F5E2C"],
 yew:["#3D6B3F","#24452A"],pine:["#6F9E7A","#2F5C44"],spruce:["#5E8F5A","#2E5530"],larch:["#A8CF6A","#5E8A33"],leyland:["#6B9A4E","#355E2A"],
 whitebeam:["#A9C59A","#5F7D55"],willow:["#A3C28A","#5D7F4B"],goatwillow:["#94B07A","#55703F"],buddleia:["#8FAE80","#4E6B47"],
 ginkgo:["#D3D45A","#93942A"],fieldmaple:["#B3CC5A","#6E8A2C"],norwaymaple:["#7FC25E","#3D7A2F"],sycamore:["#86B95A","#45742C"],
 plane:["#8FBF63","#4E7D33"],hawthorn:["#7DB85A","#3F7230"],elder:["#86B860","#45722F"],rose:["#7FB55C","#3E6E2E"],
 bramble:["#78A957","#3B652C"],chestnut:["#93C35E","#4B7A2C"],lime:["#9BCB66","#52832F"],poplar:["#8FC46A","#477C33"]
};
var DEFAULT_PENCIL=["#88BE5E","#43762F"];
function rnd(seed){var r=seed;return function(){r=(r*9301+49297)%233280;return r/233280}}
function hatch(x0,y0,w,h,deg,step,seed){
  var a=deg*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,cx=x0+w/2,cy=y0+h/2,R=Math.sqrt(w*w+h*h)/2,out=[[],[],[]],rn=rnd(seed);
  for(var o=-R;o<=R;o+=step){
    var t=-R+rn()*R*.15;
    while(t<R){
      var len=R*(.25+rn()*.45),j=(rn()-.5)*step*.7,px=cx+nx*(o+j),py=cy+ny*(o+j),bow=(rn()-.5)*step*.8;
      var x1=px+dx*t,y1=py+dy*t,x2=px+dx*(t+len),y2=py+dy*(t+len),mx=(x1+x2)/2+nx*bow,my=(y1+y2)/2+ny*bow;
      out[Math.floor(rn()*3)].push("M"+x1.toFixed(1)+" "+y1.toFixed(1)+"Q"+mx.toFixed(1)+" "+my.toFixed(1)+" "+x2.toFixed(1)+" "+y2.toFixed(1));
      t+=len+R*(rn()*.08);
    }
  }
  return out.map(function(b){return b.join("")});
}
function seedOf(id){var h=7;for(var i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))%233280;return h}
/* filters are shared by every sketch on the page, so they live in one hidden svg */
function ensureDefs(){
  if(document.getElementById("ns-pencil-defs"))return;
  var d=document.createElement("div");
  d.innerHTML='<svg id="ns-pencil-defs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><defs>'
   +'<filter id="ns-pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="4" result="w"/>'
   +'<feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>'
   +'<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.75" result="ga"/>'
   +'<feComposite in="d" in2="ga" operator="in"/></filter>'
   +'<filter id="ns-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="2" result="g"/>'
   +'<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.6" result="ga"/><feComposite in="SourceGraphic" in2="ga" operator="in"/></filter>'
   +'</defs></svg>';
  (document.body||document.documentElement).appendChild(d.firstChild);
}
var cache={};
function sketch(sp){
  if(!sp)return "";
  if(cache[sp.id])return cache[sp.id];
  ensureDefs();
  var bd=new Board(),o=sp.sk;DRAW[o.t](bd,o,0,0,100,0);
  var p=8,w=bd.x1-bd.x0,h=bd.y1-bd.y0,big=Math.max(w,h),vb=[(bd.x0-p),(bd.y0-p),(w+2*p),(h+2*p)].map(function(v){return v.toFixed(1)}).join(" ");
  var col=PENCIL[sp.id]||DEFAULT_PENCIL,seed=seedOf(sp.id),cid="nslc-"+sp.id,mid="nslm-"+sp.id,fills=bd.f.join("");
  var strokes=function(b,c,wd,ops){return b.map(function(d,i){return d?line(d,c,wd,ops[i]):""}).join("")};
  var stems=bd.n.filter(function(x){return x[2]==="stem"}),needles=bd.n.filter(function(x){return x[2]==="needle"});
  var line=function(d,c,wd,op){return '<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+wd+'"'+(op<1?' opacity="'+op+'"':"")+'/>'};
  var s='<svg class="lf" viewBox="'+vb+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
  if(fills){
    s+='<defs><clipPath id="'+cid+'"><path d="'+fills+'"/></clipPath>'
      +'<linearGradient id="'+mid+'g" x1="0" y1="0" x2="1" y2=".35"><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>'
      +'<mask id="'+mid+'" maskUnits="userSpaceOnUse" x="'+(bd.x0-p)+'" y="'+(bd.y0-p)+'" width="'+(w+2*p)+'" height="'+(h+2*p)+'"><rect x="'+(bd.x0-p)+'" y="'+(bd.y0-p)+'" width="'+(w+2*p)+'" height="'+(h+2*p)+'" fill="url(#'+mid+'g)"/></mask></defs>'
      +'<g clip-path="url(#'+cid+')"><path d="'+fills+'" fill="'+col[0]+'" opacity=".38" filter="url(#ns-grain)"/>'
      +'<g filter="url(#ns-pencil)">'+strokes(hatch(bd.x0,bd.y0,w,h,38,big/58,seed),col[0],1.3,[.45,.7,.95])
      +'<g mask="url(#'+mid+')">'+strokes(hatch(bd.x0,bd.y0,w,h,44,big/50,seed+1),col[1],1.3,[.5,.75,1])+'</g></g></g>';
  }
  s+='<g filter="url(#ns-pencil)">'
    +needles.map(function(x){return line(x[0],col[0],x[1]+1.4,.7)+line(x[0],col[1],x[1]*.8,1)}).join("")
    +stems.map(function(x){return line(x[0],STEM,x[1],.9)}).join("")
    +(bd.v.length?line(bd.v.join(""),col[1],.8,.85):"")
    +(fills?'<path d="'+fills+'" fill="none" stroke="'+GRAPHITE+'" stroke-width=".9" opacity=".4" transform="translate(1.4 .9)"/>'+line(fills,GRAPHITE,1.6,.95):"")
    +'</g></svg>';
  return cache[sp.id]=s;
}

/* ---------- the leaves ----------
   k: answers for the leaf finder. kind: tree, bush or conifer. */
var LEAVES=[
 {id:"oak",name:"Oak",latin:"Quercus robur",kind:"tree",k:{type:"broad",parts:"single",lobes:"side",edge:["smooth"]},
  sk:{t:"s",w:.36,a:.5,b:.55,ln:4.4,ld:.45,lp:.8,lph:.35,heart:.22,nv:5,va:.07,pet:.05},
  look:"Wavy, rounded lobes down each side, a very short stalk and two little ear-shaped lobes at the base.",
  find:"Acorns sitting in little cups, in autumn.",where:"Woods, parks, fields and hedges.",fact:"An oak can live for over 1,000 years and is home to more kinds of insect than any other British tree."},
 {id:"hawthorn",alias:["may tree"],name:"Hawthorn",latin:"Crataegus monogyna",kind:"bush",k:{type:"broad",parts:"single",lobes:"side",edge:["smooth","toothed"],thorns:"yes"},
  sk:{t:"p",c:.3,lobes:[[0,1,.52],[40,.88,.48],[80,.64,.42]],lp:.5,td:.07,tn:4,tp:1.5,sinus:1.5,pet:.35},
  look:"Small leaves cut deeply into 3 to 7 lobes, on twigs with sharp thorns.",
  find:"White 'may' blossom in May, then dark red berries called haws.",where:"Hedges everywhere, and the edges of parks.",fact:"Most of England's old hedges are made mainly of hawthorn."},
 {id:"sycamore",name:"Sycamore",latin:"Acer pseudoplatanus",kind:"tree",k:{type:"broad",parts:"single",lobes:"hand",edge:["toothed"]},
  sk:{t:"p",c:.4,lobes:[[0,1,.62],[54,.95,.6],[112,.6,.5]],lp:.75,td:.07,tn:5,sinus:.45,pet:.85},
  look:"Big leaf with five lobes and rough, uneven teeth. The long stalk is often red.",
  find:"Pairs of 'helicopter' seeds joined in a V. Leaves often have black spots in late summer.",where:"Parks, streets, woods and gardens.",fact:"Its helicopter seeds can spin far away from the tree on the wind."},
 {id:"fieldmaple",alias:["maple"],name:"Field maple",latin:"Acer campestre",kind:"tree",k:{type:"broad",parts:"single",lobes:"hand",edge:["smooth"]},
  sk:{t:"p",c:.42,round:1,lobes:[[0,.92,.5],[60,.86,.46],[115,.56,.4]],sinus:.55,pet:.65},
  look:"Small leaf with 3 to 5 rounded lobes and no teeth.",
  find:"Helicopter seeds that stick out in a straight line.",where:"Hedges and woodland edges.",fact:"Its leaves turn a bright butter yellow in autumn."},
 {id:"norwaymaple",name:"Norway maple",latin:"Acer platanoides",kind:"tree",k:{type:"broad",parts:"single",lobes:"hand",edge:["toothed"]},
  sk:{t:"p",c:.48,lobes:[[0,1,.72],[56,.96,.7],[114,.62,.55]],lp:1.15,td:.12,tn:3,tp:3,sinus:.55,pet:.95},
  look:"Five lobes ending in long, fine points. Thinner and shinier than a sycamore leaf.",
  find:"Snap the stalk and you will see a drop of milky sap. Helicopter seeds spread wide apart.",where:"Streets, parks and gardens.",fact:"In autumn it can turn yellow, orange and red all on one tree."},
 {id:"plane",alias:["plane","plane tree"],name:"London plane",latin:"Platanus × acerifolia",kind:"tree",k:{type:"broad",parts:"single",lobes:"hand",edge:["toothed","smooth"]},
  sk:{t:"p",c:.38,lobes:[[0,1,.66],[58,.95,.62],[118,.5,.5]],lp:.85,td:.06,tn:2,tp:2,sinus:.2,pet:.6},
  look:"Big, star-like leaf with 3 to 5 pointed lobes and a few large teeth.",
  find:"Spiky seed balls dangling on strings, and patchy bark that flakes off like camouflage.",where:"City streets and squares, especially in London.",fact:"Shedding its bark helps it cope with dirty city air."},
 {id:"ivy",label:"Climber",name:"Ivy",latin:"Hedera helix",kind:"bush",k:{type:"broad",parts:"single",lobes:"hand",edge:["smooth"]},
  sk:{t:"p",c:.58,lobes:[[0,1,.85],[64,.82,.75],[122,.62,.6]],lp:.8,sinus:.6,pet:.9},
  look:"Dark, glossy leaf with 3 to 5 pointed lobes, on a stem that climbs walls and trees.",
  find:"Round flower heads in autumn, then black berries in winter.",where:"Walls, fences, tree trunks and woodland floors.",fact:"Its autumn flowers are a last feast for bees and butterflies before winter."},
 {id:"ginkgo",name:"Ginkgo",latin:"Ginkgo biloba",kind:"tree",k:{type:"broad",parts:"single",lobes:"fan",edge:["smooth"]},
  sk:{t:"fan"},
  look:"A fan-shaped leaf, often with a split in the middle. The veins spread out like a fan.",
  find:"Leaves turn gold in autumn and often all fall within a few days.",where:"Streets, parks and botanic gardens.",fact:"Ginkgo trees grew when dinosaurs were alive. They are called living fossils."},
 {id:"beech",name:"Beech",latin:"Fagus sylvatica",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["smooth"],shape:["oval"]},
  sk:{t:"s",w:.32,a:.9,b:.8,wv:.045,wn:7.5,nv:7,va:.07,pet:.08},
  look:"Shiny oval leaf with a wavy edge and no teeth. Young leaves have silky hairs along the edge.",
  find:"Beech nuts in prickly husks, and smooth grey bark.",where:"Woods, parks and tall garden hedges.",fact:"Beech hedges keep their crispy brown leaves all winter."},
 {id:"hornbeam",name:"Hornbeam",latin:"Carpinus betulus",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["oval"],teeth:"double"},
  sk:{t:"s",w:.28,a:.8,b:1.1,td:.06,tn:22,td2:.03,nv:12,va:.06,pet:.07},
  look:"Like a beech leaf but with lots of tiny double teeth and deep, ridged veins.",
  find:"Seeds hanging in bunches, each with a papery three-pointed wing.",where:"Woods, parks and hedges.",fact:"Its wood is so hard it was used to make cogs for windmills."},
 {id:"birch",alias:["birch"],name:"Silver birch",latin:"Betula pendula",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["triangle"],teeth:"double",size:["small","big"]},
  sk:{t:"s",w:.38,tri:.24,triB:1.25,td:.08,tn:12,td2:.035,nv:6,va:.08,pet:.24},
  look:"Small triangle or diamond-shaped leaf with double teeth and a long point.",
  find:"White, papery bark with black marks, and dangling catkins in spring.",where:"Heaths, woods, parks and gardens.",fact:"Birch is one of the first trees to grow on empty ground."},
 {id:"poplar",name:"Poplar",latin:"Populus",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["triangle","round"]},
  sk:{t:"s",w:.5,tri:.3,triB:1.1,td:.04,tn:18,nv:5,va:.1,pet:.5},
  look:"Triangle or diamond shape with small rounded teeth and a long stalk.",
  find:"Many poplars have flat stalks, so the leaves flutter and rustle in the slightest wind.",where:"Riversides, parks and along roads.",fact:"Poplars are some of the fastest-growing trees in Britain."},
 {id:"hazel",name:"Hazel",latin:"Corylus avellana",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["round"],teeth:"double"},
  sk:{t:"s",w:.48,a:.45,b:.5,heart:.35,td:.07,tn:14,td2:.04,cusp:.08,nv:6,va:.1,pet:.1},
  look:"Round, soft and hairy, with a heart-shaped base, double teeth and a short point.",
  find:"Yellow 'lambs' tail' catkins in late winter, and hazelnuts in autumn.",where:"Hedges and woodland.",fact:"Squirrels and dormice love hazelnuts. Look for nibbled shells on the ground."},
 {id:"alder",name:"Alder",latin:"Alnus glutinosa",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["round"],tip:"dent"},
  sk:{t:"s",w:.46,a:.7,b:.3,notch:.1,td:.05,tn:12,nv:6,va:.08,pet:.16},
  look:"Round leaf with a dent at the tip instead of a point.",
  find:"Tiny woody 'cones' that stay on the tree all winter.",where:"Beside rivers, streams and ponds.",fact:"Alder wood does not rot in water, so it was used for bridges and canal posts."},
 {id:"lime",alias:["linden","lime tree"],name:"Lime",latin:"Tilia × europaea",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["round"],base:"lopsided"},
  sk:{t:"s",w:.46,a:.4,b:1,heart:.45,lop:.18,lopY:.06,td:.05,tn:22,nv:5,va:.12,pet:.28},
  look:"Heart-shaped with a lopsided base, fine teeth and a pointed tip.",
  find:"Sweet-smelling flowers in July, and seeds hanging under a long, leafy wing.",where:"Avenues, streets and parks.",fact:"Aphids on lime trees drip sticky honeydew onto cars parked below."},
 {id:"chestnut",alias:["chestnut tree"],name:"Sweet chestnut",latin:"Castanea sativa",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["narrow"]},
  sk:{t:"s",w:.2,a:1,b:1,td:.35,tn:16,tp:2.5,nv:15,va:.04,pet:.08},
  look:"Long leaf with big, spiky teeth and straight veins, one to each tooth.",
  find:"Very spiny cases with shiny brown chestnuts inside. Old trees have twisty, spiral bark.",where:"Woods and large parks.",fact:"These are the chestnuts people roast. Conkers come from a different tree."},
 {id:"elm",name:"Elm",latin:"Ulmus procera",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["oval"],base:"lopsided",teeth:"double"},
  sk:{t:"s",w:.33,a:.7,b:1,lop:.25,lopY:.08,td:.08,tn:16,td2:.04,nv:12,va:.06,pet:.04},
  look:"Feels rough like sandpaper, with double teeth and a lopsided base.",
  find:"Round, papery seeds with the seed in the middle.",where:"Mostly young trees in hedges now.",fact:"Most big elms died of Dutch elm disease, but young ones still grow in hedges."},
 {id:"cherry",alias:["cherry","cherry tree"],name:"Wild cherry",latin:"Prunus avium",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["oval"]},
  sk:{t:"s",w:.27,a:1.2,b:.9,td:.05,tn:24,cusp:.1,nv:8,va:.08,pet:.22},
  look:"Drooping oval leaf with a pointed tip and teeth. Look for two tiny red bumps on the stalk.",
  find:"White blossom in April, and shiny red-brown bark with stripes across it.",where:"Woodland edges, parks and streets.",fact:"Birds eat the cherries and spread the stones far and wide."},
 {id:"whitebeam",name:"Whitebeam",latin:"Sorbus aria",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["oval"],under:"white",teeth:"double"},
  sk:{t:"s",w:.33,a:1.1,b:.8,td:.06,tn:20,td2:.03,nv:9,va:.06,pet:.12},
  look:"Oval and toothed, bright white and furry underneath. Turn it over!",
  find:"Bunches of red berries in autumn.",where:"Streets, car parks and chalk hills.",fact:"When the wind blows, the trees flash silver as the leaves flip over."},
 {id:"willow",alias:["willow","weeping willow"],name:"White willow",latin:"Salix alba",kind:"tree",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["narrow"],under:"white"},
  sk:{t:"s",w:.11,a:1,b:1.2,td:.08,tn:30,nv:10,va:.05,pet:.05},
  look:"Long and narrow with tiny teeth, silvery and silky underneath.",
  find:"Catkins in spring, and branches that often hang down towards water.",where:"Riversides, ponds and wet ground.",fact:"Willow bark was used to make the first aspirin."},
 {id:"goatwillow",alias:["pussy willow"],name:"Goat willow",latin:"Salix caprea",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["smooth","toothed"],shape:["oval","round"],under:"white"},
  sk:{t:"s",w:.36,a:.9,b:.7,wv:.03,wn:9,cusp:.06,nv:7,va:.08,pet:.1},
  look:"Wide oval leaf, wrinkly on top and grey and woolly underneath. The tip often twists to one side.",
  find:"Fluffy grey 'pussy willow' catkins in early spring.",where:"Damp woods, hedges and wasteland.",fact:"Its early catkins are one of the first foods for bees each year."},
 {id:"blackthorn",name:"Blackthorn",latin:"Prunus spinosa",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["oval"],size:"small",thorns:"yes"},
  sk:{t:"s",w:.27,a:1.4,b:.8,td:.05,tn:20,nv:5,va:.1,pet:.08},
  look:"Small, dull oval leaf with fine teeth, on dark twigs with long thorns.",
  find:"White blossom in March before the leaves, then blue-black sloes in autumn.",where:"Hedges and scrub.",fact:"It flowers so early that a cold snap in March is called a 'blackthorn winter'."},
 {id:"dogwood",name:"Dogwood",latin:"Cornus sanguinea",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["smooth"],shape:["oval"],veins:"curve"},
  sk:{t:"s",w:.3,a:1,b:1.1,nv:4,va:.36,pet:.1},
  look:"Smooth oval leaf whose veins curve round to follow the edge towards the tip.",
  find:"Gently pull a leaf in half: thin white threads hold the two halves together.",where:"Hedges, parks and chalky scrub.",fact:"Its twigs turn deep red in autumn and winter."},
 {id:"privet",name:"Privet",latin:"Ligustrum",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["smooth"],shape:["oval","narrow"],tough:"yes",veins:["straight","curve"],size:"small"},
  sk:{t:"s",w:.2,a:1,b:1,nv:5,va:.1,pet:.05},
  look:"Small, smooth, glossy oval leaves growing in pairs opposite each other.",
  find:"Creamy flowers with a strong smell in summer, then black berries. Do not eat them.",where:"Garden hedges all over towns.",fact:"Privet keeps most of its leaves in winter, which is why it is popular for hedges."},
 {id:"laurel",name:"Cherry laurel",latin:"Prunus laurocerasus",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["smooth","toothed"],shape:["oval"],tough:"yes"},
  sk:{t:"s",w:.24,a:1,b:.9,td:.015,tn:12,nv:9,va:.08,pet:.08},
  look:"Large, tough, very shiny leaves, often with a few tiny teeth.",
  find:"Upright spikes of white flowers in spring, then shiny black berries.",where:"Gardens, hedges and woods.",fact:"Every part is poisonous. Look and photograph, but never eat it."},
 {id:"buddleia",name:"Buddleia",latin:"Buddleja davidii",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["toothed"],shape:["narrow"],under:"white"},
  sk:{t:"s",w:.15,a:1,b:1.3,td:.04,tn:28,nv:12,va:.05,pet:.04},
  look:"Long, pointed leaf, dark on top and soft and grey-white underneath.",
  find:"Long purple flower spikes covered in butterflies in summer.",where:"Railways, walls, wasteland and gardens.",fact:"It is called the butterfly bush, and it can grow out of cracks in walls."},
 {id:"holly",alias:["holly berries"],name:"Holly",latin:"Ilex aquifolium",kind:"bush",k:{type:"broad",parts:"single",lobes:"none",edge:["spiny","smooth"],shape:["oval"],tough:"yes"},
  sk:{t:"s",w:.3,a:1,b:.9,td:.55,tn:4.5,tp:3,wv:.06,wn:4.5,nv:0,pet:.06},
  look:"Dark, glossy, leathery leaf with sharp spines. Leaves high up may be smooth.",
  find:"Red berries in winter, but only on female trees. They are poisonous to people.",where:"Woods, hedges, parks and gardens.",fact:"Holly stays green all winter and gives birds shelter from the cold."},
 {id:"horsechestnut",alias:["conker tree"],name:"Horse chestnut",latin:"Aesculus hippocastanum",kind:"tree",k:{type:"broad",parts:"leaflets",arr:"hand",count:["few"],edge:["toothed"]},
  sk:{t:"h",n:7,spread:105,shrink:.45,gap:.07,pet:.75,leaf:{s:1,w:.22,a:1.6,b:.6,td:.05,tn:20,td2:.02,nv:12,va:.06,pet:.02}},
  look:"5 to 7 big leaflets spread out like a hand, each widest near its tip.",
  find:"Conkers in spiky green cases in autumn, and sticky buds in spring.",where:"Parks, village greens and streets.",fact:"The marks left on twigs where leaves fall look like tiny horseshoes."},
 {id:"bramble",alias:["blackberry","blackberries"],name:"Bramble",latin:"Rubus fruticosus",kind:"bush",k:{type:"broad",parts:"leaflets",arr:"hand",count:["few"],edge:["toothed"],thorns:"yes"},
  sk:{t:"h",n:5,spread:88,shrink:.3,gap:.12,pet:.6,leaf:{s:.7,w:.27,a:.8,b:1,td:.09,tn:18,td2:.04,nv:7,va:.08,pet:.15}},
  look:"3 to 5 toothed leaflets on a prickly stalk. Watch your fingers!",
  find:"White or pink flowers, then blackberries in late summer.",where:"Hedges, woods, parks and wasteland.",fact:"Blackberry flowers feed bees, and the berries feed birds, foxes and people."},
 {id:"ash",name:"Ash",latin:"Fraxinus excelsior",kind:"tree",k:{type:"broad",parts:"leaflets",arr:"feather",count:["many"],edge:["toothed"]},
  sk:{t:"pn",pairs:5,len:1.35,ang:62,pet:.2,leaf:{s:.42,w:.24,a:.9,b:1.15,td:.06,tn:14,nv:5,va:.08,pet:.02}},
  look:"7 to 13 pointed, toothed leaflets in pairs, with one at the end.",
  find:"Bunches of winged seeds called keys, and black buds in winter.",where:"Woods, hedges and parks.",fact:"Many ash trees are sick with ash dieback, so every healthy one is precious."},
 {id:"rowan",alias:["mountain ash"],name:"Rowan",latin:"Sorbus aucuparia",kind:"tree",k:{type:"broad",parts:"leaflets",arr:"feather",count:["many"],edge:["toothed"]},
  sk:{t:"pn",pairs:7,len:1.4,ang:76,leaf:{s:.33,w:.22,a:1,b:.9,td:.09,tn:14,nv:4,va:.08,pet:0}},
  look:"11 to 15 narrow, toothed leaflets in neat pairs.",
  find:"Bunches of bright orange-red berries in late summer.",where:"Streets, gardens, hills and woods.",fact:"Also called mountain ash. Thrushes and blackbirds gobble its berries."},
 {id:"walnut",name:"Walnut",latin:"Juglans regia",kind:"tree",k:{type:"broad",parts:"leaflets",arr:"feather",count:["few","many"],edge:["smooth"]},
  sk:{t:"pn",pairs:3,len:1.1,ang:58,termS:1.25,grow:.3,leaf:{s:.5,w:.3,a:1,b:.9,nv:6,va:.08,pet:.02}},
  look:"5 to 9 big, smooth leaflets. The one at the end is the biggest. Smells spicy when crushed.",
  find:"Walnuts inside round green cases.",where:"Parks, gardens and old farms.",fact:"The green cases stain your hands brown, so handle them with care."},
 {id:"elder",alias:["elderflower","elderberry"],name:"Elder",latin:"Sambucus nigra",kind:"bush",k:{type:"broad",parts:"leaflets",arr:"feather",count:["few"],edge:["toothed"]},
  sk:{t:"pn",pairs:2,len:.9,ang:65,leaf:{s:.55,w:.28,a:1,b:1.3,td:.05,tn:20,nv:6,va:.08,pet:.04}},
  look:"5 to 7 toothed leaflets. They smell unpleasant when crushed.",
  find:"Flat plates of creamy flowers in June, then purple-black berries.",where:"Hedges, wasteland, parks and gardens.",fact:"People make cordial from the flowers, but raw berries and leaves can make you ill."},
 {id:"rose",alias:["wild rose"],name:"Dog rose",latin:"Rosa canina",kind:"bush",k:{type:"broad",parts:"leaflets",arr:"feather",count:["few"],edge:["toothed"],thorns:"yes"},
  sk:{t:"pn",pairs:3,len:.85,ang:58,leaf:{s:.32,w:.33,a:1,b:.9,td:.08,tn:16,nv:4,va:.1,pet:.03}},
  look:"5 to 7 small, toothed, oval leaflets, on stems with hooked prickles.",
  find:"Pale pink flowers in June, then red rose hips in autumn.",where:"Hedges and scrub.",fact:"Rose hips are full of vitamin C, and birds eat them in winter."},
 {id:"pine",alias:["pine"],name:"Scots pine",latin:"Pinus sylvestris",kind:"conifer",k:{type:"needle",needle:"pair"},
  sk:{t:"pine"},
  look:"Blue-green, slightly twisted needles growing in pairs.",
  find:"Woody cones, and orange bark near the top of the tree.",where:"Heaths, forests and big parks.",fact:"It is one of only three conifers that grew in Britain naturally."},
 {id:"yew",name:"Yew",latin:"Taxus baccata",kind:"conifer",k:{type:"needle",needle:"row"},
  sk:{t:"yew"},
  look:"Flat, soft, dark green needles in two neat rows along the twig.",
  find:"Red, cup-shaped berries. The whole tree is very poisonous except the red flesh: look, never taste.",where:"Churchyards, old gardens and woods.",fact:"Some yews in English churchyards are thought to be over 2,000 years old."},
 {id:"spruce",alias:["spruce","christmas tree"],name:"Norway spruce",latin:"Picea abies",kind:"conifer",k:{type:"needle",needle:"round"},
  sk:{t:"spruce"},
  look:"Short, stiff, sharp needles all around the twig, each on a little peg.",
  find:"Long cones that hang down.",where:"Forests, plantations and parks.",fact:"This is the traditional Christmas tree."},
 {id:"larch",name:"Larch",latin:"Larix",kind:"conifer",k:{type:"needle",needle:"tuft"},
  sk:{t:"larch"},
  look:"Soft needles in little tufts, like tiny paintbrushes.",
  find:"Small upright cones. The needles turn gold and fall in autumn.",where:"Forests and plantations.",fact:"It is the only common conifer that loses all its needles in winter."},
 {id:"leyland",alias:["leylandii","leyland"],name:"Leyland cypress",latin:"× Cuprocyparis leylandii",kind:"conifer",k:{type:"scale"},
  sk:{t:"cypress"},
  look:"Flat sprays of tiny scale-like leaves pressed against the stems.",
  find:"Small round cones. It is often clipped into very tall, thick hedges.",where:"Garden hedges and boundaries.",fact:"It can grow nearly a metre in a year, which is why some hedges get so tall."}
];

/* ---------- the leaf finder ---------- */
var KEY=[
 {id:"type",q:"What does it look like?",opts:[["broad","A flat leaf","beech"],["needle","Needles","spruce"],["scale","Tiny scales on flat sprays","leyland"]]},
 {id:"needle",q:"How do the needles grow?",when:{type:"needle"},opts:[["pair","In pairs","pine"],["row","In two flat rows","yew"],["round","All around the twig","spruce"],["tuft","In soft tufts","larch"]]},
 {id:"parts",q:"Is it one leaf, or lots of little leaflets on one stalk?",when:{type:"broad"},opts:[["single","One leaf","beech"],["leaflets","Lots of leaflets","ash"]]},
 {id:"arr",q:"How are the leaflets arranged?",when:{parts:"leaflets"},opts:[["hand","Spread out like a hand","horsechestnut"],["feather","In pairs along a stalk","ash"]]},
 {id:"count",q:"Count the leaflets. How many are there?",when:{parts:"leaflets"},opts:[["few","3 to 7","elder"],["many","9 or more","rowan"]]},
 {id:"lobes",q:"Is the leaf cut into lobes?",when:{parts:"single"},opts:[["hand","Yes, like a hand","sycamore"],["side","Yes, wavy bites down the sides","oak"],["fan","It is a fan","ginkgo"],["none","No lobes","beech"]]},
 {id:"edge",q:"Run your finger round the edge. What is it like?",when:{type:"broad"},opts:[["smooth","Smooth, no teeth","privet"],["toothed","Little teeth like a saw","hornbeam"],["spiny","Sharp spines","holly"]]},
 {id:"shape",q:"What shape is it?",when:{lobes:"none"},opts:[["narrow","Long and thin","willow"],["oval","Oval","beech"],["round","Round or heart-shaped","lime"],["triangle","Triangle or diamond","birch"]]},
 {id:"tough",q:"Is it shiny and tough, a bit like plastic?",when:{lobes:"none"},def:"no",opts:[["yes","Shiny and tough","laurel"],["no","Thin and soft","beech"]]},
 {id:"under",q:"Turn it over. What is the back like?",when:{lobes:"none"},def:"plain",opts:[["white","White, grey or furry","whitebeam"],["plain","Green, just a bit paler","cherry"]]},
 {id:"base",q:"Look where the leaf joins the stalk. Do both sides match?",when:{lobes:"none"},def:"even",opts:[["even","Both sides match","cherry"],["lopsided","One side starts lower","elm"]]},
 {id:"tip",q:"What does the tip look like?",when:{lobes:"none"},def:"point",opts:[["point","A point","hazel"],["dent","A little dent","alder"]]},
 {id:"teeth",q:"Look closely. Are there tiny teeth on the bigger teeth?",when:{lobes:"none",edge:"toothed"},def:"single",opts:[["double","Yes, big and tiny teeth","hornbeam"],["single","No, they are all alike","cherry"]]},
 {id:"veins",q:"Look at the veins. Where do they go?",when:{lobes:"none",edge:"smooth"},def:"straight",opts:[["straight","Straight out to the edge","beech"],["curve","They curve round towards the tip","dogwood"]]},
 {id:"thorns",q:"Are there thorns or prickles on the twig or stalk?",when:{type:"broad"},def:"no",opts:[["yes","Yes, ouch!","rose"],["no","No","elder"]]},
 {id:"size",q:"How big is it?",when:{lobes:"none"},def:"big",opts:[["small","Smaller than a matchbox","blackthorn"],["big","Bigger than a matchbox","cherry"]]}
];
var KEYBY={};KEY.forEach(function(q){KEYBY[q.id]=q});
function has(sp,q,v){var x=sp.k[q];if(x==null&&KEYBY[q])x=KEYBY[q].def;return Array.isArray(x)?x.indexOf(v)>-1:x===v}
function applies(q,ans){if(!q.when)return true;return Object.keys(q.when).every(function(k){return ans[k]===q.when[k]})}
function matches(ans){
  return LEAVES.filter(function(sp){return KEY.every(function(q){var v=ans[q.id];return v==null||v==="any"||!applies(q,ans)||has(sp,q.id,v)})});
}
/* next question worth asking: applies, unanswered, and splits the remaining leaves */
function nextQ(ans){
  var left=matches(ans);if(left.length<2)return null;
  for(var i=0;i<KEY.length;i++){
    var q=KEY[i];if(ans[q.id]!=null||!applies(q,ans))continue;
    var opts=q.opts.filter(function(o){return left.some(function(sp){return has(sp,q.id,o[0])})});
    if(opts.length<2)continue;
    if(opts.every(function(o){return left.every(function(sp){return has(sp,q.id,o[0])})}))continue;
    return {q:q,opts:opts};
  }
  return null;
}

var BY={};LEAVES.forEach(function(sp){BY[sp.id]=sp});
window.NSLeaves={LEAVES:LEAVES,BY:BY,KEY:KEY,sketch:sketch,matches:matches,nextQ:nextQ};
})();
