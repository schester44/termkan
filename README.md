# 🗂 termkan

A fast, keyboard-driven kanban board that lives in your terminal. Built with React Ink.

## Install

```bash
npm install -g termkan
# or
yarn global add termkan
```

## Quick Start

```bash
tk              # open the board
tk new my-project   # create a new board and open it
```

## TUI Keybindings

| Key | Action |
|-----|--------|
| `h` / `l` | Switch lane |
| `j` / `k` | Select card |
| `Enter` | Open card details |
| `n` | New card |
| `d` | Delete card |
| `H` / `L` | Move card left/right |
| `J` / `K` | Move card down/up in lane |
| `1`–`N` | Jump to lane N |
| `$` | Rename board |
| `e` | Edit lanes (add, rename, delete, reorder) |
| `/` | Search cards |
| `n` / `N` | Next/prev search result (when search active) |
| `b` | Switch board |
| `s` | Settings |
| `?` | Help |
| `q` | Quit |

### Card Details Editor

The detail view supports vim keybindings (enabled by default). Additional shortcuts in vim normal mode:

| Key | Action |
|-----|--------|
| `:q` | Save & back |
| `Esc` | Save & back |
| `E` | Open in `$EDITOR` (for long-form markdown editing) |
| `C` | Add a comment |

### Lane Editor (`e`)

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate lanes |
| `J` / `K` | Reorder lanes |
| `c` | Create new lane |
| `r` | Rename lane |
| `D` | Delete lane |

## CLI Commands

Every command supports `--json` for structured output, and `--board <name>` to target a specific board.

```bash
tk status                          # board overview
tk boards                          # list all boards
tk cards                           # list all cards
tk cards --lane "To Do"            # filter by lane
tk detail 3                        # show card #3

tk add "Fix login bug"             # add to first lane
tk add "Deploy" --lane "In Progress" --details "Ship v2"

tk move 3 --to "In Progress"       # move card between lanes
tk done 3                          # move card to last lane

tk update 3 --title "New title"    # update card
tk update 3 --details "Notes"

tk rm 3                            # delete card

tk comment 3 "Looking into this"   # add a comment
tk comment 3 "Done" --author agent  # comment with author

tk new my-project                  # create board & open TUI
tk new my-project -d               # create board (detached)
tk use my-project                  # switch active board
```

## Data Storage

Board data is stored in `.turncan/` in the current working directory:

```
.turncan/
├── meta.json              # last active board
└── boards/
    ├── default.json
    └── my-project.json
```

## AI Agent Integration

termkan ships with a [pi](https://github.com/earendil-works/pi) skill for AI agent integration. Install the skill and agents can read/write your kanban board using the CLI commands with `--json` output.

## License

ISC
