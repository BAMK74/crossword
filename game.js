// Turn-based duel: each turn the player (or computer) holds up to HAND_SIZE letters,
// drawn from a bag containing exactly the letters still missing from the grid, so every
// letter in a hand fits somewhere. Placing a letter in the right square scores, a wrong
// square bounces it back and costs a point.

// ---------- Rules ----------
const HAND_SIZE = 5;
const LETTER_POINTS = 1;   // per correctly placed letter
const WRONG_PENALTY = 1;   // per letter put in the wrong square
const WORD_BONUS = 5;      // for placing the last letter of a word
const ALL_LETTERS_BONUS = 10; // for playing all HAND_SIZE letters in one turn
const GRID_BONUS = 10;     // for placing the very last letter of the grid

// Computer strength: how many letters it tries per turn, and how often a try is wrong.
const CPU_LEVELS = {
  easy: { min: 1, max: 2, mistake: 0.25 },
  medium: { min: 2, max: 4, mistake: 0.1 },
  hard: { min: 4, max: 5, mistake: 0 },
};
const CPU_STEP_MS = 700;

// ---------- UI text ----------
const I18N = {
  en: {
    title: "Crossword Duel", language: "Language", puzzle: "Puzzle", opponent: "Computer", easy: "Easy", medium: "Medium", hard: "Hard",
    newGame: "New game", you: "You", cpu: "Computer", pts: "pts",
    yourTurn: "Your turn", cpuTurn: "Computer's turn…", endTurn: "End turn", bag: "Letters in bag", cpuHand: "Computer's hand",
    notInHand: "You don't have that letter.", noRoom: "That square is already filled.",
    letters: "letters", wrong: "wrong", wordBonus: "word complete", allLetters: "all letters used", gridBonus: "grid finished",
    help: `Each turn you get up to ${HAND_SIZE} letters. Drag a letter from your hand onto a square (or pick a square and type the letter). Right square: +${LETTER_POINTS}. Wrong square: the letter comes back and you lose ${WRONG_PENALTY}. Finishing a word: +${WORD_BONUS}. All ${HAND_SIZE} letters in one turn: +${ALL_LETTERS_BONUS}. Last letter of the grid: +${GRID_BONUS}. Unused letters stay in your hand. Until you end your turn, you can drag letters you placed to another square or back to your rack. Space switches direction, Tab jumps to the next word.`,
    youWin: "You win! 🎉", cpuWins: "The computer wins 🤖", draw: "It's a draw!", playAgain: "Play again", wordsSolved: "words", total: "Total", howTo: "How to play",
    quips: {
      win: ["Word wizard! 🧙", "The computer is rebooting from shame.", "Dictionary? You ARE the dictionary.", "Brains: 1, Robot: 0 🧠"],
      lose: ["Beep boop. The robot does a victory dance. 🕺", "The computer had a byte too much luck.", "Rematch? It's getting cocky…", "Even robots need a win sometimes."],
      draw: ["Perfectly balanced, like a good sandwich. 🥪", "Great minds think alike!", "Nobody wins, everybody gets a cookie. 🍪"],
    },
  },
  fr: {
    title: "Duel de mots fléchés", language: "Langue", puzzle: "Grille", opponent: "Ordinateur", easy: "Facile", medium: "Moyen", hard: "Difficile",
    newGame: "Nouvelle partie", you: "Vous", cpu: "Ordinateur", pts: "pts",
    yourTurn: "À vous de jouer", cpuTurn: "L'ordinateur joue…", endTurn: "Fin du tour", bag: "Lettres dans le sac", cpuHand: "Main de l'ordinateur",
    notInHand: "Vous n'avez pas cette lettre.", noRoom: "Cette case est déjà remplie.",
    letters: "lettres", wrong: "erreur", wordBonus: "mot complet", allLetters: "toutes les lettres", gridBonus: "grille terminée",
    help: `À chaque tour vous avez jusqu'à ${HAND_SIZE} lettres. Faites glisser une lettre de votre main sur une case (ou choisissez une case et tapez la lettre). Bonne case : +${LETTER_POINTS}. Mauvaise case : la lettre revient et vous perdez ${WRONG_PENALTY}. Mot terminé : +${WORD_BONUS}. Les ${HAND_SIZE} lettres en un tour : +${ALL_LETTERS_BONUS}. Dernière lettre de la grille : +${GRID_BONUS}. Les lettres non jouées restent dans votre main. Tant que le tour n'est pas fini, vous pouvez déplacer les lettres posées vers une autre case ou les remettre sur le chevalet. Espace change de sens, Tab passe au mot suivant.`,
    youWin: "Vous avez gagné ! 🎉", cpuWins: "L'ordinateur gagne 🤖", draw: "Égalité !", playAgain: "Rejouer", wordsSolved: "mots", total: "Total", howTo: "Comment jouer",
    quips: {
      win: ["Magicien des mots ! 🧙", "L'ordinateur redémarre de honte.", "Le dictionnaire, c'est vous !", "Cerveau : 1, Robot : 0 🧠"],
      lose: ["Bip bip. Le robot fait sa danse de la victoire. 🕺", "L'ordinateur a eu un octet de chance en trop.", "Une revanche ? Il prend la grosse tête…", "Même les robots ont besoin de gagner parfois."],
      draw: ["Parfaitement équilibré, comme un bon sandwich. 🥪", "Les grands esprits se rencontrent !", "Personne ne gagne, tout le monde a un cookie. 🍪"],
    },
  },
  de: {
    title: "Schwedenrätsel-Duell", language: "Sprache", puzzle: "Rätsel", opponent: "Computer", easy: "Leicht", medium: "Mittel", hard: "Schwer",
    newGame: "Neues Spiel", you: "Du", cpu: "Computer", pts: "Pkt.",
    yourTurn: "Du bist dran", cpuTurn: "Der Computer ist dran…", endTurn: "Zug beenden", bag: "Buchstaben im Beutel", cpuHand: "Hand des Computers",
    notInHand: "Diesen Buchstaben hast du nicht.", noRoom: "Dieses Feld ist schon belegt.",
    letters: "Buchstaben", wrong: "falsch", wordBonus: "Wort fertig", allLetters: "alle Buchstaben", gridBonus: "Rätsel fertig",
    help: `In jedem Zug hast du bis zu ${HAND_SIZE} Buchstaben. Ziehe einen Buchstaben aus deiner Hand auf ein Feld (oder wähle ein Feld und tippe den Buchstaben). Richtiges Feld: +${LETTER_POINTS}. Falsches Feld: der Buchstabe kommt zurück und du verlierst ${WRONG_PENALTY}. Wort fertig: +${WORD_BONUS}. Alle ${HAND_SIZE} Buchstaben in einem Zug: +${ALL_LETTERS_BONUS}. Letzter Buchstabe des Rätsels: +${GRID_BONUS}. Ungenutzte Buchstaben bleiben in deiner Hand. Bis du den Zug beendest, kannst du gelegte Buchstaben auf ein anderes Feld ziehen oder zurück auf die Ablage legen. Leertaste wechselt die Richtung, Tab springt zum nächsten Wort.`,
    youWin: "Du hast gewonnen! 🎉", cpuWins: "Der Computer gewinnt 🤖", draw: "Unentschieden!", playAgain: "Nochmal", wordsSolved: "Wörter", total: "Gesamt", howTo: "Spielanleitung",
    quips: {
      win: ["Wortzauberer! 🧙", "Der Computer startet vor Scham neu.", "Wörterbuch? Du BIST das Wörterbuch.", "Hirn: 1, Roboter: 0 🧠"],
      lose: ["Piep piep. Der Roboter tanzt vor Freude. 🕺", "Der Computer hatte ein Byte zu viel Glück.", "Revanche? Er wird langsam übermütig…", "Auch Roboter müssen mal gewinnen."],
      draw: ["Perfekt ausgeglichen, wie ein gutes Sandwich. 🥪", "Zwei Genies, ein Gedanke!", "Keiner gewinnt, alle kriegen einen Keks. 🍪"],
    },
  },
  es: {
    title: "Duelo de autodefinidos", language: "Idioma", puzzle: "Crucigrama", opponent: "Ordenador", easy: "Fácil", medium: "Medio", hard: "Difícil",
    newGame: "Nueva partida", you: "Tú", cpu: "Ordenador", pts: "ptos",
    yourTurn: "Te toca", cpuTurn: "Juega el ordenador…", endTurn: "Terminar turno", bag: "Letras en la bolsa", cpuHand: "Mano del ordenador",
    notInHand: "No tienes esa letra.", noRoom: "Esa casilla ya está ocupada.",
    letters: "letras", wrong: "error", wordBonus: "palabra completa", allLetters: "todas las letras", gridBonus: "crucigrama terminado",
    help: `En cada turno tienes hasta ${HAND_SIZE} letras. Arrastra una letra de tu mano a una casilla (o elige una casilla y escribe la letra). Casilla correcta: +${LETTER_POINTS}. Casilla incorrecta: la letra vuelve y pierdes ${WRONG_PENALTY}. Palabra terminada: +${WORD_BONUS}. Las ${HAND_SIZE} letras en un turno: +${ALL_LETTERS_BONUS}. Última letra del crucigrama: +${GRID_BONUS}. Las letras que no uses se quedan en tu mano. Hasta que termines el turno, puedes arrastrar las letras que pusiste a otra casilla o devolverlas al atril. Espacio cambia de dirección, Tab pasa a la siguiente palabra. (Sin tildes, pero con Ñ.)`,
    youWin: "¡Has ganado! 🎉", cpuWins: "Gana el ordenador 🤖", draw: "¡Empate!", playAgain: "Otra vez", wordsSolved: "palabras", total: "Total", howTo: "Cómo jugar",
    quips: {
      win: ["¡Mago de las palabras! 🧙", "El ordenador se reinicia de vergüenza.", "¿Diccionario? ¡Tú ERES el diccionario!", "Cerebro: 1, Robot: 0 🧠"],
      lose: ["Bip bip. El robot baila de alegría. 🕺", "El ordenador tuvo un byte de suerte de más.", "¿Revancha? Se le está subiendo a la cabeza…", "Hasta los robots necesitan ganar a veces."],
      draw: ["Perfectamente equilibrado, como un buen bocadillo. 🥪", "¡Las grandes mentes piensan igual!", "Nadie gana, todos reciben una galleta. 🍪"],
    },
  },
};

