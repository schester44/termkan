import { tryRunCli } from './cli/index.js';

// handle CLI subcommands (status, add, move, etc.) before launching TUI
if (tryRunCli()) process.exit(0);

// Dynamic import so the store initializes AFTER CLI commands run
// (e.g. `tk new` writes meta before the store reads it)
async function startTUI() {
  const React = await import('react');
  const { useEffect } = React;
  const { render, useApp } = await import('ink');
  const { migrateOldBoard } = await import('./state/persistence.js');
  const { useStore } = await import('./state/store.js');
  const { useInputHandler } = await import('./hooks/use-input-handler.js');
  const { useBoardWatcher } = await import('./hooks/use-board-watcher.js');
  const { BoardView } = await import('./views/board-view.js');
  const { BoardsPicker } = await import('./views/boards-picker.js');
  const { LanesEditor } = await import('./views/lanes-editor.js');
  const { SettingsView } = await import('./views/settings-view.js');
  const { DetailView } = await import('./views/detail-view.js');
  const { ArchiveView } = await import('./views/archive-view.js');

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
    }, [boardData, boardKey, persist]);

    if (mode === 'lanes' || mode === 'new-lane' || mode === 'rename-lane') {
      return React.createElement(LanesEditor);
    }

    if (mode === 'boards' || mode === 'new-board') {
      return React.createElement(BoardsPicker);
    }

    if (mode === 'settings') {
      return React.createElement(SettingsView);
    }

    if (mode === 'archive') {
      return React.createElement(ArchiveView);
    }

    if (mode === 'detail') {
      return React.createElement(DetailView);
    }

    return React.createElement(BoardView);
  }

  render(React.createElement(KanbanBoard));
}

startTUI();
