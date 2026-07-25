# EUPHO Site

Personal portfolio website for Eupho — dark beats, Alice-inspired mini-game, and visual art.

## Structure

- `index.html` — Home / entrance
- `beats.html` — Beats catalog with preview player
- `game.html` — "The Interior" mini-game
- `visuals.html` — Visual gallery
- `about.html` — About / contact
- `css/main.css` — Global styles
- `js/main.js` — Shared scripts, ambient background
- `js/beats.js` — Beats catalog logic
- `js/game.js` — Mini-game logic
- `data/beats.json` — Beat metadata
- `assets/` — Images, audio previews, fonts

## How to run locally

Open `index.html` in any modern browser, or serve the folder with a local static server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

Then visit `http://localhost:8000`.

## Adding beats

1. Add preview audio file to `assets/audio/`.
2. Add entry to `data/beats.json`.
3. Done.

## Adding visuals

Replace placeholder blocks in `visuals.html` with `<img>` or `<iframe>` content.

## License

Original code and design created for Eupho.

*Alice: Madness Returns is a trademark of Electronic Arts. This site is an original fan-inspired work and does not use original game assets.*
