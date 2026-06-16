---
name: termkan
description: Interact with termkan kanban boards via the `tk` CLI. Use when the user asks about tasks, todos, what's in progress, what's done, or wants to manage work items on a kanban board. Supports reading board status, adding/moving/updating/deleting cards, commenting, and managing boards.
---

# Termkan – Terminal Kanban

Manage kanban boards via the `tk` CLI. All commands support `--json` for structured output. **Always use `--json`** when you need to parse the response programmatically.

## Reading the Board

```bash
# List all cards (alias: tk ls)
tk cards --json

# Filter by lane
tk cards --lane "To Do" --json

# Get card details (by ID)
tk detail <card-id> --json

# List all boards
tk boards --json
```

## Creating & Managing Cards

```bash
# Add a card (defaults to first lane)
tk add "Card title" --json

# Add to a specific lane with details
tk add "Card title" --lane "In Progress" --details "Description here" --json

# Move a card to a different lane
tk move <card-id> --to "In Progress" --json

# Mark a card as done (moves to last lane)
tk done <card-id> --json

# Update card title or details
tk update <card-id> --title "New title" --json
tk update <card-id> --details "New details" --json

# Delete a card
tk rm <card-id> --json
```

## Priority

```bash
# Set card priority
tk priority <card-id> high --json
tk priority <card-id> medium --json
tk priority <card-id> low --json
tk priority <card-id> none --json
```

## Comments

```bash
# Add a comment to a card
tk comment <card-id> "Comment text" --json

# Add a comment with an author
tk comment <card-id> "Comment text" --author "agent" --json
```

## Managing Boards

```bash
# Create a new board (detached, don't open TUI)
tk new <board-name> -d --json

# Switch active board
tk use <board-name> --json

# List all boards
tk boards --json
```

## Working with a Specific Board

Use `--board <name>` to target a board without switching the active one:

```bash
tk status --board my-project --json
tk add "New task" --board my-project --json
```

## Workflow Guidelines

1. **Always start with `tk cards --json`** to understand the current board state before making changes.
2. Use card IDs from the status output when moving, updating, or deleting cards.
3. Lane names are case-insensitive (e.g., "to do" matches "To Do").
4. Default lanes are "To Do", "In Progress", and "Done" but users may have custom lanes.
5. When the user asks "what's left to do" or similar, read from `tk cards --lane "To Do" --json`.
6. When marking work complete, use `tk done <id> --json` rather than `tk move <id> --to "Done" --json` unless the last lane has a different name.
7. After making changes, confirm with `tk cards --json` if the user wants to see the updated board.
8. Use `tk comment <id> <text> --author "agent" --json` to add progress notes or observations to cards.
9. The board supports live-update — changes made via CLI are automatically reflected in any open TUI instance.
