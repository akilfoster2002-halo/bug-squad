/* =====================================================================
   BUG SQUAD — six classic arcade games, and every one of them is broken.

   Each game arrives with its code already written and THREE BUGS in it.
   The student runs it, watches what goes wrong, opens the blocks and
   fixes them. The bug list along the bottom watches the code and turns
   each 🐞 into a ✅ the moment its fix is in.

   The games go in teaching order:

     1  Space Blaster   INDENTATION   a block outside the loop it belongs in
     2  Road Hopper     + AND −       a number with the wrong sign
     3  Chomp           x AND y       across the screen, or up it
     4  Paddle Pong     < AND >       the alligator eats the bigger number
     5  Brick Smash     SENSING       touching the right thing, the right key
     6  Jump Bros       JUMPING       jump up, fall down, land on the ground

   Every rule of every game is in blocks the student can open. The room
   (this file) only draws the scenery, keeps the score on screen and
   READS the code to tick off the bugs — it never moves anything.

   A teacher can open the page with ?answer to load every game fixed.
   ===================================================================== */
window.BUGS = (function(){
  const $ = s => document.querySelector(s);
  const T = (s,p) => (window.t ? t(s,p) : s);

  const STARS_KEY='bug-squad.stars.v1', NAME_KEY='bug-squad.name',
        LANG_KEY='bug-squad.lang', SOUND_KEY='bug-squad.sound', GAME_KEY='bug-squad.game';
  const teacher = typeof location!=='undefined' && /[?&]answer\b/.test(location.search);

  /* ================================================== writing code
     Tiny builders, so a game's code below reads like the blocks do. */
  const B=(op,args,body)=>{ const b={ op, args:args||{} }; if(body) b.body=body; return b; };
  const flag  = (...body)=>({ hat:B('event.flag'), body });
  const onKey = (k,...body)=>({ hat:B('event.key',{ k }), body });
  const onClone = (...body)=>({ hat:B('event.clone'), body });
  const forever = (...b)=>B('ctrl.forever',{},b);
  const IF    = (c,...b)=>B('ctrl.if',{ c },b);
  const REP   = (n,...b)=>B('ctrl.repeat',{ n },b);
  const wait  = n=>B('ctrl.wait',{ n });
  const key   = k=>B('sense.key',{ k });
  const touch = o=>B('sense.touch',{ o });
  const pos   = a=>B('motion.pos',{ a });
  const of    = (a,o)=>B('sense.posOf',{ a, o });
  const lt    = (a,b)=>B('op.lt',{ a, b });
  const gt    = (a,b)=>B('op.gt',{ a, b });
  const eq    = (a,b)=>B('op.eq',{ a, b });
  const and   = (c,d)=>B('op.and',{ c, d });
  const or    = (c,d)=>B('op.or',{ c, d });
  const rnd   = (a,b)=>B('op.random',{ a, b });
  const chg   = (a,n)=>B('motion.changeBy',{ a, n });
  const setTo = (a,n)=>B('motion.setTo',{ a, n });
  const goto  = (x,y)=>B('motion.goto',{ x, y, z:1 });
  const glide = (t,x,y)=>B('motion.glide',{ t, x, y, z:1 });
  const vset  = (v,n)=>B('data.set',{ v, n });
  const vchg  = (v,n)=>B('data.change',{ v, n });
  const v     = n=>B('data.get',{ v:n });
  const say   = s=>B('looks.say',{ s });
  const hide  = ()=>B('looks.hide');
  const show  = ()=>B('looks.show');

  /* ================================================== reading code
     How the bug list knows a bug is fixed: it looks at the blocks, the
     way a teacher leaning over a shoulder would. Each check asks for the
     RIGHT shape and, where a student might add the right block and leave
     the wrong one behind, for the wrong shape to be gone too. */
  const num = x => (x && typeof x==='object') ? NaN : parseFloat(x);
  /* every block in an object's code, with the blocks it sits inside */
  function all(name){
    const a=actor(name), out=[];
    const walk=(list,anc,hat)=>(list||[]).forEach(b=>{
      out.push({ b, anc, hat });
      if(b.body)  walk(b.body,  anc.concat(b), hat);
      if(b.body2) walk(b.body2, anc.concat(b), hat);
    });
    (a && a.scripts || []).forEach(sc=>walk(sc.body, [], sc.hat));
    return out;
  }
  const inLoop = anc => anc.some(x=>x.op==='ctrl.forever' || x.op==='ctrl.repeat' || x.op==='ctrl.repeatUntil');
  /* does a condition, or anything nested in it, match */
  function has(c, f){
    if(!c || typeof c!=='object' || !c.op) return false;
    if(f(c)) return true;
    return Object.values(c.args||{}).some(x=>has(x,f));
  }
  const isKey   = k => c => c.op==='sense.key' && c.args.k===k;
  const isTouch = o => c => c.op==='sense.touch' && c.args.o===o;
  const isPos   = (x,a) => x && typeof x==='object' && (x.op==='motion.pos' && x.args.a===a);
  /* `y position < -8` and `-8 > y position` are the same test: which side, and of what */
  function side(c, a){
    const out=[];
    const look=x=>{
      if(!x || typeof x!=='object' || !x.op) return;
      if(x.op==='op.lt' || x.op==='op.gt'){
        const L=x.op==='op.lt';
        if(isPos(x.args.a,a) && !isNaN(num(x.args.b))) out.push({ s:L?'<':'>', n:num(x.args.b) });
        if(isPos(x.args.b,a) && !isNaN(num(x.args.a))) out.push({ s:L?'>':'<', n:num(x.args.a) });
      }
      Object.values(x.args||{}).forEach(look);
    };
    look(c); return out;
  }
  /* the blocks directly (or deeper) inside an `if` */
  const inside = (ifb, f) => { let hit=false;
    const walk=l=>(l||[]).forEach(b=>{ if(f(b)) hit=true; walk(b.body); walk(b.body2); });
    walk(ifb.body); return hit; };
  const ifs = name => all(name).filter(x=>x.b.op==='ctrl.if' || x.b.op==='ctrl.ifelse');
  const moves = (a, s) => b => b.op==='motion.changeBy' && b.args.a===a && Math.sign(num(b.args.n))===s;
  const sets  = (vn, s) => b => b.op==='data.set' && b.args.v===vn && Math.sign(num(b.args.n))===s;
  /* what a key's own `when [key] pressed` script moves */
  const keyHat = (name,k) => all(name).filter(x=>x.hat && x.hat.op==='event.key' && x.hat.args.k===k).map(x=>x.b);
  /* every `if key [k] pressed?`, wherever it is */
  const keyIfAll = (name,k) => ifs(name).filter(x=>has(x.b.args.c, isKey(k)));
  /* ...and only the ones that WORK: in a loop, and not tucked inside
     another `if` — dropped into `if key right arrow pressed`, a left-arrow
     test only runs while → is held down too */
  const alone = x => !x.anc.some(p=>p.op==='ctrl.if' || p.op==='ctrl.ifelse');
  const keyIf = (name,k) => keyIfAll(name,k).filter(x=>inLoop(x.anc) && alone(x));

  /* ============================================================ GAMES */
  const GAMES=[
  /* ---------------------------------------------------- 1 INDENTATION */
  { id:'space', icon:'🚀', name:'Space Blaster', topic:'Indentation',
    lesson:'Inside the loop = repeats. Outside = once.',
    world:{ stars:true },
    cast:[
      { name:'Ship',  shape:'space/ship',  x:0, y:-8 },
      { name:'Alien', shape:'space/alien', x:0, y:5 },
      { name:'Laser', shape:'space/laser', x:0, y:-7, visible:false }
    ],
    vars:{ score:0, alienSpeed:0.15 },
    keys:[['← →','move'],['SPACE','shoot']],
    code(fixed){
      const leftKey = IF(key('left'), chg('x',-0.4));
      const rightKey= IF(key('right'), chg('x',0.4));
      const hit = fixed
        ? IF(touch('Laser'), vchg('score',1), hide(), wait(0.5), setTo('x',rnd(-12,12)), show())
        : IF(touch('Laser'), vchg('score',1), wait(0.5), setTo('x',rnd(-12,12)), show());
      return {
        Ship:[ flag(goto(0,-8), ...(fixed ? [forever(leftKey, rightKey)] : [leftKey, forever(rightKey)])) ],
        Alien:[ flag(goto(0,5), show(), vset('score',0), vset('alienSpeed',0.15),
          forever(
            chg('x',v('alienSpeed')),
            IF(gt(pos('x'),13), vset('alienSpeed',-0.15)),
            IF(lt(pos('x'),-13), vset('alienSpeed',0.15)),
            hit, ...(fixed ? [] : [hide()]) )) ],
        Laser:[ flag(hide()),
          onKey('space', setTo('x',of('x','Ship')), setTo('y',-7), show(),
            ...(fixed ? [REP(40, chg('y',0.5))] : [REP(40), chg('y',0.5)]), hide()) ]
      };
    },
    bugs:[
      { what:'← does nothing',
        hint:'<b>Ship</b>: drag <code>if key left arrow</code> into <code>forever</code>',
        ok:()=>{ const l=keyIfAll('Ship','left'); return l.length>0 && l.every(x=>inLoop(x.anc) && alone(x)); } },
      { what:'The laser won\'t fly',
        hint:'<b>Laser</b>: drag <code>change y by 0.5</code> into <code>repeat</code>',
        ok:()=>all('Laser').some(x=>moves('y',1)(x.b) && inLoop(x.anc)) },
      { what:'The alien is invisible',
        hint:'<b>Alien</b>: drag <code>hide</code> into <code>if touching Laser</code>',
        ok:()=>{ const h=all('Alien').filter(x=>x.b.op==='looks.hide');
          return h.length>0 && h.every(x=>x.anc.some(p=>p.op==='ctrl.if' && has(p.args.c, isTouch('Laser')))); } }
    ] },

  /* ------------------------------------------------------- 2 SIGNS */
  { id:'road', icon:'🐸', name:'Road Hopper', topic:'Plus and minus',
    lesson:'<b>+</b> up / right &nbsp; <b>−</b> down / left',
    world:{ road:true },
    cast:[
      { name:'Frog',  shape:'road/frog',  x:0,   y:-9 },
      { name:'Car',   shape:'road/car',   x:-16, y:-5.4 },
      { name:'Truck', shape:'road/truck', x:14,  y:-0.6 }
    ],
    vars:{},
    keys:[['↑ ↓ ← →','hop']],
    code(fixed){
      return {
        Frog:[
          flag(goto(0,-9), forever(
            IF(or(touch('Car'), touch('Truck')), goto(0,-9)),
            IF(gt(pos('y'),6), say('I made it!')) )),
          onKey('up',    chg('y', fixed ? 1.5 : -1.5)),
          onKey('down',  chg('y', fixed ? -1.5 : 1.5)),
          onKey('left',  chg('x', -1.5)),
          onKey('right', chg('x', fixed ? 1.5 : -1.5))
        ],
        Car:[ flag(goto(-16,-5.4), forever(chg('x',0.25), IF(gt(pos('x'),18), setTo('x',-18)))) ],
        Truck:[ flag(goto(14,-0.6), forever(chg('x',-0.35), IF(lt(pos('x'),-18), setTo('x',18)))) ]
      };
    },
    bugs:[
      { what:'↑ hops down',
        hint:'<b>Frog</b>, when ↑: <code>-1.5</code> → <code>1.5</code>',
        ok:()=>{ const b=keyHat('Frog','up'); return b.some(moves('y',1)) && !b.some(moves('y',-1)); } },
      { what:'↓ hops up',
        hint:'<b>Frog</b>, when ↓: <code>1.5</code> → <code>-1.5</code>',
        ok:()=>{ const b=keyHat('Frog','down'); return b.some(moves('y',-1)) && !b.some(moves('y',1)); } },
      { what:'→ hops left',
        hint:'<b>Frog</b>, when →: <code>-1.5</code> → <code>1.5</code>',
        ok:()=>{ const b=keyHat('Frog','right'); return b.some(moves('x',1)) && !b.some(moves('x',-1)); } }
    ] },

  /* --------------------------------------------------------- 3 X Y */
  { id:'maze', icon:'🟡', name:'Chomp', topic:'x and y',
    lesson:'<b>x</b> ↔ &nbsp;&nbsp; <b>y</b> ↕',
    world:{ maze:true },
    cast:[
      { name:'Chomper', shape:'maze/chomp',  x:0,  y:-1 },
      { name:'Ghost',   shape:'maze/ghost',  x:10, y:4 },
      { name:'Cherry',  shape:'maze/cherry', x:-8, y:4 }
    ],
    vars:{ score:0 },
    keys:[['↑ ↓ ← →','move']],
    code(fixed){
      return {
        Chomper:[ flag(goto(0,-1), vset('score',0), forever(
          IF(key('up'),    chg(fixed?'y':'x', 0.2)),
          IF(key('down'),  chg(fixed?'y':'x', -0.2)),
          IF(key('left'),  chg('x', -0.2)),
          IF(key('right'), chg(fixed?'x':'y', 0.2)),
          IF(touch('Ghost'), goto(0,-1)) )) ],
        Ghost:[ flag(goto(10,4), forever(glide(2, rnd(-13,13), rnd(-7,6)))) ],
        Cherry:[ flag(goto(-8,4), show(), forever(
          IF(touch('Chomper'), vchg('score',1), goto(rnd(-13,13), rnd(-7,6))) )) ]
      };
    },
    bugs:[
      { what:'↑ goes right',
        hint:'<b>Chomper</b>, if ↑: <code>x</code> → <code>y</code>',
        ok:()=>{ const f=keyIf('Chomper','up'); return f.some(x=>inside(x.b, moves('y',1))) && !f.some(x=>inside(x.b, b=>b.op==='motion.changeBy' && b.args.a==='x')); } },
      { what:'↓ goes left',
        hint:'<b>Chomper</b>, if ↓: <code>x</code> → <code>y</code>',
        ok:()=>{ const f=keyIf('Chomper','down'); return f.some(x=>inside(x.b, moves('y',-1))) && !f.some(x=>inside(x.b, b=>b.op==='motion.changeBy' && b.args.a==='x')); } },
      { what:'→ goes up',
        hint:'<b>Chomper</b>, if →: <code>y</code> → <code>x</code>',
        ok:()=>{ const f=keyIf('Chomper','right'); return f.some(x=>inside(x.b, moves('x',1))) && !f.some(x=>inside(x.b, b=>b.op==='motion.changeBy' && b.args.a==='y')); } }
    ] },

  /* ---------------------------------------------------- 4 OPERATORS */
  { id:'pong', icon:'🏓', name:'Paddle Pong', topic:'Less than, greater than',
    lesson:'<b>&lt;</b> less than &nbsp; <b>&gt;</b> greater than',
    world:{ court:true },
    cast:[
      { name:'Ball',   shape:'court/ball',   x:0,   y:0 },
      { name:'Paddle', shape:'court/paddle', x:-14, y:-1.5 }
    ],
    vars:{ score:0, vx:0.2, vy:0.12 },
    keys:[['↑ ↓','move the paddle']],
    code(fixed){
      return {
        Ball:[ flag(goto(0,0), vset('score',0), vset('vx',0.2), vset('vy',0.12), forever(
          chg('x',v('vx')), chg('y',v('vy')),
          IF(gt(pos('y'),8), vset('vy',-0.12)),
          IF(fixed ? lt(pos('y'),-9) : gt(pos('y'),-9), vset('vy',0.12)),
          IF(fixed ? gt(pos('x'),15) : lt(pos('x'),15), vset('vx',-0.2)),
          IF(touch('Paddle'), vset('vx',0.2), vchg('score',1)),
          IF(lt(pos('x'),-16), goto(0,0)) )) ],
        Paddle:[ flag(goto(-14,-1.5), forever(
          IF(and(key('up'), fixed ? lt(pos('y'),6) : gt(pos('y'),6)), chg('y',0.3)),
          IF(and(key('down'), gt(pos('y'),-9)), chg('y',-0.3)) )) ]
      };
    },
    bugs:[
      { what:'The ball shakes at the top',
        hint:'<b>Ball</b>: <code>y &gt; -9</code> → <code>y &lt; -9</code>',
        ok:()=>{ const f=ifs('Ball');
          return f.some(x=>side(x.b.args.c,'y').some(s=>s.s==='<' && s.n<0) && inside(x.b, sets('vy',1))) &&
                !f.some(x=>side(x.b.args.c,'y').some(s=>s.s==='>' && s.n<0) && inside(x.b, sets('vy',1))); } },
      { what:'The ball always flies left',
        hint:'<b>Ball</b>: <code>x &lt; 15</code> → <code>x &gt; 15</code>',
        ok:()=>{ const f=ifs('Ball');
          return f.some(x=>side(x.b.args.c,'x').some(s=>s.s==='>' && s.n>0) && inside(x.b, sets('vx',-1))) &&
                !f.some(x=>side(x.b.args.c,'x').some(s=>s.s==='<' && s.n>0) && inside(x.b, sets('vx',-1))); } },
      { what:'The paddle won\'t go up',
        hint:'<b>Paddle</b>: <code>y &gt; 6</code> → <code>y &lt; 6</code>',
        ok:()=>{ const f=keyIf('Paddle','up');
          return f.some(x=>side(x.b.args.c,'y').some(s=>s.s==='<' && s.n>0) && inside(x.b, moves('y',1))) &&
                !f.some(x=>side(x.b.args.c,'y').some(s=>s.s==='>' && s.n>0)); } }
    ] },

  /* ------------------------------------------------------ 5 SENSING */
  { id:'bricks', icon:'🧱', name:'Brick Smash', topic:'Sensing',
    lesson:'Sensing asks: <b>touching?</b> <b>pressed?</b>',
    world:{ box:true },
    cast:[
      { name:'Bat',   shape:'court/bat',   x:0,   y:-8 },
      { name:'Ball',  shape:'court/ball',  x:0,   y:-6 },
      { name:'Brick', shape:'court/brick', x:-12, y:6, visible:false }
    ],
    vars:{ score:0, vx:0.15, vy:0.2 },
    keys:[['← →','move the bat']],
    code(fixed){
      return {
        Bat:[ flag(goto(0,-8), forever(
          IF(key(fixed?'left':'a'), chg('x',-0.4)),
          IF(key('right'), chg('x',0.4)) )) ],
        Ball:[ flag(goto(0,-6), vset('score',0), vset('vx',0.15), vset('vy',0.2), forever(
          chg('x',v('vx')), chg('y',v('vy')),
          IF(touch('left edge'),  vset('vx',0.15)),
          IF(touch('right edge'), vset('vx',-0.15)),
          IF(touch('up edge'),    vset('vy',-0.2)),
          IF(touch(fixed?'Bat':'Brick'), vset('vy',0.2)),
          IF(touch('down edge'), goto(0,-6), vset('vy',0.2)) )) ],
        Brick:[
          flag(hide(), goto(-12,6), REP(7, B('ctrl.clone'), chg('x',4))),
          onClone(show(), forever(
            IF(touch(fixed?'Ball':'Bat'), vset('vy',-0.2), vchg('score',1), B('ctrl.delclone')) ))
        ]
      };
    },
    bugs:[
      { what:'← does nothing',
        hint:'<b>Bat</b>: key <code>a</code> → <code>left arrow</code>',
        ok:()=>keyIf('Bat','left').some(x=>inside(x.b, moves('x',-1))) },
      { what:'The ball goes through the bat',
        hint:'<b>Ball</b>: <code>touching Brick</code> → <code>Bat</code>',
        ok:()=>ifs('Ball').some(x=>has(x.b.args.c, isTouch('Bat')) && inside(x.b, sets('vy',1))) },
      { what:'Bricks never break',
        hint:'<b>Brick</b>: <code>touching Bat</code> → <code>Ball</code>',
        ok:()=>ifs('Brick').some(x=>has(x.b.args.c, isTouch('Ball'))) }
    ] },

  /* ------------------------------------------------------ 6 JUMPING */
  { id:'plat', icon:'🍄', name:'Jump Bros', topic:'Jumping',
    lesson:'Jump ↑ &nbsp; Fall ↓ &nbsp; Land ▁',
    world:{ ground:true },
    cast:[
      { name:'Hero',     shape:'plat/hero',   x:-13, y:0 },
      { name:'Mushroom', shape:'plat/goomba', x:8,   y:0 },
      { name:'Flag',     shape:'plat/flag',   x:14,  y:0 }
    ],
    vars:{ vy:0 },
    keys:[['← →','walk'],['SPACE','jump']],
    code(fixed){
      return {
        Hero:[ flag(goto(-13,0), vset('vy',0), forever(
          IF(key('left'),  chg('x',-0.2)),
          IF(key('right'), chg('x',0.2)),
          IF(and(key('space'), eq(pos('y'),0)), vset('vy', fixed?0.5:-0.5)),
          ...(fixed ? [vchg('vy',-0.025)] : []),
          chg('y',v('vy')),
          IF(fixed ? lt(pos('y'),0) : gt(pos('y'),0), setTo('y',0), vset('vy',0)),
          IF(touch('Mushroom'), goto(-13,0)),
          IF(touch('Flag'), say('I win!')) )) ],
        Mushroom:[ flag(goto(8,0), forever(chg('x',-0.1), IF(lt(pos('x'),-15), setTo('x',15)))) ],
        Flag:[]
      };
    },
    bugs:[
      { what:'SPACE sinks the hero',
        hint:'<b>Hero</b>: <code>vy</code> <code>-0.5</code> → <code>0.5</code>',
        ok:()=>{ const f=keyIf('Hero','space'); return f.some(x=>inside(x.b, sets('vy',1))) && !f.some(x=>inside(x.b, sets('vy',-1))); } },
      { what:'No gravity',
        hint:'Add <code>change vy by -0.025</code> into <b>Hero</b>\'s <code>forever</code>',
        ok:()=>all('Hero').some(x=>x.b.op==='data.change' && x.b.args.v==='vy' && num(x.b.args.n)<0 && inLoop(x.anc)) },
      { what:'The hero can\'t jump',
        hint:'<b>Hero</b>: <code>y &gt; 0</code> → <code>y &lt; 0</code>',
        ok:()=>{ const f=ifs('Hero');
          const lands=x=>inside(x.b, b=>b.op==='motion.setTo' && b.args.a==='y');
          return f.some(x=>side(x.b.args.c,'y').some(s=>s.s==='<' && s.n<=0.5) && lands(x)) &&
                !f.some(x=>side(x.b.args.c,'y').some(s=>s.s==='>' && s.n>=0) && lands(x)); } }
    ] }
  ];

  /* ======================================================= the shelf
     EVERY BLOCK IS THERE. Nothing is hidden: a debugging game should never
     be won by only offering the answer. Variables and My Blocks can be
     made too. `defaults` only decides what a block says when it comes off
     the shelf. */
  const SHELF={ locked:true, make:true, defaults:{
    'motion.changeBy': { a:'x', n:0.2 },
    'motion.goto':     { x:0, y:0, z:1 },
    'motion.glide':    { t:1, x:0, y:0, z:1 },
    'sense.touch':     { o:'edge' },
    'sense.key':       { k:'space' },
    'event.key':       { k:'space' },
    'ctrl.stop':       { w:'all' }
  } };

  /* ============================================================ words */
  Object.assign(window.ES = window.ES || {}, {
    'BUG SQUAD':'ESCUADRÓN DE BICHOS',
    'Six arcade games. All broken.':'Seis juegos de arcade. Todos rotos.',
    'Run it':'Juégalo','Watch what goes wrong.':'Mira qué sale mal.',
    'Open the blocks':'Abre los bloques','Drag, click, fix.':'Arrastra, haz clic, arregla.',
    'Find the bugs':'Encuentra los bichos','3 in every game. 💡 if stuck.':'3 en cada juego. 💡 si te atoras.',
    'Start':'Empezar','Play':'Jugar','How to play':'Cómo jugar','Start this game over':'Empezar este juego de nuevo',
    'Download my code':'Descargar mi código','Teacher view':'Vista del maestro',
    'FIX THE BROKEN ARCADE GAMES':'ARREGLA LOS JUEGOS DE ARCADE ROTOS',
    'Six classic games, and every one has <b>3 bugs</b> in its code. Press <b>RUN</b> and watch what goes wrong. Then open the <b>BLOCKS</b> and fix it. The bug list at the bottom turns 🐞 into ✅ when a bug is fixed.':
      'Seis juegos clásicos, y cada uno tiene <b>3 bichos</b> (errores) en su código. Presiona <b>JUGAR</b> y mira qué sale mal. Luego abre los <b>BLOQUES</b> y arréglalo. La lista de abajo cambia 🐞 por ✅ cuando arreglas un error.',
    'HOW TO FIX':'CÓMO ARREGLAR',
    '<b>Drag</b> a block anywhere: between two blocks, into a loop, out of a loop.':
      '<b>Arrastra</b> un bloque a cualquier lugar: entre dos bloques, dentro de un bucle, fuera de un bucle.',
    '<b>Change</b> a number, a letter or a menu by clicking it.':
      '<b>Cambia</b> un número, una letra o un menú haciendo clic en él.',
    '<b>Take a block away</b> with its ✕, or drag it back onto the shelf. Only that block goes — the blocks inside it stay.':
      '<b>Quita un bloque</b> con su ✕, o arrástralo de vuelta al estante. Solo se va ese bloque — los bloques de adentro se quedan.',
    '<b>Stuck?</b> Press 💡 next to a bug for a hint.':'<b>¿Atascado?</b> Presiona 💡 junto a un bicho para una pista.',
    'THE GAMES':'LOS JUEGOS',
    'Start fixing ▶':'Empezar a arreglar ▶',
    'Space Blaster':'Space Blaster (Nave)','Road Hopper':'Road Hopper (Rana)','Chomp':'Chomp (Come-cocos)',
    'Paddle Pong':'Paddle Pong (Tenis)','Brick Smash':'Brick Smash (Ladrillos)','Jump Bros':'Jump Bros (Saltos)',
    'Indentation':'Sangría (adentro/afuera)','Plus and minus':'Más y menos','x and y':'x y y',
    'Less than, greater than':'Menor que, mayor que','Sensing':'Sensores','Jumping':'Saltar',
    'move':'mover','shoot':'disparar','hop':'saltar','move the paddle':'mover la paleta',
    'move the bat':'mover el bate','walk':'caminar','jump':'saltar',
    'BLOCKS':'BLOQUES','RUN':'JUGAR','STOP':'PARAR','DOWNLOAD SCRIPT':'DESCARGAR CÓDIGO',
    'Show the instructions again':'Ver las instrucciones otra vez',
    'Sound on':'Sonido activado','Sound off':'Sonido apagado',
    'Put this game\'s code back the way it was':'Volver a poner el código de este juego como estaba',
    'Put this game\'s code back the way it was, bugs and all?':'¿Volver a poner el código de este juego como estaba, con bichos y todo?',
    'Save the code of this game as a PDF, to hand in':'Guarda el código de este juego como PDF para entregarlo',
    'Your name, for the top of the page:':'Tu nombre, para la parte de arriba de la página:',
    'Block code':'Código de bloques','Student:':'Estudiante:','Date:':'Fecha:','Bugs fixed:':'Bichos arreglados:',
    '(no name)':'(sin nombre)','(no blocks yet)':'(todavía no hay bloques)',
    'Teacher view — answer key loaded':'Vista del maestro — respuestas cargadas',
    'BUGS':'BICHOS','{n} left':'quedan {n}','Hint':'Pista',
    'GAME FIXED!':'¡JUEGO ARREGLADO!','Next game ▶':'Siguiente juego ▶',
    'You fixed all 18 bugs. You are a real debugger!':'Arreglaste los 18 bichos. ¡Eres un verdadero depurador!',
    'Press <b>RUN</b> to play':'Presiona <b>JUGAR</b> para jugar',
    'Bug Squad could not start':'Bug Squad no pudo arrancar',
    'Try a different browser, or ask a teacher.':'Prueba otro navegador o pregúntale al maestro.',
    'Lesson':'Lección','score':'puntos',
    'Delete this whole script, and every block under it?':'¿Borrar todo este guion y todos los bloques de abajo?',
    /* the six lessons and eighteen bugs */
    'Inside the loop = repeats. Outside = once.':'Dentro del bucle = se repite. Afuera = una vez.',
    '← does nothing':'← no hace nada',
    '<b>Ship</b>: drag <code>if key left arrow</code> into <code>forever</code>':'<b>Ship</b>: arrastra <code>if key left arrow</code> dentro de <code>forever</code>',
    'The laser won\'t fly':'El láser no vuela',
    '<b>Laser</b>: drag <code>change y by 0.5</code> into <code>repeat</code>':'<b>Laser</b>: arrastra <code>change y by 0.5</code> dentro de <code>repeat</code>',
    'The alien is invisible':'El alien es invisible',
    '<b>Alien</b>: drag <code>hide</code> into <code>if touching Laser</code>':'<b>Alien</b>: arrastra <code>hide</code> dentro de <code>if touching Laser</code>',
    '<b>+</b> up / right &nbsp; <b>−</b> down / left':'<b>+</b> arriba / derecha &nbsp; <b>−</b> abajo / izquierda',
    '↑ hops down':'↑ salta abajo',
    '<b>Frog</b>, when ↑: <code>-1.5</code> → <code>1.5</code>':'<b>Frog</b>, con ↑: <code>-1.5</code> → <code>1.5</code>',
    '↓ hops up':'↓ salta arriba',
    '<b>Frog</b>, when ↓: <code>1.5</code> → <code>-1.5</code>':'<b>Frog</b>, con ↓: <code>1.5</code> → <code>-1.5</code>',
    '→ hops left':'→ salta a la izquierda',
    '<b>Frog</b>, when →: <code>-1.5</code> → <code>1.5</code>':'<b>Frog</b>, con →: <code>-1.5</code> → <code>1.5</code>',
    '<b>x</b> ↔ &nbsp;&nbsp; <b>y</b> ↕':'<b>x</b> ↔ &nbsp;&nbsp; <b>y</b> ↕',
    '↑ goes right':'↑ va a la derecha',
    '<b>Chomper</b>, if ↑: <code>x</code> → <code>y</code>':'<b>Chomper</b>, si ↑: <code>x</code> → <code>y</code>',
    '↓ goes left':'↓ va a la izquierda',
    '<b>Chomper</b>, if ↓: <code>x</code> → <code>y</code>':'<b>Chomper</b>, si ↓: <code>x</code> → <code>y</code>',
    '→ goes up':'→ va arriba',
    '<b>Chomper</b>, if →: <code>y</code> → <code>x</code>':'<b>Chomper</b>, si →: <code>y</code> → <code>x</code>',
    '<b>&lt;</b> less than &nbsp; <b>&gt;</b> greater than':'<b>&lt;</b> menor que &nbsp; <b>&gt;</b> mayor que',
    'The ball shakes at the top':'La pelota tiembla arriba',
    '<b>Ball</b>: <code>y &gt; -9</code> → <code>y &lt; -9</code>':'<b>Ball</b>: <code>y &gt; -9</code> → <code>y &lt; -9</code>',
    'The ball always flies left':'La pelota siempre va a la izquierda',
    '<b>Ball</b>: <code>x &lt; 15</code> → <code>x &gt; 15</code>':'<b>Ball</b>: <code>x &lt; 15</code> → <code>x &gt; 15</code>',
    'The paddle won\'t go up':'La paleta no sube',
    '<b>Paddle</b>: <code>y &gt; 6</code> → <code>y &lt; 6</code>':'<b>Paddle</b>: <code>y &gt; 6</code> → <code>y &lt; 6</code>',
    'Sensing asks: <b>touching?</b> <b>pressed?</b>':'Los sensores preguntan: <b>¿tocando?</b> <b>¿presionada?</b>',
    '<b>Bat</b>: key <code>a</code> → <code>left arrow</code>':'<b>Bat</b>: tecla <code>a</code> → <code>left arrow</code>',
    'The ball goes through the bat':'La pelota atraviesa el bate',
    '<b>Ball</b>: <code>touching Brick</code> → <code>Bat</code>':'<b>Ball</b>: <code>touching Brick</code> → <code>Bat</code>',
    'Bricks never break':'Los ladrillos no se rompen',
    '<b>Brick</b>: <code>touching Bat</code> → <code>Ball</code>':'<b>Brick</b>: <code>touching Bat</code> → <code>Ball</code>',
    'Jump ↑ &nbsp; Fall ↓ &nbsp; Land ▁':'Salta ↑ &nbsp; Cae ↓ &nbsp; Aterriza ▁',
    'SPACE sinks the hero':'SPACE hunde al héroe',
    '<b>Hero</b>: <code>vy</code> <code>-0.5</code> → <code>0.5</code>':'<b>Hero</b>: <code>vy</code> <code>-0.5</code> → <code>0.5</code>',
    'No gravity':'No hay gravedad',
    'Add <code>change vy by -0.025</code> into <b>Hero</b>\'s <code>forever</code>':'Agrega <code>change vy by -0.025</code> dentro del <code>forever</code> del <b>Hero</b>',
    'The hero can\'t jump':'El héroe no puede saltar',
    '<b>Hero</b>: <code>y &gt; 0</code> → <code>y &lt; 0</code>':'<b>Hero</b>: <code>y &gt; 0</code> → <code>y &lt; 0</code>'
  });

  /* ==================================================== the objects */
  const actor = n => (window.VM ? VM.actorByName(n) : null);
  const AX = k => (window.BLOCKS ? BLOCKS.AXES.find(a=>a.v===k) : null);
  const wr = (a,k,val)=>{ const x=AX(k); if(a&&x) a[x.field]=x.sign*val; };

  let gi=0;                  // which game is on
  const kept={};             // a game's code while the student is away at another one
  let stars={}; try{ stars=JSON.parse(localStorage.getItem(STARS_KEY)||'{}')||{}; }catch(e){ stars={}; }
  const game = () => GAMES[gi];

  /* ==================================================== the scenery
     Flat coloured strips under the characters: a road, a court, some
     stars, a patch of grass. Scenery, not objects — nothing to program. */
  function strip(x0,y0,x1,y1,col,layer){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0, y1-y0),
      new THREE.MeshBasicMaterial({ color:col }));
    m.rotation.x=-Math.PI/2;
    m.position.set((x0+x1)/2, -0.05+0.001*(layer||0), -(y0+y1)/2);
    G.roomGroup.add(m); return m;
  }
  const W={ x0:-17, x1:17, y0:-10, y1:10 };           // the screen, in squares
  function build(){
    if(G.roomGroup) G.scene.remove(G.roomGroup);
    G.roomGroup=new THREE.Group(); G.scene.add(G.roomGroup);
    G.solids=[]; G.hits=[]; G.ceiling=null; G.ground=()=>0;
    G.scene.background=new THREE.Color('#0b0a1c');
    G.scene.fog=null;
    const w=game().world;
    strip(W.x0,W.y0,W.x1,W.y1, COSTUMES.SCREEN, 0);
    /* the four walls of the screen, so an edge is somewhere you can see */
    const e=0.15, wall='#3b3a6b';
    strip(W.x0-e,W.y1,W.x1+e,W.y1+e,wall,1); strip(W.x0-e,W.y0-e,W.x1+e,W.y0,wall,1);
    strip(W.x0-e,W.y0,W.x0,W.y1,wall,1);     strip(W.x1,W.y0,W.x1+e,W.y1,wall,1);
    if(w.stars){ let s=3; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
      for(let i=0;i<70;i++){ const x=W.x0+r()*34, y=W.y0+r()*20, z=0.06+r()*0.08;
        strip(x,y,x+z,y+z, r()<0.3?'#8fd3ff':'#d8d8ff', 2); } }
    if(w.road){
      strip(W.x0,-10,W.x1,-7.6,'#274d2b',1);                    // the start: grass
      strip(W.x0,-6.3,W.x1,-3.3,'#34344a',1); strip(W.x0,-1.5,W.x1,1.5,'#34344a',1);
      for(let x=-16;x<17;x+=3){ strip(x,-4.85,x+1.4,-4.75,'#e6d35a',2); strip(x,-0.05,x+1.4,0.05,'#e6d35a',2); }
      strip(W.x0,6.5,W.x1,10,'#274d2b',1);                      // the goal: grass
      strip(W.x0,6.4,W.x1,6.6,'#5dff7a',2);
    }
    if(w.maze){
      const b='#2b3bff', t=0.3;
      [[-15,-8.5,15,-8.5+t],[-15,8.2-t,15,8.2],[-15,-8.5,-15+t,8.2],[15-t,-8.5,15,8.2]]
        .forEach(q=>strip(q[0],q[1],q[2],q[3],b,1));
    }
    if(w.court){ for(let y=-9.5;y<10;y+=1.4) strip(-0.1,y,0.1,y+0.7,'#3b3a6b',1); }
    if(w.ground){ strip(W.x0,-10,W.x1,0,'#7a4a24',1); strip(W.x0,-0.5,W.x1,0,'#45b83a',2); }
  }

  /* ==================================================== loading a game */
  function cast(){
    const g=game();
    VM.project.actors.slice().forEach(a=>VM.delActor(a));
    g.cast.forEach(c=>{
      const a=VM.addActor({ name:c.name, shape:c.shape, colour:COSTUMES.C[c.shape].ink, size:1 });
      a.dir=0; a.tilt=0; a.roll=0; a.visible=c.visible!==false;
      wr(a,'x',c.x); wr(a,'y',c.y); a.y=1;
      a.vars={};
      VM.sync(a); VM.setHome(a);
    });
    VM.project.vars={ ...g.vars };
    VM.project.lists={}; VM.project.procs=VM.project.procs||[];
  }
  const handed = g => JSON.parse(JSON.stringify(g.code(teacher)));
  function given(code){
    const g=game(), all_=code || handed(g);
    g.cast.forEach(c=>{ const a=actor(c.name); if(a) a.scripts=JSON.parse(JSON.stringify(all_[c.name]||[])); });
  }
  function remember(){
    const g=game(), out={};
    g.cast.forEach(c=>{ const a=actor(c.name); out[c.name]=a ? a.scripts : []; });
    kept[g.id]=JSON.parse(JSON.stringify(out));
  }
  function load(i){
    if(VM.running) VM.stopAll();
    if(on) remember();
    gi=Math.max(0, Math.min(GAMES.length-1, i));
    try{ localStorage.setItem(GAME_KEY, String(gi)); }catch(e){}
    window.LEVELS=Object.assign(window.LEVELS||{}, { bugs:{ w:34, d:20 } });
    build();
    VM.enter(G.roomGroup);
    cast();
    given(kept[game().id]);
    fixedWas=null; celebrated=false; hints={};
    if(window.CODER){
      CODER.restrict(SHELF);
      CODER.setActor(actor(game().cast[0].name));
    }
    words();
  }
  function original(){
    if(!confirm(T('Put this game\'s code back the way it was, bugs and all?'))) return;
    VM.stopAll();
    delete kept[game().id];
    load(gi);
  }

  /* ======================================================== sounds */
  const SND=(function(){
    let ctx=null, on=true;
    try{ on=localStorage.getItem(SOUND_KEY)!=='off'; }catch(e){}
    function ac(){
      if(!ctx){ const A=window.AudioContext||window.webkitAudioContext; if(!A) return null;
        try{ ctx=new A(); }catch(e){ return null; } }
      if(ctx.state==='suspended') ctx.resume();
      return ctx;
    }
    function tone(f0, f1, dur, type, vol, delay){
      if(!on) return;
      const c=ac(); if(!c) return;
      const t0=c.currentTime+(delay||0);
      const o=c.createOscillator(), g=c.createGain();
      o.type=type||'square';
      o.frequency.setValueAtTime(f0,t0);
      if(f1) o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
      g.gain.setValueAtTime(vol||0.04,t0);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0+dur+0.02);
    }
    return {
      wake(){ if(on) ac(); },
      squash(){ tone(300, 900, 0.12, 'square', 0.04); tone(1200, 0, 0.1, 'square', 0.03, 0.12); },
      win(){ [523,659,784,1047].forEach((f,i)=>tone(f,0,0.16,'square',0.035,i*0.13)); },
      get on(){ return on; },
      set on(v){ on=!!v; try{ localStorage.setItem(SOUND_KEY, on?'on':'off'); }catch(e){} }
    };
  })();

  /* ============================================== checking the bugs */
  let fixedWas=null, celebrated=false, hints={}, beat=0;
  function status(){
    return game().bugs.map(b=>{ try{ return !!b.ok(); }catch(e){ return false; } });
  }
  function checkBugs(){
    const now=status();
    const key_=now.join();
    if(fixedWas!==null && key_!==fixedWas){
      const before=fixedWas.split(',');
      if(now.some((x,i)=>x && before[i]!=='true')) SND.squash();
    }
    fixedWas=key_;
    const done=now.every(Boolean);
    if(done && !stars[game().id]){ stars[game().id]=true;
      try{ localStorage.setItem(STARS_KEY, JSON.stringify(stars)); }catch(e){} }
    if(done && !celebrated){ celebrated=true; SND.win(); }
    if(!done) celebrated=false;
    bugPanel(now);
    levels();
  }
  /* THE BUGS ARE THREE BUTTONS. Nothing to read until you ask: click a
     bug and one line says what is wrong; click 💡 and one line says where. */
  let openBug=-1;
  function bugPanel(now){
    const el=$('#bsBugs'); if(!el) return;
    now = now || status();
    const g=game(), done=now.every(Boolean), last=gi===GAMES.length-1;
    if(openBug>=0 && now[openBug]) openBug=-1;
    const b=openBug>=0 ? g.bugs[openBug] : null;
    const html=`
      <div class="bs-row">
        ${g.bugs.map((x,i)=>`<button class="bs-bug${now[i]?' ok':''}${i===openBug?' on':''}" data-bug="${i}"
            ${now[i]?'disabled':''}>${now[i]?'✅':'🐞'}</button>`).join('')}
        ${done ? `<b class="bs-won">🏆</b>${last?'':`<button class="dn-btn bs-next" id="bsNext">▶</button>`}` : ''}
      </div>
      ${b ? `<div class="bs-pop"><span>${T(b.what)}</span>
          ${hints[openBug] ? `<small>💡 ${T(b.hint)}</small>`
                           : `<button class="bs-hbtn" id="bsHint" title="${T('Hint')}">💡</button>`}</div>` : ''}`;
    if(el.dataset.html!==html){
      el.dataset.html=html; el.innerHTML=html;
      el.querySelectorAll('[data-bug]').forEach(x=>x.onclick=()=>{ const i=+x.dataset.bug;
        openBug = openBug===i ? -1 : i; bugPanel(); });
      const h=$('#bsHint'); if(h) h.onclick=()=>{ hints[openBug]=true; bugPanel(); };
      const nx=$('#bsNext'); if(nx) nx.onclick=()=>{ load(gi+1); intro(); };
    }
  }
  function levels(){
    const el=$('#bsLevels'); if(!el) return;
    const html=GAMES.map((g,i)=>`<button class="bs-lvl${i===gi?' on':''}${stars[g.id]?' star':''}" data-g="${i}"
        title="${T(g.name)}">${g.icon}</button>`).join('');
    if(el.dataset.html!==html){
      el.dataset.html=html; el.innerHTML=html;
      el.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{ b.blur(); load(+b.dataset.g); intro(); });
    }
  }

  /* ============================================= the code, as a PDF
     The same hand-written PDF Dino Run makes: this game's code, every
     object under its own heading, with how many bugs are fixed. */
  const ASCII = str => String(str==null?'':str).normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/▶ */g,'').replace(/[−–—]/g,'-').replace(/×/g,'*').replace(/÷/g,'/')
    .replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,'...')
    .replace(/[^\x20-\x7e]/g,'?');
  function inline(bk){
    const bd=window.BLOCKS && BLOCKS.of(bk.op); if(!bd) return bk.op;
    return BLOCKS.parts(bd.label).map(seg=>{
      if(seg[0]!=='%') return seg;
      const k=seg[1], sp=bd.args[k]||{}, val=(bk.args||{})[k];
      if(val && typeof val==='object' && val.op){
        const kd=(BLOCKS.of(val.op)||{}).kind;
        return kd==='bool' ? '<'+inline(val)+'>' : '('+inline(val)+')';
      }
      if(sp.type==='bool') return '< >';
      if(sp.type==='num' || sp.type==='str') return '('+(val==null?'':val)+')';
      return '['+(val==null?'':val)+']';
    }).join('');
  }
  function lines(list, depth, out){
    const pad='    '.repeat(depth);
    (list||[]).forEach(bk=>{
      out.push(pad+inline(bk));
      const kd=(BLOCKS.of(bk.op)||{}).kind;
      if(kd==='c' || kd==='c2'){
        lines(bk.body, depth+1, out);
        if(kd==='c2'){ out.push(pad+'else'); lines(bk.body2, depth+1, out); }
        out.push(pad+'end');
      }
    });
    return out;
  }
  function scriptText(name){
    const a=actor(name), out=[];
    (a && a.scripts || []).forEach((sc,i)=>{
      if(i) out.push('');
      if(sc.hat){ out.push(inline(sc.hat)); lines(sc.body, 1, out); }
      else lines(sc.body, 0, out);
    });
    return out.length ? out : [T('(no blocks yet)')];
  }
  function pdf(rows){
    const W_=612, H=792, M=54, LH=13, COLS=84, PER=Math.floor((H-2*M)/LH);
    const wrapped=[];
    rows.forEach(r=>{
      let s=ASCII(r.t), lead=(s.match(/^ */)||[''])[0]+'      ';
      if(!s.length){ wrapped.push({ t:'', b:r.b }); return; }
      while(s.length>COLS){ wrapped.push({ t:s.slice(0,COLS), b:r.b }); s=lead+s.slice(COLS); }
      wrapped.push({ t:s, b:r.b });
    });
    const pages=[];
    for(let i=0;i<wrapped.length;i+=PER) pages.push(wrapped.slice(i,i+PER));
    const esc=s=>s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
    const objs=[];
    objs[0]='<< /Type /Catalog /Pages 2 0 R >>';
    objs[2]='<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
    objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>';
    const kids=[];
    pages.forEach((pg,n)=>{
      const pageNo=6+n*2, streamNo=pageNo+1;
      let body='BT\n'+LH+' TL\n'+M+' '+(H-M)+' Td\n';
      pg.forEach(r=>{ body+=(r.b?'/F2':'/F1')+' 10 Tf\n('+esc(r.t)+') Tj T*\n'; });
      body+='/F1 8 Tf\nET\nBT /F1 8 Tf '+(W_-M-60)+' '+(M/2)+' Td (page '+(n+1)+' of '+pages.length+') Tj ET\n';
      objs[pageNo-1]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W_+' '+H+'] '+
        '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+streamNo+' 0 R >>';
      objs[streamNo-1]='<< /Length '+body.length+' >>\nstream\n'+body+'endstream';
      kids.push(pageNo+' 0 R');
    });
    objs[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
    objs[4]='<< /Producer (Bug Squad) >>';
    let out='%PDF-1.4\n'; const at=[];
    objs.forEach((o,i)=>{ at[i]=out.length; out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'; });
    const xref=out.length;
    out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+
      at.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+
      'trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R /Info 5 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
    return out;
  }
  function handIn(name){
    const g=game(), now=status();
    const labels=[T('Student:'), T('Date:'), T('Bugs fixed:')];
    const w=Math.max(...labels.map(l=>l.length))+2;
    const rows=[
      { t:'BUG SQUAD - '+g.name.toUpperCase()+' - '+T('Block code'), b:true },
      { t:'' },
      { t:labels[0].padEnd(w)+(name||T('(no name)')) },
      { t:labels[1].padEnd(w)+new Date().toLocaleString(window.LANG==='es'?'es':'en') },
      { t:labels[2].padEnd(w)+now.filter(Boolean).length+' / '+now.length }
    ];
    g.cast.forEach(c=>{
      rows.push({ t:'' }, { t:'' }, { t:c.name.toUpperCase(), b:true }, { t:'' });
      scriptText(c.name).forEach(s=>rows.push({ t:s }));
    });
    return rows;
  }
  function download(){
    let name=''; try{ name=localStorage.getItem(NAME_KEY)||''; }catch(e){}
    const typed=prompt(T('Your name, for the top of the page:'), name);
    if(typed===null) return;
    name=typed.trim();
    try{ localStorage.setItem(NAME_KEY, name); }catch(e){}
    const blob=new Blob([pdf(handIn(name))], { type:'application/pdf' });
    const a=document.createElement('a');
    const slug=(name||'student').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'student';
    a.href=URL.createObjectURL(blob);
    a.download='bug-squad-'+game().id+'-'+slug+'.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  }

  /* ==================================================== the screen */
  function board(){
    const el=$('#dnScore'); if(!el) return;
    const has_='score' in VM.project.vars;
    const n=parseFloat(VM.project.vars.score);
    const html = has_ ? `${T('score').toUpperCase()} ${isFinite(n)?Math.floor(n):0}` : '';
    if(el.innerHTML!==html) el.innerHTML=html;
  }
  function message(){
    const el=$('#dnMsg'); if(!el) return;
    const want = VM.running ? '' : `<small class="dn-start">▶ ${T('RUN')}</small>`;
    if(el.dataset.html!==want){ el.dataset.html=want; el.innerHTML=want; }
    el.classList.toggle('hidden', !want);
  }
  function buttons(){
    const run=$('#dnRun');
    if(run){ const live=VM.running, label=live ? '■ '+T('STOP') : '▶ '+T('RUN');
      if(run.textContent!==label) run.textContent=label;
      run.classList.toggle('live', live); }
  }
  const LANG_BTN = () => window.LANG==='es' ? '🌐 English' : '🌐 Español';
  function words(){
    const tip=(s,h)=>{ const e=$(s); if(e) e.title=T(h); };
    const set=(s,h)=>{ const e=$(s); if(e) e.innerHTML=h; };
    set('#dnOpen', '▦ '+T('BLOCKS'));
    const snd=$('#dnSound'); if(snd) snd.textContent = SND.on ? '🔊' : '🔇';
    tip('#dnSound', SND.on ? 'Sound on' : 'Sound off');
    set('#dnLang', window.LANG==='es' ? 'EN' : 'ES');
    tip('#dnLang', window.LANG==='es' ? 'English' : 'Español');
    tip('#dnHelp','How to play'); tip('#dnReset','Start this game over');
    tip('#dnPdf','Download my code');
    const tb=$('#dnTeacher'); if(tb) tb.textContent=T('Teacher view');
    if(briefOpen()) (tourAt<0 ? intro : tour)(tourAt<0 ? undefined : tourAt);
    message(); buttons(); fixedWas=null; bugPanel(); levels();
    if(window.CODER && CODER.open) CODER.render();
  }
  /* THE TOUR: one big picture and one line a card, clicked through */
  const TOUR=[
    ['🕹️','BUG SQUAD','Six arcade games. All broken.'],
    ['▶','Run it','Watch what goes wrong.'],
    ['▦','Open the blocks','Drag, click, fix.'],
    ['🐞','Find the bugs','3 in every game. 💡 if stuck.']
  ];
  let tourAt=-1;
  const langBtn = () => `<button class="bs-lang" id="dnLang2">${window.LANG==='es'?'EN':'ES'}</button>`;
  function tour(i){
    tourAt=i;
    const el=$('#dnBrief .card'); if(!el) return;
    const [big,head,line]=TOUR[i], last=i===TOUR.length-1;
    $('#dnBrief').classList.remove('hidden');
    el.innerHTML=`${langBtn()}
      <div class="bs-big">${big}</div>
      <h1>${T(head)}</h1>
      <p class="bs-line">${T(line)}</p>
      <div class="bs-dots">${TOUR.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div>
      <button class="btn good bs-go" id="dnGo">${last?T('Start')+' ▶':'▶'}</button>`;
    $('#dnGo').onclick=()=> last ? intro() : tour(i+1);
    $('#dnLang2').onclick=toggleLang;
  }
  /* EACH GAME OPENS ON ONE CARD: what it is, the one rule, the keys, Play */
  function intro(){
    tourAt=-1;
    const el=$('#dnBrief .card'); if(!el) return;
    const g=game();
    $('#dnBrief').classList.remove('hidden');
    el.innerHTML=`${langBtn()}
      <div class="bs-big">${g.icon}</div>
      <h1>${T(g.name)}</h1>
      <p class="bs-tag">${T(g.topic)}</p>
      <p class="bs-line">${T(g.lesson)}</p>
      <div class="bs-k">${g.keys.map(([k,w])=>`<span><kbd>${k}</kbd> ${T(w)}</span>`).join('')}</div>
      <button class="btn good bs-go" id="dnGo">▶ ${T('Play')}</button>`;
    $('#dnGo').onclick=()=>{ closeBrief(); go(); };
    $('#dnLang2').onclick=toggleLang;
  }
  const briefOpen = () => { const b=$('#dnBrief'); return !!b && !b.classList.contains('hidden'); };
  function closeBrief(){ $('#dnBrief').classList.add('hidden'); SND.wake(); }
  function setLang(l){
    window.LANG = l==='es' ? 'es' : 'en';
    document.documentElement.lang=window.LANG;
    try{ localStorage.setItem(LANG_KEY, window.LANG); }catch(e){}
    words();
  }
  const toggleLang = () => setLang(window.LANG==='es' ? 'en' : 'es');

  /* ==================================================== the camera
     Straight down and orthographic, framed on the whole arcade screen —
     and while the editor is open, fitted into the gap between the shelf
     and the script, above the bug list, so a fix can be run and watched
     without closing anything. */
  let cam=null;
  function gap(){
    const Wd=innerWidth, H=innerHeight;
    const bugs=$('#bsBugs'), bh=bugs ? bugs.offsetHeight+18 : 0;
    if(window.CODER && CODER.open){
      const p=$('#cPal'), s=$('#cScript'), bar=$('#cBar');
      const l=p ? p.getBoundingClientRect().right+8 : 0;
      const r=s ? s.getBoundingClientRect().left-8 : Wd;
      const t=bar ? bar.getBoundingClientRect().bottom+8 : 0;
      if(r-l > 180) return { l, t, r, b:H-bh, coding:true };
    }
    const top=$('#bsTop'), tb=top ? top.getBoundingClientRect().bottom+8 : 0;
    return { l:0, t:tb, r:Wd, b:H-bh, coding:false };
  }
  function camera(){
    const Wd=innerWidth, H=Math.max(1,innerHeight);
    const R=gap(), pad=0.6;
    const win={ x0:W.x0-pad, x1:W.x1+pad, y0:W.y0-pad, y1:W.y1+pad };
    const rw=Math.max(1,R.r-R.l), rh=Math.max(1,R.b-R.t);
    const u=Math.max((win.x1-win.x0)/rw, (win.y1-win.y0)/rh);
    const xc=(win.x0+win.x1)/2, yc=(win.y0+win.y1)/2;
    const cx=(R.l+R.r)/2, cy=(R.t+R.b)/2;
    if(!cam) cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,400);
    cam.left=xc-cx*u; cam.right=cam.left+Wd*u;
    cam.top=yc+cy*u;  cam.bottom=cam.top-H*u;
    cam.position.set(0,120,0); cam.up.set(0,0,-1); cam.lookAt(0,0,0);
    cam.updateProjectionMatrix();
    G.camera=cam;
    /* the bug list sits under the screen, as wide as the gap allows */
    const bugs=$('#bsBugs');
    if(bugs){ const w=Math.min(640, Math.max(260, rw-16));
      bugs.style.width=w+'px'; bugs.style.left=((R.l+R.r)/2 - w/2)+'px'; }
    const sc=$('#dnScore'), msg=$('#dnMsg');
    const sx = x => (x-cam.left)/u, sy = y => (cam.top-y)/u;       // squares → pixels
    if(sc){ sc.style.right=(Wd-sx(W.x1)+10)+'px'; sc.style.top=(sy(W.y1)+8)+'px'; }
    if(msg){ msg.style.left=((R.l+R.r)/2)+'px'; msg.style.top=(sy(W.y1)+10)+'px';
             msg.style.maxWidth=Math.max(160, rw-24)+'px'; }
  }
  function world(ev){
    const c=$('#view').getBoundingClientRect();
    const fx=(ev.clientX-c.left)/c.width, fy=(ev.clientY-c.top)/c.height;
    return { x:cam.left+fx*(cam.right-cam.left), y:cam.top-fy*(cam.top-cam.bottom) };
  }
  /* CLICK A CHARACTER AND READ ITS CODE */
  function pickAt(ev){
    if(!cam || briefOpen()) return;
    const p=world(ev);
    const names=game().cast.map(c=>c.name);
    const cands=VM.project.actors.filter(a=>a.visible!==false)
      .sort((a,b)=>names.indexOf(a.name)-names.indexOf(b.name));
    let a=cands.find(o=>COSTUMES.hit(o,p.x,p.y)) || cands.find(o=>COSTUMES.hit(o,p.x,p.y,true));
    if(!a) return;
    if(a.isClone) a=actor(a.name);
    if(a && window.CODER){ CODER.setActor(a); CODER.show(); }
  }

  /* ==================================================== playing */
  function go(){
    if(VM.running) return;
    const f=document.activeElement;
    if(f && f.tagName==='BUTTON') f.blur();
    SND.wake();
    VM.greenFlag();
  }
  const typing = el => !!(el && (el.tagName==='INPUT' || el.tagName==='TEXTAREA' ||
                                 el.tagName==='SELECT' || el.isContentEditable));
  function keys(e){
    if(typing(e.target)) return;
    if(briefOpen()){ if((e.code==='Space'||e.code==='Enter') && !e.repeat){ e.preventDefault(); const b=$('#dnGo'); if(b) b.click(); } return; }
    /* ENTER is Run: SPACE belongs to the games (shooting, jumping) */
    if(e.code==='Enter' && !e.repeat && !VM.running){ e.preventDefault(); go(); }
  }

  /* ==================================================== in */
  let on=false;
  function start(){
    G.room='bugs';
    VM.useScratch();
    let g0=0; try{ g0=parseInt(localStorage.getItem(GAME_KEY),10)||0; }catch(e){}
    let l='en'; try{ l=localStorage.getItem(LANG_KEY)||'en'; }catch(e){}
    window.LANG = l==='es' ? 'es' : 'en';
    load(g0);
    on=true;
    if(teacher) $('#dnTeacher').classList.remove('hidden');
    camera();
    $('#view').addEventListener('pointerdown', pickAt);
    addEventListener('keydown', keys);
    addEventListener('pointerdown', ()=>SND.wake(), { once:true });
    $('#dnOpen').onclick=()=>{ if(window.CODER) CODER.toggle(); };
    $('#dnRun').onclick=()=>{ if(VM.running) VM.stopAll(); else go(); };
    $('#dnHelp').onclick=()=>tour(0);
    $('#dnSound').onclick=()=>{ SND.on=!SND.on; if(SND.on) SND.wake(); words(); };
    $('#dnLang').onclick=toggleLang;
    $('#dnReset').onclick=original;
    $('#dnPdf').onclick=download;
    document.querySelectorAll('#bsTop .dn-btn').forEach(b=>b.addEventListener('click', ()=>b.blur()));
    setLang(window.LANG);
    tour(0);
  }
  function step(dt){
    if(!on) return;
    VM.step(dt);
    VM.project.actors.forEach(a=>{ if(a.y!==1){ a.y=1; VM.sync(a); } });
    beat+=dt;
    if(beat>0.25){ beat=0; checkBugs(); }
  }
  function draw(dt){
    if(!on) return;
    camera();
    if(window.CODER) CODER.tick(dt);
    const coding=!!(window.CODER && CODER.open);
    const hud=$('#dino'); if(hud) hud.classList.toggle('coding', coding);
    board(); buttons(); message();
  }

  return { start, step, draw, load, status, GAMES, SHELF, handed,
           pick(i){ gi=i; },                   // for the tests: choose a game without a screen
           scriptText, handIn, pdf,
           get gi(){ return gi; }, get teacher(){ return teacher; }, get active(){ return on; } };
})();
