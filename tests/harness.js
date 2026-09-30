/* =====================================================================
   A HEADLESS ARCADE — the real language, VM, costumes and games, with no
   screen. Only what a browser provides is faked: a THREE that remembers
   positions and draws nothing, a keyboard that is a plain object, and a
   clock that moves 1/60 s per step.
   ===================================================================== */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname,'..',f),'utf8');

function three(){
  const v3=(x=0,y=0,z=0)=>({ x,y,z,
    set(a,b,c){ this.x=a; this.y=b; this.z=c; return this; },
    setScalar(s){ this.x=this.y=this.z=s; return this; },
    multiplyScalar(s){ this.x*=s; this.y*=s; this.z*=s; return this; } });
  class Obj{
    constructor(){ this.children=[]; this.parent=null; this.userData={}; this.visible=true;
      this.position=v3(); this.rotation=v3(); this.scale=v3(1,1,1); }
    add(o){ if(o.parent) o.parent.remove(o); o.parent=this; this.children.push(o); return this; }
    remove(o){ const i=this.children.indexOf(o); if(i>=0){ this.children.splice(i,1); o.parent=null; } return this; }
  }
  class Geo{ translate(){ return this; } dispose(){} }
  class Mat{ constructor(o){ Object.assign(this,o||{}); this.color={ set(){} }; } }
  return {
    Group:class extends Obj{}, Scene:class extends Obj{},
    Mesh:class extends Obj{ constructor(g,m){ super(); this.geometry=g; this.material=m; } },
    Sprite:class extends Obj{ constructor(m){ super(); this.material=m; } },
    BoxGeometry:Geo, SphereGeometry:Geo, CylinderGeometry:Geo, ConeGeometry:Geo, PlaneGeometry:Geo,
    MeshLambertMaterial:Mat, MeshBasicMaterial:Mat, SpriteMaterial:Mat,
    Color:class{ set(){ return this; } }, CanvasTexture:class{},
    NearestFilter:1, SRGBColorSpace:'srgb'
  };
}

/* one game, loaded with its buggy code (or the answer key), ready to step */
function arcade(index, fixed){
  let now=0;
  const ctx=vm.createContext({
    console, Math,
    performance:{ now:()=>now },
    localStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} },
    document:{ createElement:()=>({ width:0, height:0,
      /* a 2D context where every drawing call is a no-op (speech bubbles) */
      getContext:()=>new Proxy({ createImageData:(w,h)=>({ data:new Uint8ClampedArray(w*h*4) }),
                                 measureText:()=>({ width:10 }) },
                               { get:(o,k)=>k in o ? o[k] : ()=>{}, set:()=>true }) }) },
    uiFont:()=>'monospace'
  });
  ctx.window=ctx; ctx.self=ctx;
  ctx.THREE=three();
  ctx.G={ keys:{}, hits:[], pos:{ x:0, y:0, z:0 }, room:'bugs' };
  ctx.LEVELS={ bugs:{ w:34, d:20 } };
  ['strings.js','blocks.js','vm.js','costumes.js','games.js'].forEach(f=>
    vm.runInContext(read(f), ctx, { filename:f }));
  const { VM, COSTUMES, BUGS, BLOCKS } = ctx;
  const g=BUGS.GAMES[index];
  BUGS.pick(index);
  const root=new ctx.THREE.Group();
  VM.useScratch(); VM.enter(root);
  VM.project.actors.slice().forEach(a=>VM.delActor(a));
  const code=JSON.parse(JSON.stringify(g.code(!!fixed)));
  g.cast.forEach(c=>{
    const a=VM.addActor({ name:c.name, shape:c.shape, size:1 });
    a.x=c.x; a.z=-c.y; a.y=1; a.visible=c.visible!==false; a.vars={};
    a.scripts=code[c.name]||[];
    VM.sync(a); VM.setHome(a);
  });
  Object.assign(VM.project.vars, g.vars);
  function step(n){ for(let i=0;i<(n||1);i++){ VM.step(1/60); now+=1000/60; } }
  const who = n => VM.actorByName(n);
  const y = a => -a.z;
  return { ctx, VM, COSTUMES, BUGS, BLOCKS, G:ctx.G, g, step, who, y };
}

module.exports = { arcade, read };