const ARROWS = { across: "→", down: "↓" };
// ---------- Game state ----------
let S = null;
let cpuTimer = null;
const $ = s => document.querySelector(s);
const t = key => I18N[S.lang][key];
const other = who => (who === "player" ? "cpu" : "player");

function newGame() {
  clearTimeout(cpuTimer);
  const lang = $("#lang").value;
  const puzzle = generatePuzzle(lang, $("#puzzle-level").value);
  const bag = shuffle(puzzle.cells.flat().filter(c => c?.type === "letter").map(c => c.letter));
  S = {
    lang, difficulty: $("#difficulty").value, puzzle, bag,
    owner: puzzle.cells.map(row => row.map(() => null)),
    hands: { player: [], cpu: [] },
    score: { player: 0, cpu: 0 },
    turn: null, turnLog: null, flash: null, lastCpu: null, message: "",
    over: false, sel: null,
  };
  const w0 = puzzle.words[wordOrder()[0]];
  S.sel = { r: w0.row, c: w0.col, dir: w0.dir };
  tallyTimers.forEach(clearTimeout);
  tallyTimers = [];
  $("#tally").hidden = true;
  $("#result").hidden = true;
  $("#score-player").textContent = $("#score-cpu").textContent = "0";
  applyLanguage();
  startTurn("player");
}

