/* Every game: the bugs start broken, the answer key fixes all of them,
   and the answer key actually plays the way the bug list says. */
const test = require('node:test');
const assert = require('node:assert');
const { arcade } = require('./harness');

const N = 6;

for(let i=0;i<N;i++){
  test(`game ${i+1}: every bug starts broken`, ()=>{
    const d=arcade(i,false);
    assert.deepStrictEqual(d.BUGS.status(), d.g.bugs.map(()=>false), d.g.name);
  });
  test(`game ${i+1}: the answer key fixes every bug`, ()=>{
    const d=arcade(i,true);
    assert.deepStrictEqual(d.BUGS.status(), d.g.bugs.map(()=>true), d.g.name);
  });
  test(`game ${i+1}: the answer key runs for ten seconds without a script error`, ()=>{
    const d=arcade(i,true);
    const warn=console.warn; let errs=0; console.warn=()=>{ errs++; };
    d.VM.greenFlag(); d.step(600);
    console.warn=warn;
    assert.strictEqual(errs, 0);
  });
}

test('1 Space Blaster: fixed, the laser flies up and the ship moves both ways', ()=>{
  const d=arcade(0,true);
  d.VM.greenFlag(); d.step(2);
  const ship=d.who('Ship'), x0=ship.x;
  d.G.keys.ArrowLeft=true; d.step(10); d.G.keys.ArrowLeft=false;
  assert.ok(ship.x < x0-3, 'left moves');
  d.G.keys.Space=true; d.step(2); d.G.keys.Space=false; d.step(20);
  const shots=()=>d.VM.project.actors.filter(a=>a.name==='Laser' && a.isClone);
  assert.ok(shots().some(l=>d.y(l) > -2), 'laser flew');
  /* SPACE again fires a second laser; the first one keeps flying */
  const first=shots()[0], was=d.y(first);
  d.G.keys.Space=true; d.step(2); d.G.keys.Space=false; d.step(2);
  assert.strictEqual(shots().length, 2);
  assert.ok(d.y(first) > was, 'the first laser was not reset');
});
test('1 Space Blaster: buggy, left does nothing', ()=>{
  const d=arcade(0,false);
  d.VM.greenFlag(); d.step(2);
  const ship=d.who('Ship'), x0=ship.x;
  d.G.keys.ArrowLeft=true; d.step(10);
  assert.strictEqual(ship.x, x0);
});
test('2 Road Hopper: fixed, up goes up', ()=>{
  const d=arcade(1,true);
  d.VM.greenFlag(); d.step(2);
  d.G.keys.ArrowUp=true; d.step(2); d.G.keys.ArrowUp=false; d.step(1);
  assert.ok(d.y(d.who('Frog')) > -9);
});
test('4 Bomb Catch: buggy, the bomb never falls; fixed, it falls and comes back', ()=>{
  const bad=arcade(3,false); bad.VM.greenFlag(); bad.step(30);
  assert.ok(bad.y(bad.who('Bomb')) > 5);
  const ok=arcade(3,true); ok.VM.greenFlag(); ok.step(30);
  assert.ok(ok.y(ok.who('Bomb')) < 1);
  ok.step(60); assert.ok(ok.y(ok.who('Bomb')) > 0, 'back at the top after missing');
});
test('4 Bomb Catch: buggy, the bomber gets stuck at the right wall (and stays on screen)', ()=>{
  const d=arcade(3,false); d.VM.greenFlag(); d.step(600);
  const x=d.who('Bomber').x; assert.ok(x>12 && x<14, 'x = '+x);
});
test('4 Bomb Catch: fixed, the bomber turns round at both walls', ()=>{
  const d=arcade(3,true); d.VM.greenFlag();
  let lo=0, hi=0;
  for(let i=0;i<600;i++){ d.step(1); const x=d.who('Bomber').x; lo=Math.min(lo,x); hi=Math.max(hi,x); }
  assert.ok(hi>12.9 && lo<-12.9);
});
test('5 Brick Smash: fixed, seven bricks appear and the ball can break one', ()=>{
  const d=arcade(4,true);
  d.VM.greenFlag(); d.step(12);
  assert.strictEqual(d.VM.project.actors.filter(a=>a.name==='Brick' && a.isClone).length, 7);
  d.step(600);
  assert.ok(+d.VM.project.vars.score >= 1, 'a brick broke');
});
test('no game uses `and` or `or` (not taught yet)', ()=>{
  const d=arcade(0,true);
  const txt=JSON.stringify(d.BUGS.GAMES.map(g=>[g.code(true), g.code(false)]));
  assert.ok(!/"op\.(and|or)"/.test(txt));
});
test('6 Jump Bros: fixed, SPACE jumps and the hero lands again', ()=>{
  const d=arcade(5,true);
  d.VM.greenFlag(); d.step(2);
  d.G.keys.Space=true; d.step(3); d.G.keys.Space=false;
  d.step(15);
  const hero=d.who('Hero');
  assert.ok(d.y(hero) > 2, 'in the air');
  d.step(60);
  assert.strictEqual(d.y(hero), 0, 'landed');
});
test('6 Jump Bros: fixed, a jump clears the mushroom', ()=>{
  const d=arcade(5,true);
  d.VM.greenFlag(); d.step(2);
  const hero=d.who('Hero');
  d.G.keys.ArrowRight=true;
  let hits=0;
  for(let f=0; f<60*9; f++){
    const m=d.who('Mushroom');
    const gap=(m.x-1)-(hero.x+0.7);
    d.G.keys.Space = gap>0 && gap<3;
    d.step(1);
    if(hero.x < -12.9 && f>30) hits++;
  }
  assert.strictEqual(hits, 0, 'never sent back to the start');
});

test('1 Space Blaster: the left-arrow `if` dropped INSIDE the right-arrow `if` is still a bug', ()=>{
  const d=arcade(0,false);
  const body=d.who('Ship').scripts[0].body;          // goto, if left, forever
  const left=body.splice(1,1)[0];
  body[1].body[0].body.push(left);                    // into `if key right arrow pressed`
  assert.strictEqual(d.BUGS.status()[0], false);
  body[1].body[0].body.pop(); body[1].body.push(left);  // now beside it, in the forever
  assert.strictEqual(d.BUGS.status()[0], true);
});
