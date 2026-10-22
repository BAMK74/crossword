# Crossword Duel

An arrow-word crossword game where you play against the computer, in English, French,
German and Spanish.

**Play it here: https://bamk74.github.io/crossword/**

## How it works

- Each turn you get up to 5 letters, drawn from the letters still missing in the grid.
  Drag them onto the squares where they belong.
- Right square: +1 point. Wrong square: the letter comes back and you lose 1 point.
- Bonuses: +5 for finishing a word, +10 for using all 5 letters in one turn, +10 for the
  last letter of the grid. Points are tallied at the end of each turn.
- Some clues are pictures. Click a clue to see it bigger.
- Three puzzle sizes (6×6, 8×8, 10×10) and three computer strengths.

## Running it locally

It's a static web page with no build step. Open `index.html` through any web server,
for example:

```bash
python3 -m http.server 8000
```

then go to http://localhost:8000.

## Adding puzzles

The puzzles in `puzzles.js` are made ahead of time from the word lists in
`tools/wordlists/` by `tools/build-puzzles.js`, using the JavaScript built into macOS.
See the top of that file for how to run it. Clues for every word live in `clues.js`.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — Copyright BAMK74 (2026).
Free to play, read and change for noncommercial purposes.