function applyLanguage() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll("[data-i18n]").forEach(el => (el.textContent = t(el.dataset.i18n)));
  document.title = t("title");
}

function locked(r, c) { return S.owner[r][c] !== null; }

function startTurn(who) {
  if (S.over) return;
  const hand = S.hands[who];
  while (hand.length < HAND_SIZE && S.bag.length) hand.push(S.bag.pop());
  if (!hand.length) {
    // Nothing to play: hand the turn over (the grid is full once both hands are empty).
    if (!S.hands[other(who)].length) return endGame();
    return startTurn(other(who));
  }
  S.turn = who;
  S.turnLog = { who, points: 0, banked: false, letters: 0, wrong: 0, words: 0, all: false, grid: false,
    placed: [], wordsDone: new Set() };
  S.message = "";
  render();
  if (who === "cpu") cpuTimer = setTimeout(cpuStep, CPU_STEP_MS, cpuTurnPlan());
}

function endTurn() {
  if (S.over || !S.turn) return;
  const who = S.turn;
  S.turn = null;
  later(() => startTurn(other(who)), bankTurn());
}

// Timers for the end-of-turn tally, cleared when a new game starts.
let tallyTimers = [];
function later(fn, ms) { tallyTimers.push(setTimeout(fn, ms)); }

const TALLY_STEP_MS = 400;  // between tally lines appearing
const TALLY_HOLD_MS = 1400; // how long the finished tally stays up

