# termkan

Terminal kanban board built with TypeScript, React Ink, and Zustand.

## Tech Stack

- **Runtime:** Node.js (ESM)
- **UI:** [React Ink](https://github.com/vadimdemedes/ink) — React for the terminal
- **State:** [Zustand](https://github.com/pmndrs/zustand) — lightweight store, no prop drilling
- **Editor:** [@vimee/core](https://github.com/nicholasgasior/vimee) — vim keybindings in textarea
- **Build:** TypeScript 6, targeting ES2022, module: nodenext
- **Package manager:** Yarn 4 (node-modules linker, not PnP)

## Project Structure

```
src/
  app.tsx                    # Entry point — CLI dispatch then TUI render
  cli/
    index.ts                 # CLI dispatcher and tryRunCli()
    commands.ts              # CLI command implementations
    helpers.ts               # Shared CLI utils, formatting, flag parsing
  types.ts                   # Shared types (Mode union)
  utils.tsx                  # Utility components (highlightMatch)
  textarea.tsx               # Multi-line text editor component

  state/
    persistence.ts           # File I/O — load/save boards, meta, migration
    store.ts                 # Zustand store — all app state and actions

  hooks/
    use-input-handler.ts     # useInput hook — keyboard handling by mode
    use-board-watcher.ts     # File watcher for live-update on external changes

  utils/
    external-editor.ts       # Open card details in $EDITOR

  views/                     # Full-screen views (routed by mode in app.tsx)
    board-view.tsx           # Main kanban board
    boards-picker.tsx        # Board switching (b)
    lanes-editor.tsx         # Lane management (e)
    settings-view.tsx        # Settings toggles (s)
    detail-view.tsx          # Card detail editor (Enter)

  components/                # Reusable pieces used within views
    card.tsx                 # Single card rendering
    lane-column.tsx          # Single lane column
    help-panel.tsx           # Help overlay (?)

bin/
  tk.js                      # CLI entry point (#!/usr/bin/env node)
```

## Architecture

### Entry Flow

`bin/tk.js` → `src/app.tsx` → `tryRunCli()` (from `cli/index.ts`) checks for subcommands first. If a CLI command matches, it runs and exits. Otherwise, React Ink renders the TUI.

### State Management

All state lives in a single Zustand store (`state/store.ts`). Views and components access state via `useStore()` — no prop drilling. The store contains:

- Board data (lanes, cards, settings)
- Navigation state (active lane/card, mode, cursors)
- UI state (input values, search query)
- Actions (addCard, deleteCard, moveCard, moveLane, etc.)

Persistence happens via a `useEffect` in `app.tsx` that calls `persist()` on every board data change. A `useBoardWatcher` hook watches the board JSON file for external modifications and reloads data for live-update support.

### Mode System

The app uses a `Mode` union type to manage which view is active and how keyboard input is interpreted. The input handler (`use-input-handler.ts`) switches behavior based on the current mode. Modes include: `navigate`, `add`, `detail`, `settings`, `search`, `help`, `rename`, `boards`, `new-board`, `lanes`, `new-lane`, `rename-lane`.

### CLI Layer

The `cli/` module provides subcommands that read/write board data directly via `persistence.ts` (no React/Ink involved). Split into `helpers.ts` (utils, formatting, flag parsing), `commands.ts` (all command implementations), and `index.ts` (dispatcher). Output is pretty-printed by default, with `--json` for structured output. The `--board` flag lets commands target any board without switching the active one.

## Build & Run

```bash
yarn install
yarn build          # tsc → dist/
tk                  # run (linked via npm link)
```

## Data

Boards are stored as JSON files in `.turncan/boards/` relative to cwd. Each board file contains `{ nextId, name, lanes[], settings }`. Cards contain `{ id, title, details, comments[] }` where comments have `{ text, timestamp, author? }`. The `meta.json` tracks the last active board.

## Key Conventions

- All imports use `.js` extensions (ESM with nodenext resolution)
- Views are full-screen "pages", components are reusable pieces within them
- Lane names are matched case-insensitively in CLI commands
- Card IDs are auto-incrementing integers per board
