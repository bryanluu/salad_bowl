![Test](https://github.com/bryanluu/salad_bowl/actions/workflows/test.yml/badge.svg)
![Build & Deploy to GitHub Pages](https://github.com/bryanluu/salad_bowl/actions/workflows/build_and_deploy.yml/badge.svg)

# Salad Bowl

A progressive web app for a party game. Players gather around a single device,
toss prompts into a shared bowl, and then work through three rounds — Taboo,
Charades, and Password — taking timed turns to describe, act out, or drop a
one-word clue while their teammates guess. Scoreboards run between rounds and
crown a winner (or a tie) at the end.

Built for phones that get passed hand to hand: it holds a Screen Wake Lock
while a turn is in play so the display can't dim mid-game, and there are no
accounts, no backend, and no persistence — a game lives entirely in the
current session. Full installable/offline PWA support (manifest and service
worker) is still to come.

**Play the live game:** <https://bryanluu.github.io/salad_bowl/>

## Getting started

The Node version is pinned in `.nvmrc`:

```sh
nvm use   # install the pinned version if you don't have it
npm ci
npm run dev
```

Then open the local URL Vite prints when the dev server starts.

### Scripts

| Command            | Description                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| `npm run dev`      | Start the Vite dev server with HMR                                             |
| `npm run build`    | Type-check with `tsc -b` and build the production bundle into `dist/`          |
| `npm run lint`     | Run ESLint over the project                                                    |
| `npm run preview`  | Serve the production build locally                                             |
| `npm test`         | Run the Vitest test suite (watch mode; `npx vitest run` for a single pass)     |
| `npm run test:ui`  | Run Vitest with its browser-based UI                                           |

## Project structure

```text
salad_bowl/
├── index.html            # App shell: fonts, favicon, #root mount point
├── public/               # Static assets (logo, icons, favicon)
├── src/
│   ├── main.tsx          # Entry point — mounts App, imports global styles
│   ├── App.tsx           # Screen state machine + shared game config
│   ├── types.ts          # Shared types: GameConfig, Team, WordSource, Scores
│   ├── assets.ts         # base-path-aware URL helper for public/ assets
│   ├── components/       # Screens & UI: Start, GameSetup, WordEntry, Gameplay,
│   │                     #   round/turn curtains, scoreboard
│   ├── colors/           # Color interpolation helpers (+ tests)
│   ├── copy/en.ts        # All UI strings in one place
│   ├── hooks/            # useTimer, useWakeLock, useKeyPress, useWordSource
│   ├── styles/           # reset.css, variables.css, global.css
│   ├── teams/            # Roster math + team-order shuffling (+ tests)
│   ├── validation/       # Roster, bowl, and word validators (+ tests)
│   ├── words/            # Word normalization + bowl pick/switch (+ tests)
│   ├── wordSources/      # WordSource implementations (LocalWordSource)
│   └── test/setup.ts     # Vitest setup (jest-dom matchers)
├── .github/workflows/    # test.yml (CI), build_and_deploy.yml (GitHub Pages)
├── eslint.config.js      # ESLint flat config
├── tsconfig.json         # Project references → tsconfig.app.json / tsconfig.node.json
├── vite.config.ts        # Vite + Vitest config; base path /salad_bowl/
└── .nvmrc                # Pins the Node version
```

## Architecture notes

- **Screens, not routes.** `src/App.tsx` drives a small state machine over
  `ScreenId` (`start` → `game-setup` → `word-entry` → `gameplay`) and holds
  the shared `GameConfig`. There is no router — the app is a single page.
- **`WordSource` is the seam.** The game only talks to the `WordSource`
  interface in `src/types.ts` (`addWord`, `removeWord`, `getWords`, `count`).
  The current implementation, `LocalWordSource` in `src/wordSources/`, is an
  in-memory bowl with duplicate and length checks. Alternate sources — for
  example prompts entered from other devices — can plug in without touching
  gameplay code.
- **UI copy lives in one file.** Every string in the app is in
  `src/copy/en.ts`, so adding a language is a matter of adding a sibling
  file.
- **Pure game logic, tested next to itself.** Bowl mechanics (`src/words/`),
  roster math and team shuffling (`src/teams/`), and validation
  (`src/validation/`) are framework-free modules, each paired with a
  co-located `*.test.ts` file.

## Testing & CI

Tests run with Vitest + React Testing Library in a jsdom environment (setup
in `src/test/setup.ts`):

```sh
npm test           # watch mode
npx vitest run     # single pass
```

- **Test** (`.github/workflows/test.yml`) — lints and runs the test suite on
  every pull request and push to `main`; it's a required status check.
- **Build & Deploy** (`.github/workflows/build_and_deploy.yml`) — builds and
  deploys to GitHub Pages on pushes to `main`. The Vite base path is
  `/salad_bowl/` to match the Pages subpath, which is why asset URLs are
  built through `src/assets.ts` rather than hardcoded.