// Points collect in the turn log during a turn and stay hidden. When the turn ends
// they're tallied line by line, then added to the score with the counter running up.
// Returns how long that takes, so the next turn (or the end screen) can wait for it.
function bankTurn() {
  const log = S.turnLog;
  if (!log || log.banked) return 0;
  log.banked = true;
  render();
  const rows = [];
  if (log.letters) rows.push(["✏️", `${log.letters} ${t("letters")}`, log.letters * LETTER_POINTS]);
  if (log.wrong) rows.push(["❌", `${log.wrong} ${t("wrong")}`, -log.wrong * WRONG_PENALTY]);
  if (log.words) rows.push(["🧩", `${log.words} × ${t("wordBonus")}`, log.words * WORD_BONUS]);
  if (log.all) rows.push(["⭐", t("allLetters"), ALL_LETTERS_BONUS]);
  if (log.grid) rows.push(["🏁", t("gridBonus"), GRID_BONUS]);
  if (!rows.length) return 0;

  showTally(log.who, rows, log.points);
  const from = S.score[log.who];
  S.score[log.who] += log.points;
  const countAt = (rows.length + 1) * TALLY_STEP_MS;
  later(() => animateScore(log.who, from, S.score[log.who]), countAt);
  later(() => ($("#tally").hidden = true), countAt + TALLY_HOLD_MS);
  return countAt + TALLY_HOLD_MS;
}

function showTally(who, rows, total) {
  const signed = n => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
  const el = $("#tally");
  el.className = `tally ${who}`;
  el.innerHTML =
    `<div class="tally-title">${who === "player" ? "😎" : "🤖"} ${t(who === "player" ? "you" : "cpu")}</div>` +
    rows.map(([icon, label, pts], i) =>
      `<div class="tally-row" style="animation-delay:${i * TALLY_STEP_MS}ms"><span>${icon} ${label}</span><b>${signed(pts)}</b></div>`).join("") +
    `<div class="tally-row total" style="animation-delay:${rows.length * TALLY_STEP_MS}ms"><span>${t("total")}</span><b>${signed(total)}</b></div>`;
  el.hidden = false;
}

