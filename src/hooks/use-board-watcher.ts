import { useEffect, useRef } from "react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { useStore } from "../state/store.js";
import { loadBoard } from "../state/persistence.js";

const DATA_DIR = path.join(os.homedir(), ".termkan");
const BOARDS_DIR = path.join(DATA_DIR, "boards");

/**
 * Watches the current board's JSON file for external changes
 * and reloads the board data when modified outside of this process.
 */
export function useBoardWatcher() {
	const boardKey = useStore((s) => s.boardKey);
	const lastWriteRef = useRef<number>(0);

	// Expose a way for persist to mark "we just wrote"
	const persist = useStore((s) => s.persist);

	useEffect(() => {
		const filePath = path.join(BOARDS_DIR, `${boardKey}.json`);

		// Ensure the file exists before watching (new boards may not be persisted yet)
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(BOARDS_DIR, { recursive: true });
			fs.writeFileSync(filePath, JSON.stringify(useStore.getState().boardData, null, 2) + "\n");
		}

		let debounceTimer: ReturnType<typeof setTimeout> | null = null;

		const watcher = fs.watch(filePath, { persistent: false }, (eventType) => {
			if (eventType !== "change") return;

			// Debounce rapid changes
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				// Skip if we wrote recently (within 500ms)
				if (Date.now() - lastWriteRef.current < 500) return;

				try {
					const newData = loadBoard(boardKey);
					const currentData = useStore.getState().boardData;

					// Only update if data actually changed
					const newJson = JSON.stringify(newData);
					const currentJson = JSON.stringify(currentData);
						if (newJson !== currentJson) {
						// Skip updates while in detail/edit modes to avoid breaking the view
						const mode = useStore.getState().mode;
						if (mode === "detail" || mode === "add" || mode === "rename") return;

						// Clamp active indices to stay within bounds
						const { activeLane, activeCard } = useStore.getState();
						const clampedLane = Math.min(activeLane, newData.lanes.length - 1);
						const clampedCard = Math.min(activeCard, Math.max(0, (newData.lanes[clampedLane]?.cards.length ?? 1) - 1));

						useStore.setState({
							boardData: newData,
							activeLane: clampedLane,
							activeCard: clampedCard,
						});
					}
				} catch {
					// File might be mid-write, ignore
				}
			}, 100);
		});

		// Patch persist to track our own writes
		const originalPersist = useStore.getState().persist;
		const patchedPersist = () => {
			lastWriteRef.current = Date.now();
			originalPersist();
		};
		useStore.setState({ persist: patchedPersist });

		return () => {
			watcher.close();
			if (debounceTimer) clearTimeout(debounceTimer);
			// Restore original persist
			useStore.setState({ persist: originalPersist });
		};
	}, [boardKey]);
}
