import { tryRunCli } from "./cli/index.js";

// handle CLI subcommands (status, add, move, etc.) before launching TUI
if (tryRunCli()) process.exit(0);

import React, { useEffect } from "react";
import { render, useApp } from "ink";
import { migrateOldBoard } from "./state/persistence.js";
import { useStore } from "./state/store.js";
import { useInputHandler } from "./hooks/use-input-handler.js";
import { useBoardWatcher } from "./hooks/use-board-watcher.js";
import { BoardView } from "./views/board-view.js";
import { BoardsPicker } from "./views/boards-picker.js";
import { LanesEditor } from "./views/lanes-editor.js";
import { SettingsView } from "./views/settings-view.js";
import { DetailView } from "./views/detail-view.js";

// migrate old single-file format
migrateOldBoard();

function KanbanBoard() {
	const { exit } = useApp();
	const mode = useStore((s) => s.mode);
	const persist = useStore((s) => s.persist);
	const boardKey = useStore((s) => s.boardKey);
	const boardData = useStore((s) => s.boardData);

	useInputHandler(exit);
	useBoardWatcher();

	// persist on every change
	useEffect(() => {
		persist();
	}, [boardData, boardKey]);

	if (mode === "lanes" || mode === "new-lane" || mode === "rename-lane") {
		return <LanesEditor />;
	}

	if (mode === "boards" || mode === "new-board") {
		return <BoardsPicker />;
	}

	if (mode === "settings") {
		return <SettingsView />;
	}

	if (mode === "detail") {
		return <DetailView />;
	}

	return <BoardView />;
}

render(<KanbanBoard />);
