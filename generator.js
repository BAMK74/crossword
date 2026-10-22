// Puzzle loading: picks one of the pre-built puzzles (puzzles.js, made by
// tools/build-puzzles.js) and attaches the clues (clues.js).
//
// Every square is either a letter or a clue square, as in printed arrow-words. Each
// word's clue sits in a clue square touching its first letter. Arrows:
//   "right"      clue left of an across word        →
//   "down"       clue above a down word             ↓
//   "down-right" clue above an across word (bent)   ↳
//   "right-down" clue left of a down word (bent)    ⤵

const DIRS = { across: [0, 1], down: [1, 0] };
const CLUE = "#";

// Puzzle difficulty: grid sizes are set by the build tool; here only the chance that a
// word with a picture gets a picture clue.
const PUZZLE_LEVELS = {
  easy: { imageChance: 0.9 },
  medium: { imageChance: 0.75 },
  hard: { imageChance: 0.5 },
};

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cellsOf(w) {
  const [dr, dc] = DIRS[w.dir];
  return [...w.answer].map((_, i) => [w.row + dr * i, w.col + dc * i]);
}

// All runs of 2+ letter squares in a flat N×N grid, with the clue squares that could
// hold their clue (straight arrow first, then bent). Shared with the build tool, which
// stores which of these hosts each run uses.
function findRuns(N, g) {
  const isL = (r, c) => r >= 0 && c >= 0 && r < N && c < N && g[r * N + c] !== CLUE;
  const runs = [];
  for (const dir of ["across", "down"]) {
    const [dr, dc] = DIRS[dir];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!isL(r, c) || isL(r - dr, c - dc) || !isL(r + dr, c + dc)) continue;
      const cells = [];
      for (let y = r, x = c; isL(y, x); y += dr, x += dc) cells.push(y * N + x);
      const hosts = [];
      if (r - dr >= 0 && c - dc >= 0) hosts.push({ cell: (r - dr) * N + (c - dc), arrow: dir === "across" ? "right" : "down" });
      if (r - dc >= 0 && c - dr >= 0 && !isL(r - dc, c - dr)) hosts.push({ cell: (r - dc) * N + (c - dr), arrow: dir === "across" ? "down-right" : "right-down" });
      runs.push({ row: r, col: c, dir, cells, hosts });
    }
  }
  return runs;
}

// Remembers recently played puzzles so a new game picks a different one.
const RECENT_KEY = "crossword-recent";
function recentPuzzles() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
}
function rememberPuzzle(id) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recentPuzzles().filter(x => x !== id)].slice(0, 30))); } catch {}
}

function generatePuzzle(lang, wantedLevel) {
  // If a level has no puzzles yet, use the closest one that has.
  const levelName = [wantedLevel, "medium", "easy", "hard"].find(l => PUZZLES[lang]?.[l]?.length);
  const list = PUZZLES[lang][levelName], level = PUZZLE_LEVELS[wantedLevel];
  const recent = recentPuzzles();
  const ids = list.map((_, i) => `${lang}-${levelName}-${i}`);
  const fresh = ids.filter(id => !recent.includes(id));
  // Least recently played first if every puzzle has been played.
  const id = fresh.length ? fresh[Math.floor(Math.random() * fresh.length)]
    : ids.slice().sort((a, b) => recent.indexOf(b) - recent.indexOf(a))[0];
  rememberPuzzle(id);
  const p = list[ids.indexOf(id)], N = p.size, g = [...p.grid];

  const runs = findRuns(N, g);
  const cells = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) =>
    g[r * N + c] === CLUE ? { type: "clue", clues: [] } : { type: "letter", letter: g[r * N + c], words: {} }));
  const words = runs.map((run, idx) => {
    const host = run.hosts[Number(p.hosts[idx])];
    const answer = run.cells.map(i => g[i]).join("");
    const [clue, image] = CLUES[lang][answer] || [answer, undefined];
    cells[(host.cell / N) | 0][host.cell % N].clues.push({ idx, arrow: host.arrow });
    return { answer, clue, image, row: run.row, col: run.col, dir: run.dir, arrow: host.arrow, owner: null,
      showImage: !!image && Math.random() < level.imageChance };
  });
  words.forEach((w, idx) => cellsOf(w).forEach(([r, c]) => (cells[r][c].words[w.dir] = idx)));
  // Clues whose arrow leaves from the right edge go on top, bottom-edge arrows below.
  const order = { right: 0, "right-down": 0, down: 1, "down-right": 1 };
  cells.flat().forEach(cell => cell.type === "clue" && cell.clues.sort((a, b) => order[a.arrow] - order[b.arrow]));
  return { rows: N, cols: N, cells, words };
}