function animateScore(who, from, to) {
  const el = $(`#score-${who}`), start = performance.now(), duration = 800;
  el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  const frame = now => {
    const k = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Tries to put a letter from `who`'s hand into (r, c). Returns true if it was right.
// The turn log remembers which letters were placed and which words they completed,
// so a letter can be taken back (see unplace) until the turn ends.
function place(r, c, ch, who) {
  const hand = S.hands[who], log = S.turnLog;
  const cell = S.puzzle.cells[r][c];
  if (cell.letter !== ch) {
    log.wrong++;
    recount(log);
    S.flash = { r, c, ch, who };
    setTimeout(() => { if (S.flash?.r === r && S.flash?.c === c) { S.flash = null; render(); } }, 650);
    return false;
  }
  hand.splice(hand.indexOf(ch), 1);
  S.owner[r][c] = who;
  log.placed.push({ r, c });
  for (const idx of Object.values(cell.words)) {
    const w = S.puzzle.words[idx];
    if (!w.owner && cellsOf(w).every(([a, b]) => locked(a, b))) {
      w.owner = who;
      log.wordsDone.add(idx);
    }
  }
  const finished = S.owner.every((row, a) => row.every((o, b) => o !== null || S.puzzle.cells[a][b]?.type !== "letter"));
  log.grid = finished;
  recount(log);
  if (finished) endGame();
  return true;
}

// Takes back a letter placed this turn: it goes back to the hand, and any word it
// completed this turn is open again.
function unplace(r, c) {
  const log = S.turnLog, cell = S.puzzle.cells[r][c];
  S.owner[r][c] = null;
  S.hands[log.who].push(cell.letter);
  log.placed = log.placed.filter(p => p.r !== r || p.c !== c);
  for (const idx of Object.values(cell.words)) {
    if (log.wordsDone.delete(idx)) S.puzzle.words[idx].owner = null;
  }
  recount(log);
}

function placedThisTurn(r, c) {
  return S.turn === "player" && S.turnLog?.placed.some(p => p.r === r && p.c === c);
}

// Works out the turn's points from what's on the board now. Wrong tries always count.
function recount(log) {
  log.letters = log.placed.length;
  log.words = log.wordsDone.size;
  log.all = log.letters >= HAND_SIZE;
  log.points = log.letters * LETTER_POINTS - log.wrong * WRONG_PENALTY + log.words * WORD_BONUS +
    (log.all ? ALL_LETTERS_BONUS : 0) + (log.grid ? GRID_BONUS : 0);
}

function endGame() {
  S.over = true;
  S.turn = null;
  clearTimeout(cpuTimer);
  later(showResult, bankTurn());
}

function showResult() {
  render();
  const { player, cpu } = S.score;
  const outcome = player > cpu ? "win" : cpu > player ? "lose" : "draw";
  const end = END_SCREEN[outcome], quips = I18N[S.lang].quips[outcome];
  $("#result-emoji").textContent = end.emoji;
  $("#result-text").textContent = t({ win: "youWin", lose: "cpuWins", draw: "draw" }[outcome]);
  $("#result-quip").textContent = quips[Math.floor(Math.random() * quips.length)];
  const solved = who => S.puzzle.words.filter(w => w.owner === who).length;
  const card = (who, avatar, points) => `
    <div class="rs ${who}${outcome === (who === "player" ? "win" : "lose") ? " winner" : ""}">
      ${outcome === (who === "player" ? "win" : "lose") ? `<span class="crown">👑</span>` : ""}
      <div class="avatar">${avatar}</div>
      <span class="name">${t(who === "player" ? "you" : "cpu")}</span>
      <span class="points">${points}</span>
      <span class="solved">🧩 ${solved(who)} ${t("wordsSolved")}</span>
    </div>`;
  $("#result-score").innerHTML = card("player", end.you, player) + card("cpu", end.cpu, cpu);
  rainConfetti(end.confetti);
  $("#result").hidden = false;
}

// Pictures for the end screen: the big one, both faces, and what falls from the sky.
const END_SCREEN = {
  win: { emoji: "🏆", you: "😎", cpu: "🤖", confetti: ["🎉", "🎊", "⭐", "🌟", "🎈", "✨", "🍬", "🥳"] },
  lose: { emoji: "🤖", you: "🙃", cpu: "😼", confetti: ["⚙️", "🔩", "🤖", "💾", "🔋"] },
  draw: { emoji: "🤝", you: "😄", cpu: "🤖", confetti: ["🤝", "✨", "⚖️", "🍪"] },
};

function rainConfetti(pictures) {
  const box = $("#confetti");
  box.innerHTML = "";
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("span");
    s.textContent = pictures[i % pictures.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${18 + Math.random() * 22}px`;
    s.style.animationDuration = `${2.5 + Math.random() * 3}s`;
    s.style.animationDelay = `${Math.random() * 1.5}s`;
    box.appendChild(s);
  }
}

// ---------- Computer opponent ----------
function cpuTurnPlan() {
  const lv = CPU_LEVELS[S.difficulty];
  return { left: lv.min + Math.floor(Math.random() * (lv.max - lv.min + 1)), mistake: lv.mistake };
}

function cpuStep(plan) {
  if (S.over || S.turn !== "cpu") return;
  const hand = S.hands.cpu;
  if (plan.left <= 0 || !hand.length) return endTurn();
  plan.left--;
  const empty = [];
  S.puzzle.cells.forEach((row, r) => row.forEach((cell, c) => { if (cell?.type === "letter" && !locked(r, c)) empty.push([r, c]); }));

  if (Math.random() < plan.mistake) {
    // Put a letter where it doesn't belong.
    const ch = hand[Math.floor(Math.random() * hand.length)];
    const wrong = empty.filter(([r, c]) => S.puzzle.cells[r][c].letter !== ch);
    if (wrong.length) {
      const [r, c] = wrong[Math.floor(Math.random() * wrong.length)];
      place(r, c, ch, "cpu");
      render();
      cpuTimer = setTimeout(cpuStep, CPU_STEP_MS, plan);
      return;
    }
  }
  // Best move: finish words first, otherwise squares in words that are nearly done.
  let best = null;
  for (const [r, c] of empty) {
    const ch = S.puzzle.cells[r][c].letter;
    if (!hand.includes(ch)) continue;
    let v = Math.random();
    for (const idx of Object.values(S.puzzle.cells[r][c].words)) {
      const cells = cellsOf(S.puzzle.words[idx]);
      const missing = cells.filter(([a, b]) => !locked(a, b)).length;
      v += missing === 1 ? 10 : (cells.length - missing) / cells.length;
    }
    if (!best || v > best.v) best = { r, c, ch, v };
  }
  if (!best) return endTurn();
  place(best.r, best.c, best.ch, "cpu");
  S.lastCpu = `${best.r},${best.c}`;
  render();
  if (!S.over) cpuTimer = setTimeout(cpuStep, CPU_STEP_MS, plan);
}

// ---------- Selection & input ----------
function currentWordIdx() {
  const cell = S.puzzle.cells[S.sel.r][S.sel.c];
  return cell.words[S.sel.dir] ?? Object.values(cell.words)[0];
}

// Words in reading order of their clue squares.
function wordOrder() {
  const words = S.puzzle.words;
  return words.map((_, i) => i).sort((a, b) =>
    words[a].row - words[b].row || words[a].col - words[b].col || (words[a].dir === "across" ? -1 : 1));
}

function select(r, c, dir) {
  const cell = S.puzzle.cells[r]?.[c];
  if (cell?.type !== "letter") return;
  if (!(dir in cell.words)) dir = Object.keys(cell.words)[0];
  S.sel = { r, c, dir };
  S.message = "";
  render();
}

function selectWord(idx) {
  const w = S.puzzle.words[idx];
  const free = cellsOf(w).find(([r, c]) => !locked(r, c)) || [w.row, w.col];
  select(free[0], free[1], w.dir);
}

function onCellClick(r, c) {
  const same = S.sel.r === r && S.sel.c === c;
  const dir = same ? (S.sel.dir === "across" ? "down" : "across") : S.sel.dir;
  select(r, c, dir);
}

function step(delta) {
  // Move within the current word, skipping squares that are already filled.
  const w = S.puzzle.words[currentWordIdx()], cells = cellsOf(w);
  let i = cells.findIndex(([r, c]) => r === S.sel.r && c === S.sel.c) + delta;
  while (i >= 0 && i < cells.length && locked(...cells[i])) i += delta;
  if (i >= 0 && i < cells.length) S.sel = { ...S.sel, r: cells[i][0], c: cells[i][1], dir: w.dir };
}

function move(dr, dc) {
  const dir = dr ? "down" : "across";
  if (S.sel.dir !== dir && dir in S.puzzle.cells[S.sel.r][S.sel.c].words) return select(S.sel.r, S.sel.c, dir);
  let r = S.sel.r + dr, c = S.sel.c + dc;
  while (r >= 0 && c >= 0 && r < S.puzzle.rows && c < S.puzzle.cols) {
    if (S.puzzle.cells[r][c]?.type === "letter") return select(r, c, S.sel.dir);
    r += dr; c += dc;
  }
}

function nextWord(delta) {
  const order = wordOrder();
  let pos = order.indexOf(currentWordIdx());
  for (let n = 0; n < order.length; n++) {
    pos = (pos + delta + order.length) % order.length;
    if (!S.puzzle.words[order[pos]].owner) return selectWord(order[pos]);
  }
}

function playLetter(ch) {
  if (S.over || S.turn !== "player") return;
  const { r, c } = S.sel;
  if (locked(r, c)) { S.message = t("noRoom"); return render(); }
  if (!S.hands.player.includes(ch)) { S.message = t("notInHand"); return render(); }
  S.message = "";
  if (place(r, c, ch, "player") && !S.over) {
    if (S.puzzle.words[currentWordIdx()].owner) nextWord(1);
    else step(1);
  }
  render();
  // No auto end when the hand is empty: the player can still move letters around,
  // so End turn pulses instead (see render).
}

// Drags a tile from the hand onto a square, or a letter placed this turn (`from`, its
// square) to another square. Pointer events, so it works with a mouse and on touch
// screens. Dropping a hand tile anywhere else puts it back; dropping a placed letter
// anywhere but a free square (or its own) returns it to the hand.
function startDrag(e, ch, el, from = null) {
  if (S.over || S.turn !== "player") return;
  e.preventDefault();
  hideClueZoom();
  let ghost;
  if (from) {
    ghost = document.createElement("div");
    ghost.className = "tile";
    ghost.textContent = ch;
  } else ghost = el.cloneNode(true);
  ghost.classList.add("dragging");
  document.body.appendChild(ghost);
  el.classList.add("lifted");
  let target = null, overOwn = false;

  const move = ev => {
    ghost.style.left = `${ev.clientX}px`;
    ghost.style.top = `${ev.clientY}px`;
    const cell = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".cell");
    overOwn = !!from && cell === el;
    const open = cell && !locked(+cell.dataset.r, +cell.dataset.c) ? cell : null;
    if (open !== target) {
      target?.classList.remove("drop-target");
      open?.classList.add("drop-target");
      target = open;
    }
  };
  const end = ev => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    ghost.remove();
    el.classList.remove("lifted");
    target?.classList.remove("drop-target");
    if (ev.type !== "pointerup" || overOwn) return;
    if (from) unplace(from.r, from.c);
    if (target) {
      select(+target.dataset.r, +target.dataset.c, S.sel.dir);
      playLetter(ch);
    } else render();
  };
  move(e);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}

function normalize(key) {
  // "ß".toUpperCase() is already "SS"; umlauts become two letters, accents are dropped.
  // Ñ stays a letter of its own (Spanish).
  if (key.toUpperCase() === "Ñ") return "Ñ";
  return key.toUpperCase()
    .replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE")
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
}

document.addEventListener("keydown", e => {
  if (!S || S.over || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.tagName === "SELECT") return;
  const k = e.key;
  if (/^\p{L}$/u.test(k)) {
    e.preventDefault();
    const ch = normalize(k);
    if (/^[A-ZÑ]$/.test(ch)) playLetter(ch);
  } else if (k === "Enter") { e.preventDefault(); if (S.turn === "player") endTurn(); }
  else if (k === " ") { e.preventDefault(); select(S.sel.r, S.sel.c, S.sel.dir === "across" ? "down" : "across"); }
  else if (k === "Tab") { e.preventDefault(); nextWord(e.shiftKey ? -1 : 1); }
  else if (k === "ArrowRight") { e.preventDefault(); move(0, 1); }
  else if (k === "ArrowLeft") { e.preventDefault(); move(0, -1); }
  else if (k === "ArrowDown") { e.preventDefault(); move(1, 0); }
  else if (k === "ArrowUp") { e.preventDefault(); move(-1, 0); }
});

// ---------- Rendering ----------
function escapeHTML(s) {
  return s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function imageHTML(src) {
  return /\.(png|jpe?g|gif|svg|webp)$/i.test(src)
    ? `<img src="${escapeHTML(src)}" alt="">`
    : `<span class="emoji">${src}</span>`;
}

// --longest lets the CSS shrink the text so the clue's longest word fits on one line.
function clueContent(w) {
  if (w.showImage) return imageHTML(w.image);
  const longest = Math.max(...w.clue.split(/\s+/).map(s => s.length));
  return `<span class="txt" style="--longest:${longest}">${escapeHTML(w.clue)}</span>`;
}

// Clicking a clue square shows that clue enlarged on top of it. Any other click
// (or Esc) closes it.
function showClueZoom(w, rect) {
  const z = $("#clue-zoom");
  z.innerHTML = w.showImage
    ? `<div class="zoom-image">${imageHTML(w.image)}</div>`
    : `<div class="zoom-text">${escapeHTML(w.clue)}</div>`;
  z.classList.remove("pop"); // measure at full size, not mid-animation
  z.hidden = false;
  const zr = z.getBoundingClientRect();
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - zr.width / 2), innerWidth - zr.width - 8);
  const top = Math.min(Math.max(8, rect.top + rect.height / 2 - zr.height / 2), innerHeight - zr.height - 8);
  z.style.left = `${left}px`;
  z.style.top = `${top}px`;
  void z.offsetWidth;
  z.classList.add("pop");
}

function hideClueZoom() { $("#clue-zoom").hidden = true; }

document.addEventListener("pointerdown", e => { if (!e.target.closest(".clue")) hideClueZoom(); }, true);
document.addEventListener("keydown", e => { if (e.key === "Escape") hideClueZoom(); });
window.addEventListener("scroll", hideClueZoom, { passive: true });

function render() {
  const { puzzle, owner, sel } = S;

  const grid = $("#grid");
  grid.style.setProperty("--cols", puzzle.cols);
  grid.innerHTML = "";
  for (let r = 0; r < puzzle.rows; r++) for (let c = 0; c < puzzle.cols; c++) {
    const cell = puzzle.cells[r][c];
    const el = document.createElement("div");

    if (cell.type === "clue") {
      el.className = `cluecell${cell.clues.length > 1 ? " split" : ""}`;
      for (const { idx, arrow } of cell.clues) {
        const w = puzzle.words[idx];
        const part = document.createElement("div");
        part.className = ["clue", `arrow-${arrow}`, w.owner ? `own-${w.owner}` : ""].join(" ");
        part.innerHTML = clueContent(w);
        part.addEventListener("mousedown", e => {
          e.preventDefault();
          const rect = part.getBoundingClientRect(); // before render() replaces it
          selectWord(idx);
          showClueZoom(w, rect);
        });
        el.appendChild(part);
      }
      grid.appendChild(el);
      continue;
    }

    const key = `${r},${c}`;
    const flash = S.flash && S.flash.r === r && S.flash.c === c;
    el.className = "cell";
    el.dataset.r = r; el.dataset.c = c;
    if (owner[r][c]) el.classList.add(`own-${owner[r][c]}`);
    if (key === S.lastCpu) el.classList.add("cpu-last");
    if (r === sel.r && c === sel.c) el.classList.add("selected");
    if (flash) el.classList.add("wrong");
    el.innerHTML = `<span class="letter">${flash ? S.flash.ch : owner[r][c] ? cell.letter : ""}</span>`;
    if (placedThisTurn(r, c)) {
      // Letters placed this turn can be picked up again and moved.
      el.classList.add("movable");
      el.addEventListener("pointerdown", e => startDrag(e, cell.letter, el, { r, c }));
    } else {
      el.addEventListener("mousedown", e => { e.preventDefault(); onCellClick(r, c); });
    }
    grid.appendChild(el);
  }

  // Hands, turn and bag.
  const myTurn = S.turn === "player";
  const hand = $("#hand");
  hand.innerHTML = "";
  for (const ch of S.hands.player) {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.textContent = ch;
    tile.disabled = !myTurn;
    tile.addEventListener("pointerdown", e => startDrag(e, ch, tile));
    hand.appendChild(tile);
  }
  $("#cpu-hand").innerHTML = S.hands.cpu.map(() => `<span class="tile back"></span>`).join("");
  $("#cpu-hand").title = t("cpuHand");
  $("#bag-count").textContent = `${t("bag")}: ${S.bag.length}`;
  $("#end-turn").disabled = !myTurn;
  $("#end-turn").classList.toggle("ready", myTurn && !S.hands.player.length);
  // The turn sits between the two score cards and points at whoever is playing.
  $("#turn").textContent = !S.turn ? "" : myTurn ? `◀ ${t("yourTurn")}` : `${t("cpuTurn")} ▶`;
  $("#turn").className = `turn ${S.turn ?? ""}`;
  $(".counter.player").classList.toggle("active", myTurn);
  $(".counter.cpu").classList.toggle("active", S.turn === "cpu");
  $("#message").textContent = S.message;
  // The score counters are only changed by animateScore (and newGame).
  fitGrid();
}

// Sizes the grid squares so the whole game fits the window: whatever height (and
// width) the rest of the page doesn't use goes to the grid (26–96px per square).
// On wide screens the rack sits beside the grid (see style.css): it's as tall as the
// grid and its tiles grow with it, so it takes width instead of height.
function fitGrid() {
  const grid = $("#grid"), root = document.documentElement.style;
  const beside = getComputedStyle(grid.parentElement).display === "flex";
  // The page's side padding (bigger around a phone's notch), plus a little slack.
  const bodyStyle = getComputedStyle(document.body);
  const padX = parseFloat(bodyStyle.paddingLeft) + parseFloat(bodyStyle.paddingRight) + 4;
  // Start from the smallest size: a grid that's too big would make phone browsers
  // widen the page, and the window would then measure wider than the screen.
  grid.style.setProperty("--cell", "26px");
  root.setProperty("--rack-h", "auto");
  root.setProperty("--tile", "32px");
  // The rest of the page can still shift as the grid grows, so measure again until
  // the size settles.
  for (let pass = 0; pass < 3; pass++) {
    const rest = beside
      ? document.body.offsetHeight - grid.parentElement.offsetHeight
      : document.body.offsetHeight - grid.offsetHeight;
    // Beside the grid, the rack column (150px, see style.css) and the gap (28px) take
    // width, plus some slack.
    const fixed = beside ? 28 + 150 + 12 : 0;
    const byWidth = (innerWidth - padX - fixed) / S.puzzle.cols;
    const byHeight = (innerHeight - rest - 12) / S.puzzle.rows;
    const size = `${Math.max(26, Math.min(96, Math.floor(Math.min(byWidth, byHeight))))}px`;
    if (grid.style.getPropertyValue("--cell") === size) break;
    grid.style.setProperty("--cell", size);
  }
  if (beside) {
    // The rack column is as tall as the grid. Tiles are the size of a grid square,
    // unless the rack (5 tiles, 6px gaps, 12px padding) plus the controls below it
    // (and the 12px gap between) would then be taller than the grid.
    const h = grid.offsetHeight, below = $(".rack-side").offsetHeight;
    const cell = parseInt(grid.style.getPropertyValue("--cell"), 10);
    const fit = Math.floor((h - below - 12 - 12 - 4 * 6) / 5);
    root.setProperty("--rack-h", `${h}px`);
    root.setProperty("--tile", `${Math.max(26, Math.min(cell, fit, 138))}px`);
  }
  // Line the score cards up with the edges of the grid, also when the rack sits beside
  // it (then the grid is off-center, so the score row is shifted to sit over it).
  const board = $(".scoreboard");
  board.style.maxWidth = `${Math.max(grid.offsetWidth, 300)}px`;
  board.style.left = "0px";
  const g = grid.getBoundingClientRect(), s = board.getBoundingClientRect();
  board.style.left = `${Math.round((g.left + g.right) / 2 - (s.left + s.right) / 2)}px`;
}
window.addEventListener("resize", () => S && fitGrid());
document.querySelector(".help").addEventListener("toggle", () => S && fitGrid());

// ---------- Boot ----------
$("#new-game").addEventListener("click", newGame);
$("#play-again").addEventListener("click", newGame);
$("#end-turn").addEventListener("click", endTurn);
$("#lang").addEventListener("change", newGame);
$("#puzzle-level").addEventListener("change", newGame);
$("#difficulty").addEventListener("change", () => (S.difficulty = $("#difficulty").value));
newGame();
