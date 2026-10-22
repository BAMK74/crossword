// Search code for building packed arrow-word puzzles (used by build-puzzles.js).
// Needs CLUE, shuffle and findRuns from ../generator.js.
//
// Rules: every square is a letter or a clue square; every run of 2+ letters is a word
// from the list, used once; every letter is in at least one word; every word's clue
// fits in a clue square touching its first letter (see findRuns); each clue square
// holds one or two clues.
// Two steps: a local search finds a pattern of clue squares that obeys the rules, then
// the words are filled in, most constrained word first.

const OPEN = "?"; // a letter square in a pattern, before filling

function makeLexicon(words, maxLen) {
  const byLen = [];
  for (const w of new Set(words)) if (w.length >= 2 && w.length <= maxLen) (byLen[w.length] ||= []).push(w);
  return { byLen };
}

// Gives every run a host clue square (at most 2 clues each) so that every clue square
// gets at least one clue. Returns the host index per run, or null if impossible.
function assignClues(g, runs) {
  const clueCells = [];
  g.forEach((v, i) => { if (v === CLUE) clueCells.push(i); });
  const byCell = new Map(clueCells.map(i => [i, []]));
  runs.forEach((run, ri) => run.hosts.forEach(h => byCell.get(h.cell).push(ri)));
  const hostOf = new Array(runs.length).fill(-1);
  const load = new Map(clueCells.map(i => [i, []]));

  // Phase 1: one run for each clue square (bipartite matching).
  const firstOf = new Map();
  const claim = (cell, seen) => {
    for (const ri of byCell.get(cell)) {
      if (seen.has(ri)) continue;
      seen.add(ri);
      if (!firstOf.has(ri) || claim(firstOf.get(ri), seen)) { firstOf.set(ri, cell); return true; }
    }
    return false;
  };
  for (const cell of clueCells) if (!claim(cell, new Set())) return null;
  for (const [ri, cell] of firstOf) {
    hostOf[ri] = runs[ri].hosts.findIndex(h => h.cell === cell);
    load.get(cell).push(ri);
  }

  // Phase 2: a host for every other run. A full square can make room by moving one of
  // its runs elsewhere, so no square ever loses its last clue.
  const place = (ri, seen) => {
    for (let hi = 0; hi < runs[ri].hosts.length; hi++) {
      const cell = runs[ri].hosts[hi].cell;
      if (seen.has(cell)) continue;
      seen.add(cell);
      const here = load.get(cell);
      const moved = here.length < 2 ? null : here.find(rj => place(rj, seen));
      if (here.length < 2 || moved !== undefined) {
        if (moved != null) here.splice(here.indexOf(moved), 1);
        here.push(ri);
        hostOf[ri] = hi;
        return true;
      }
    }
    return false;
  };
  for (let ri = 0; ri < runs.length; ri++) {
    if (hostOf[ri] === -1 && !place(ri, new Set())) return null;
  }
  return hostOf;
}

// Squares that break a rule (and so are worth flipping), for the local search.
function patternProblems(N, g, maxLen, lex) {
  const runs = findRuns(N, g);
  const bad = new Set(), covered = new Set(), hosted = new Set();
  for (const run of runs) {
    run.cells.forEach(i => covered.add(i));
    run.hosts.forEach(h => hosted.add(h.cell));
    if (run.cells.length > maxLen || !lex.byLen[run.cells.length]) run.cells.forEach(i => bad.add(i));
    if (!run.hosts.length) bad.add(run.cells[0]);
  }
  g.forEach((v, i) => {
    if (v === CLUE ? !hosted.has(i) : !covered.has(i)) bad.add(i);
  });
  return { runs, bad };
}

function makePattern(N, maxLen, lex, clueChance, steps) {
  const g = Array.from({ length: N * N }, () => (Math.random() < clueChance ? CLUE : OPEN));
  g[0] = CLUE;
  let { runs, bad } = patternProblems(N, g, maxLen, lex);
  for (let step = 0; step < steps; step++) {
    if (!bad.size) {
      const hostOf = assignClues(g, runs);
      if (hostOf) return { g, runs, hostOf };
      bad = new Set([1 + Math.floor(Math.random() * (N * N - 1))]); // stuck: shake things up
    }
    // Flip a broken square or one of its neighbours (never the top-left corner).
    const list = [...bad], i = list[Math.floor(Math.random() * list.length)];
    const nbrs = [i, i - 1, i + 1, i - N, i + N].filter(j => j > 0 && j < N * N && Math.abs((j % N) - (i % N)) <= 1);
    const j = nbrs[Math.floor(Math.random() * nbrs.length)];
    g[j] = g[j] === CLUE ? OPEN : CLUE;
    const next = patternProblems(N, g, maxLen, lex);
    if (next.bad.size <= bad.size || Math.random() < 0.1) ({ runs, bad } = next);
    else g[j] = g[j] === CLUE ? OPEN : CLUE; // undo
  }
  return null;
}

// Fills the pattern's runs with distinct words. Returns the letters or null.
function fillPattern(N, pattern, lex, budget) {
  const { runs } = pattern;
  const letters = new Array(N * N).fill(null);
  const word = new Array(runs.length).fill(null);
  const used = new Set();
  let steps = 0;

  const candidates = ri => {
    const cells = runs[ri].cells, list = lex.byLen[cells.length] || [];
    return list.filter(w => !used.has(w) && cells.every((cell, k) => letters[cell] === null || letters[cell] === w[k]));
  };

  function rec() {
    if (++steps > budget) return false;
    // Most constrained run first.
    let best = -1, bestCands = null;
    for (let ri = 0; ri < runs.length; ri++) {
      if (word[ri]) continue;
      const cands = candidates(ri);
      if (!cands.length) return false;
      if (!bestCands || cands.length < bestCands.length) { best = ri; bestCands = cands; }
    }
    if (best === -1) return true;
    for (const w of shuffle(bestCands)) {
      const cells = runs[best].cells, newly = cells.filter(cell => letters[cell] === null);
      cells.forEach((cell, k) => (letters[cell] = w[k]));
      word[best] = w;
      used.add(w);
      if (rec()) return true;
      used.delete(w);
      word[best] = null;
      newly.forEach(cell => (letters[cell] = null));
      if (steps > budget) return false;
    }
    return false;
  }
  return rec() ? letters : null;
}
