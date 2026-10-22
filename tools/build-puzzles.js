// Builds the pre-made puzzles in ../puzzles.js from the word lists in wordlists/.
// Runs with the JavaScript built into macOS (no install needed), from the crossword folder:
//
//   osascript -l JavaScript tools/build-puzzles.js "$PWD"            all languages and levels
//   osascript -l JavaScript tools/build-puzzles.js "$PWD" de hard    just German, hard
//   osascript -l JavaScript tools/build-puzzles.js "$PWD" de all tools/out/de.js 600
//                    write to another file (to build languages in parallel), 600s per level
//   osascript -l JavaScript tools/build-puzzles.js "$PWD" merge de:tools/out/de.js
//                    copy a language from such a file into puzzles.js
//   osascript -l JavaScript tools/build-puzzles.js "$PWD" merge +de.hard:tools/out/de-hard2.js
//                    add a level's puzzles to the ones already in puzzles.js
//
// Puzzles for other languages/levels already in puzzles.js are kept. Afterwards,
// tools/out/missing-clues-<lang>.txt lists words used in puzzles that have no clue in
// clues.js yet; the game shows the bare word for those, so add them.

ObjC.import("Foundation");

const LEVELS = {
  easy: { size: 6, maxLen: 5, count: 8, seconds: 40 },
  medium: { size: 8, maxLen: 7, count: 8, seconds: 120 },
  hard: { size: 10, maxLen: 9, count: 6, seconds: 300 },
};
const LANGS = ["en", "fr", "de", "es"];
const CLUE_CHANCE = 0.3;     // starting share of clue squares in a pattern
const PATTERN_STEPS = 3000;
const FILL_BUDGET = 6000;
const FILLS_PER_PATTERN = 4;

function read(path) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
  return s.isNil() ? null : s.js;
}
function write(path, text) {
  const dir = path.slice(0, path.lastIndexOf("/"));
  $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(dir, true, $(), null);
  $(text).writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null);
}
const log = msg => console.log(msg);
// Runs a source file in the global scope, so files can use each other's names.
const load = src => (0, eval)(src.replace(/^const /gm, "var "));

// Lower is better: few clue squares and few 2-letter words.
function score(N, g, runs) {
  const clues = g.filter(v => v === CLUE).length;
  const short = runs.filter(r => r.cells.length === 2).length;
  return clues / (N * N) * 100 + short * 2;
}

function buildLevel(words, cfg) {
  const { size: N, maxLen } = cfg;
  const lex = makeLexicon(words, maxLen);
  const found = new Map();
  const start = Date.now();
  while (Date.now() - start < cfg.seconds * 1000) {
    const pattern = makePattern(N, maxLen, lex, CLUE_CHANCE, PATTERN_STEPS);
    if (!pattern) continue;
    for (let i = 0; i < FILLS_PER_PATTERN; i++) {
      const letters = fillPattern(N, pattern, lex, FILL_BUDGET);
      if (!letters) continue;
      const grid = pattern.g.map((v, k) => (v === CLUE ? CLUE : letters[k])).join("");
      if (!found.has(grid)) found.set(grid, { size: N, grid, hosts: pattern.hostOf.join(""), score: score(N, pattern.g, pattern.runs) });
      break;
    }
  }
  return [...found.values()].sort((a, b) => a.score - b.score).slice(0, cfg.count).map(({ score, ...p }) => p);
}

function run(argv) {
  const root = argv[0];
  if (!root) return "Usage: osascript -l JavaScript tools/build-puzzles.js <crossword folder> [lang] [level]";
  load(read(`${root}/generator.js`));
  load(read(`${root}/tools/packed.js`));
  load(read(`${root}/clues.js`) || "var CLUES = {};");
  load(read(`${root}/puzzles.js`) || "var PUZZLES = {};");
  let outFile = `${root}/puzzles.js`;

  if (argv[1] === "merge") {
    // Copy a language (or one level of it) from each file into puzzles.js,
    // e.g. "merge fr:tools/out/fr.js de.hard:tools/out/de-hard.js".
    const base = PUZZLES;
    // A leading "+" adds the file's puzzles to the ones already there instead.
    for (const spec of argv.slice(2)) {
      const add = spec.startsWith("+");
      const [what, file] = spec.replace(/^\+/, "").split(":"), [lang, level] = what.split(".");
      load(read(`${root}/${file}`));
      if (add && level) {
        const have = ((base[lang] ||= {})[level] ||= []);
        for (const p of PUZZLES[lang][level]) if (!have.some(q => q.grid === p.grid)) have.push(p);
      } else if (level) (base[lang] ||= {})[level] = PUZZLES[lang][level];
      else base[lang] = PUZZLES[lang];
    }
    PUZZLES = base;
  } else {
    const langs = argv[1] ? [argv[1]] : LANGS;
    const levels = argv[2] && argv[2] !== "all" ? [argv[2]] : Object.keys(LEVELS);
    if (argv[3]) outFile = `${root}/${argv[3]}`;
    for (const lang of langs) {
      const words = read(`${root}/tools/wordlists/${lang}.txt`).split(/\s+/).filter(Boolean);
      PUZZLES[lang] ||= {};
      for (const level of levels) {
        const cfg = { ...LEVELS[level], ...(argv[4] && { seconds: Number(argv[4]) }) };
        log(`${lang} ${level}: building for ${cfg.seconds}s…`);
        PUZZLES[lang][level] = buildLevel(words, cfg);
        log(`${lang} ${level}: ${PUZZLES[lang][level].length} puzzles`);
      }
    }
  }

  // puzzles.js: one puzzle per line so diffs stay readable.
  const body = Object.entries(PUZZLES).map(([lang, levels]) => `  ${lang}: {\n` +
    Object.entries(levels).map(([level, list]) => `    ${level}: [\n` +
      list.map(p => `      { size: ${p.size}, grid: "${p.grid}", hosts: "${p.hosts}" },`).join("\n") + "\n    ],").join("\n") +
    "\n  },").join("\n");
  write(outFile, `// Generated by tools/build-puzzles.js — don't edit by hand.\n// grid: N×N squares row by row, "#" for clue squares; hosts: for each word (in\n// findRuns order), which of its possible clue squares holds the clue.\nconst PUZZLES = {\n${body}\n};\n`);

  // Words that still need a clue.
  const report = [];
  for (const [lang, levels] of Object.entries(PUZZLES)) {
    const needed = new Set();
    for (const list of Object.values(levels)) for (const p of list) {
      const g = [...p.grid];
      for (const r of findRuns(p.size, g)) {
        const w = r.cells.map(i => g[i]).join("");
        if (!(CLUES[lang] && CLUES[lang][w])) needed.add(w);
      }
    }
    write(`${root}/tools/out/missing-clues-${lang}.txt`, [...needed].sort().join("\n") + "\n");
    report.push(`${lang}: ${needed.size} words need clues`);
  }
  return report.join("\n");
}
