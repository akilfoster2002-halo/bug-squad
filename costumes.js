/* =====================================================================
   COSTUMES — what an object can look like, drawn in pixels.

   The same module Dino Run has, with the same interface: shelves a
   student can pick from, an id per costume, `load` to hand the VM
   something to put in the world, and `touching` that answers where two
   pictures' PIXELS overlap. The difference is colour: every arcade
   character here has its own ink, drawn on the dark arcade screen.

     #   the costume's ink     o   white (an eye, a window)     .   nothing

   One pixel of art is 0.14 of a square, so a 13-pixel Alien is about 1.8 squares wide. A costume's position is the
   middle of its BOTTOM edge, so `y position` = 0 is standing on y 0.
   ===================================================================== */
window.COSTUMES = (function(){
  const PX = 0.14;                              // one art pixel, in squares
  const INK = '#f2f2f2', PAPER = '#ffffff', SCREEN = '#15142b';

  /* ================================================================ art */
  const SHIP = [
    '.......#.......',
    '......###......',
    '......###......',
    '..###########..',
    '.#############.',
    '###############',
    '###############',
    '###############'
  ];
  const ALIEN = [
    '..#.......#..',
    '...#.....#...',
    '..#########..',
    '.###o###o###.',
    '#############',
    '#.#########.#',
    '#.#.......#.#',
    '...##...##...'
  ];
  const LASER = Array(8).fill('##');
  const FROG = [
    '.##.......##.',
    '#o##.....##o#',
    '.###########.',
    '#############',
    '.###########.',
    '..#########..',
    '#.#########.#',
    '##.#######.##',
    '#...........#'
  ];
  const CAR = [
    '.....#########......',
    '....#ooo###ooo#.....',
    '...##ooo###ooo##....',
    '####################',
    '####################',
    '####################',
    '..###.........###...',
    '..###.........###...'
  ];
  const CHOMP = [
    '....#####....',
    '..#########..',
    '.###########.',
    '.#######o###.',
    '############.',
    '#########....',
    '######.......',
    '#########....',
    '############.',
    '.###########.',
    '.###########.',
    '..#########..',
    '....#####....'
  ];
  const GHOST = [
    '....#####....',
    '..#########..',
    '.###########.',
    '.##oo###oo##.',
    '##o#o###o#o##',
    '##oo#####oo##',
    '#############',
    '#############',
    '#############',
    '#############',
    '##.##.#.##.##',
    '#...#...#...#'
  ];
  const CHERRY = [
    '.....#',
    '....#.',
    '..##..',
    '.#..#.',
    '##..##',
    '######',
    '######',
    '.####.'
  ];
  const BALL = [
    '..####..',
    '.######.',
    '########',
    '########',
    '########',
    '########',
    '.######.',
    '..####..'
  ];
  const PADDLE_V = Array(24).fill('###');
  const PADDLE_H = Array(3).fill('#'.repeat(30));
  const BRICK = [
    '#'.repeat(26),
    '#'+'o'.repeat(24)+'#',
    ...Array(8).fill('#'.repeat(26)),
    '#'.repeat(26)
  ];
  const HERO = [
    '....#####.....',
    '...#########..',
    '...ooo##o.....',
    '..o#o###o###..',
    '..o#oo###o###.',
    '..oo####oooo..',
    '....#######...',
    '..###o##o###..',
    '.####oooo####.',
    '.###oooooo###.',
    '...ooo..ooo...',
    '..###....###..',
    '.####....####.'
  ];
  const GOOMBA = [
    '....######....',
    '..##########..',
    '.##o#####o###.',
    '###oo###oo####',
    '##############',
    '.############.',
    '....######....',
    '..###.##.###..',
    '.####....####.'
  ];
  const FLAG = [
    '##########',
    '#########.',
    '########..',
    '#########.',
    '##########',
    ...Array(20).fill('#.........'),
    '###.......'
  ];

  /* ============================================================ costumes
     art    the picture       ink    its colour       layer  what draws on top */
  const C = {
    'space/ship':    { name:'Ship',    ink:'#5dff7a', layer:3, art:SHIP },
    'space/alien':   { name:'Alien',   ink:'#ff6ad5', layer:2, art:ALIEN },
    'space/laser':   { name:'Laser',   ink:'#fff45c', layer:1, art:LASER },
    'road/frog':     { name:'Frog',    ink:'#5dff7a', layer:3, art:FROG },
    'road/car':      { name:'Car',     ink:'#ff5d5d', layer:2, art:CAR },
    'road/truck':    { name:'Truck',   ink:'#5dc8ff', layer:2, art:CAR },
    'maze/chomp':    { name:'Chomper', ink:'#ffe14d', layer:3, art:CHOMP },
    'maze/ghost':    { name:'Ghost',   ink:'#ff7ab8', layer:2, art:GHOST },
    'maze/cherry':   { name:'Cherry',  ink:'#ff4d4d', layer:1, art:CHERRY },
    'court/ball':    { name:'Ball',    ink:'#ffffff', layer:3, art:BALL },
    'court/paddle':  { name:'Paddle',  ink:'#5dc8ff', layer:2, art:PADDLE_V },
    'court/bat':     { name:'Bat',     ink:'#5dc8ff', layer:2, art:PADDLE_H },
    'court/brick':   { name:'Brick',   ink:'#ff9a3d', layer:1, art:BRICK },
    'plat/hero':     { name:'Hero',    ink:'#ff4d4d', layer:3, art:HERO },
    'plat/goomba':   { name:'Mushroom',ink:'#c88a4a', layer:2, art:GOOMBA },
    'plat/flag':     { name:'Flag',    ink:'#5dff7a', layer:1, art:FLAG }
  };

  const it=(file,name)=>({ file, name });
  const SHAPES=['cube','ball','cylinder','cone'];
  const SHELVES=[
    { id:'space', name:'Space', dir:null, thumbs:null, items:[
        it('ship','Ship'), it('alien','Alien'), it('laser','Laser') ] },
    { id:'road', name:'Road', dir:null, thumbs:null, items:[
        it('frog','Frog'), it('car','Car'), it('truck','Truck') ] },
    { id:'maze', name:'Maze', dir:null, thumbs:null, items:[
        it('chomp','Chomper'), it('ghost','Ghost'), it('cherry','Cherry') ] },
    { id:'court', name:'Court', dir:null, thumbs:null, items:[
        it('ball','Ball'), it('paddle','Paddle'), it('bat','Bat'), it('brick','Brick') ] },
    { id:'plat', name:'Platform', dir:null, thumbs:null, items:[
        it('hero','Hero'), it('goomba','Mushroom'), it('flag','Flag') ] },
    { id:'shapes', name:'Shapes', dir:null, thumbs:null, items:[
        it('cube','Cube'), it('ball','Ball'), it('cylinder','Cylinder'), it('cone','Cone') ] }
  ];
  const id = (shelf,f) => shelf==='shapes' ? f : shelf+'/'+f;
  const isModel = cid => !!C[String(cid)];
  function find(cid){
    const [sh,f]=String(cid).split('/');
    const s=SHELVES.find(x=>x.id===sh); return s ? s.items.find(x=>x.file===f)||null : null;
  }
  function nameOf(cid){
    if(C[cid]) return C[cid].name;
    const s=String(cid||'cube'); return s.charAt(0).toUpperCase()+s.slice(1);
  }
  const thumbOf = () => null;
  const clips = () => [];
  function all(){
    const out=[];
    SHELVES.forEach(s=>s.items.forEach(x=>out.push(id(s.id,x.file))));
    return out;
  }

  /* ============================================================ drawing
     Painted once, one canvas pixel per art pixel, and kept: every clone
     shares the picture. Nearest-neighbour keeps a pixel a square. */
  const made = {};
  function sheet(cid){
    if(made[cid]) return made[cid];
    const rows=C[cid].art, h=rows.length, w=Math.max(...rows.map(r=>r.length));
    const mask=new Uint8Array(w*h);
    rows.forEach((r,j)=>{ for(let i=0;i<r.length;i++)
      if(r[i]==='#'||r[i]==='o') mask[j*w+i] = r[i]==='#' ? 1 : 2; });
    return (made[cid]={ w, h, mask, tex:null });
  }
  function texture(cid){
    const sh=sheet(cid);
    if(sh.tex) return sh.tex;
    const cv=document.createElement('canvas'); cv.width=sh.w; cv.height=sh.h;
    const x=cv.getContext('2d'), img=x.createImageData(sh.w, sh.h);
    const ink=hex(C[cid].ink||INK), paper=hex(PAPER);
    for(let p=0;p<sh.mask.length;p++){
      const m=sh.mask[p]; if(!m) continue;
      const c=m===1?ink:paper;
      img.data[p*4]=c[0]; img.data[p*4+1]=c[1]; img.data[p*4+2]=c[2]; img.data[p*4+3]=255;
    }
    x.putImageData(img,0,0);
    const tex=new THREE.CanvasTexture(cv);
    tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter;
    tex.generateMipmaps=false;
    if(THREE.SRGBColorSpace) tex.colorSpace=THREE.SRGBColorSpace;
    return (sh.tex=tex);
  }
  function hex(h){ const n=parseInt(h.slice(1),16); return [n>>16&255, n>>8&255, n&255]; }

  const geos = {};
  function geometry(cid){
    if(geos[cid]) return geos[cid];
    const sh=sheet(cid), c=C[cid];
    const g=new THREE.PlaneGeometry(sh.w*PX, sh.h*PX);
    g.translate(0, sh.h*PX/2 - (c.below||0)*PX, 0);
    return (geos[cid]=g);
  }
  function make(cid){
    const c=C[cid];
    const mat=new THREE.MeshBasicMaterial({ map:texture(cid), alphaTest:0.5 });
    const plane=new THREE.Mesh(geometry(cid), mat);
    plane.rotation.x=-Math.PI/2;                  // lying flat, top of the picture up the screen
    plane.position.y=0.02*(c.layer||0);
    const o=new THREE.Group();
    o.add(plane);
    o.userData.sprite={ cid };
    return o;
  }
  /* A THENABLE, NOT A PROMISE: the costume is on in the same frame */
  function load(cid){
    const done={ then(ok,bad){ try{ ok && ok(make(String(cid))); }catch(e){ if(bad) bad(e); }
                               return done; },
                 catch(){ return done; } };
    return done;
  }

  /* ========================================================== touching */
  function rect(a){
    if(!a || !C[a.shape]) return null;
    const c=C[a.shape], sh=sheet(a.shape), px=PX*Math.max(0.1, a.size||1);
    const x0=a.x - sh.w*px/2, y0=(-a.z) - (c.below||0)*px;
    return { x0, y0, x1:x0+sh.w*px, y1:y0+sh.h*px, px, w:sh.w, h:sh.h, mask:sh.mask };
  }
  function solid(r, x, y){
    const i=Math.floor((x-r.x0)/r.px), j=Math.floor((r.y1-y)/r.px);
    if(i<0||j<0||i>=r.w||j>=r.h) return false;
    return r.mask[j*r.w+i]>0;
  }
  function touching(a, b){
    const A=rect(a), B=rect(b);
    if(!A || !B) return null;
    if(a.visible===false || b.visible===false) return false;   // a hidden thing touches nothing
    const x0=Math.max(A.x0,B.x0), x1=Math.min(A.x1,B.x1);
    const y0=Math.max(A.y0,B.y0), y1=Math.min(A.y1,B.y1);
    if(x0>=x1 || y0>=y1) return false;
    const step=Math.min(A.px,B.px)/2;
    for(let y=y0+step/2; y<y1; y+=step)
      for(let x=x0+step/2; x<x1; x+=step)
        if(solid(A,x,y) && solid(B,x,y)) return true;
    return false;
  }
  function hit(a, x, y, loose){
    const r=rect(a); if(!r) return false;
    if(x<r.x0||x>r.x1||y<r.y0||y>r.y1) return false;
    return loose ? true : solid(r,x,y);
  }

  return { SHELVES, SHAPES, isModel, load, clips, nameOf, thumbOf, all, id, find,
           touching, rect, hit, make, PX, INK, PAPER, SCREEN, C };
})();
