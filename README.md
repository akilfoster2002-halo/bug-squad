# Bug Squad — fix the broken arcade games

Six classic arcade games, and every one has **3 bugs** in its block code. Students press **RUN**,
watch what goes wrong, open the **BLOCKS** and fix it. The bug list under the screen turns each
🐞 into ✅ the moment its fix is in, and a fixed game earns a ⭐. About 20 minutes for all 18 bugs.

| # | Game | Lesson | The three bugs |
|---|---|---|---|
| 1 | 🚀 Space Blaster | Indentation | the ← `if` is outside the `forever`; the laser clone's `change y` is under the `repeat` instead of in it; `hide` is outside the `if touching Laser` |
| 2 | 🐸 Road Hopper | Plus and minus | ↑ hops down, ↓ hops up, → hops left |
| 3 | 🟡 Chomp | x and y | ↑ and ↓ change `x`; → changes `y` |
| 4 | 💣 Bomb Catch (Kaboom!) | `<` and `>` | the bomb never falls (`y > -9`) · the bomber gets stuck on the right (`x > -13`) · it says "You win!" before you catch anything (`score < 9`) |
| 5 | 🧱 Brick Smash | Sensing | `key a` instead of `left arrow`; the Ball bounces off `Brick` instead of `Bat`; a Brick breaks on `Bat` instead of `Ball` |
| 6 | 🍄 Jump Bros | Jumping | the jump speed is minus; the gravity block is **missing** (students add it); the landing test is `>` instead of `<` (the ground is marked `y = 0`) |

The screen stays quiet: a 4-card click-through to start, one card per game (icon, one-line rule,
keys, ▶ Play), icon buttons, and the bugs as three 🐞 buttons — click one for a single line saying
what is wrong, then 💡 for a hint that nudges (a question, never the answer). No game uses `and` / `or`. Everything is in English and Spanish (ES / EN), and the
block words stay English because they are the code.

## The editor

It is the same block editor as Pong, Asteroid Dodge and Dino Run (MESACS 0.2a), with three
changes made for debugging:

- **Every block is on the shelf**, in all eight categories, and variables and My Blocks can be made.
- **Blocks drop anywhere**: there is a gap above every block as well as at the end of every list,
  so a block can go between any two lines, into a loop or out of one.
- **Taking a block away takes only that block.** ✕, Backspace, or dragging it back onto the shelf
  removes it, and a `forever`, `repeat` or `if` that is removed leaves the blocks it held where it
  stood. Deleting a whole script (the ✕ on its `when` block) asks first.

Code lasts until the page is refreshed, and each game keeps its own code while you visit the
others. **↺** puts the current game back the way it started, bugs and all. Nothing a student does is kept
between visits: stars, the game they were on and their name last only while the page is open, and
every visit starts fresh from game 1. Only the language and sound settings are remembered.
**⤓ DOWNLOAD SCRIPT** saves the current game's code as a PDF to hand in, with the number of bugs
fixed.

**Completion badge:** once all six games have their ⭐ (in one sitting — a refresh starts over), a card opens (and a 🏅 button stays under
the bug list): the student types their name, sees the badge, and presses **⤓ Download badge**. It
saves a PNG (`bug-squad-badge-<name>.png`) with their name, "Master Debugger", the six games and the
date, ready to upload to Google Classroom (Add or create → File).

**Teacher mode:** press 🔑 and type **1234**. Every game then shows **✅ Answer** (load the fixed
code, to play it and read it) and **🐞 Bugs** (put the broken code back). Stars are not given in
teacher mode, and it lasts until the tab is closed (🔑 again to leave). The code is only a
convenience, not security: it is in the page. `?answer` on the address still opens every game fixed.

## Play it online

- **https://bug-squad-6gxr.onrender.com** (its own Render static site, redeploys on every push to
  github.com/akilfoster2002-halo/bug-squad)
- **https://mesacs-0-2.onrender.com/5/** (the 0.2 site)

The folder is worked on here in MESACS_0.2 (`5/`), and the bug-squad repo is brought up to date with

```bash
git subtree push --prefix=5 bug-squad main
```

## Running it

A plain static folder: no build, no install, no network. Double-click `index.html`, or:

```bash
python3 -m http.server 8797
```

```bash
npm test     # headless: every bug starts broken, the answer key fixes all 18, and the fixed games play
```

## How it is built

| file | job |
|---|---|
| `blocks.js`, `vm.js`, `strings.js`, `app.css`, `fonts/`, `lib/` | the 0.2a framework, copied from Dino Run |
| `coder.js` | the editor, with the three changes above |
| `costumes.js` | the pixel art for all six games, one colour each |
| `games.js` | the six games: cast, buggy code, answer key, bug checks, hints, Spanish |
| `boot.js` | renderer, keyboard and a fixed 60-per-second frame loop |

A bug counts as fixed by **reading the blocks**, the way a teacher looking over a shoulder would:
each check asks for the right shape and, where the wrong block could be left behind, for it to be
gone. A key's `if` only counts when it sits straight inside the loop, not tucked inside another `if`.
