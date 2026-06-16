import { useInput } from "ink";
import { listBoards } from "../state/persistence.js";
import { useStore } from "../state/store.js";

export function useInputHandler(exit: () => void) {
	const store = useStore();
	const lanes = store.lanes();

	useInput((input, key) => {
		if (store.mode === "detail") return;

		if (store.mode === "help") {
			if (key.escape || input === "?") {
				store.setMode("navigate");
				return;
			}
			// allow jumping directly to views from help
			store.setMode("navigate");
			// fall through to navigate handling below
		}

		if (store.mode === "boards") {
			if (key.escape || input === "b") {
				store.setMode("navigate");
				return;
			}
			if (key.upArrow || input === "k") {
				store.setBoardsCursor((prev) => Math.max(0, prev - 1));
			}
			if (key.downArrow || input === "j") {
				store.setBoardsCursor((prev) => Math.min(store.boardsList.length - 1, prev + 1));
			}
			if (key.return) {
				const selected = store.boardsList[store.boardsCursor];
				if (selected && selected !== store.boardKey) {
					store.switchToBoard(selected);
				} else {
					store.setMode("navigate");
				}
			}
			if (input === "c") {
				store.setMode("new-board");
				store.setInputValue("");
			}
			if (input === "D") {
				store.deleteBoardEntry();
			}
			return;
		}

		if (store.mode === "new-board") {
			if (key.escape) {
				store.setMode("boards");
				store.setInputValue("");
			}
			return;
		}

		if (store.mode === "lanes") {
			if (key.escape || input === "e") {
				store.setMode("navigate");
				return;
			}
			if (key.upArrow || input === "k") {
				store.setLanesCursor((prev) => Math.max(0, prev - 1));
			}
			if (key.downArrow || input === "j") {
				store.setLanesCursor((prev) => Math.min(lanes.length - 1, prev + 1));
			}
			if (input === "c") {
				store.setMode("new-lane");
				store.setInputValue("");
			}
			if (input === "r") {
				const lane = lanes[store.lanesCursor];
				if (lane) {
					store.setInputValue(lane.name);
					store.setMode("rename-lane");
				}
			}
			if (input === "D") {
				store.deleteLane();
			}
			if (input === "K") {
				store.moveLane("up");
			}
			if (input === "J") {
				store.moveLane("down");
			}
			return;
		}

		if (store.mode === "new-lane") {
			if (key.escape) {
				store.setMode("lanes");
				store.setInputValue("");
			}
			return;
		}

		if (store.mode === "rename-lane") {
			if (key.escape) {
				store.setMode("lanes");
				store.setInputValue("");
			}
			return;
		}

		if (store.mode === "settings") {
			if (key.escape || input === "s") {
				store.setMode("navigate");
				return;
			}
			if (key.upArrow || input === "k") {
				store.setSettingsCursor((prev) => Math.max(0, prev - 1));
			}
			if (key.downArrow || input === "j") {
				store.setSettingsCursor((prev) => Math.min(0, prev + 1)); // only 1 setting for now
			}
			if (key.return || input === " ") {
				store.toggleSetting("vimMode");
			}
			return;
		}

		if (store.mode === "search") {
			if (key.escape) {
				store.setMode("navigate");
				store.setSearchValue("");
				store.setSearchQuery("");
			}
			return;
		}

		if (store.mode === "rename") {
			if (key.escape) {
				store.setMode("navigate");
				store.setInputValue("");
			}
			return;
		}

		if (store.mode === "add") {
			if (key.escape) {
				store.setMode("navigate");
				store.setInputValue("");
			}
			return;
		}

		// navigate mode
		if (key.escape && store.searchQuery) {
			store.setSearchQuery("");
			return;
		}
		if (input === "q") exit();
		if (input === "?") store.setMode("help");
		if (input === "b") {
			const boards = listBoards();
			store.setBoardsList(boards);
			store.setBoardsCursor(Math.max(0, boards.indexOf(store.boardKey)));
			store.setMode("boards");
		}
		if (input === "e") {
			store.setLanesCursor(store.activeLane);
			store.setMode("lanes");
		}
		if (input === "s") {
			store.setMode("settings");
			store.setSettingsCursor(0);
		}
		if (input === "/") {
			store.setMode("search");
			store.setSearchValue("");
			store.setSearchQuery("");
		}
		if (input === "n" && store.searchQuery) { store.findNext(true); return; }
		if (input === "N" && store.searchQuery) store.findNext(false);
		if (input === "n") {
			store.setMode("add");
			store.setInputValue("");
		}
		if (key.return) {
			store.openDetail();
		}
		if (key.leftArrow || input === "h") {
			const next = Math.max(0, store.activeLane - 1);
			store.setActiveLane(next);
			store.setActiveCard((c) => Math.min(c, Math.max(0, lanes[next]!.cards.length - 1)));
		}
		if (key.rightArrow || input === "l") {
			const next = Math.min(lanes.length - 1, store.activeLane + 1);
			store.setActiveLane(next);
			store.setActiveCard((c) => Math.min(c, Math.max(0, lanes[next]!.cards.length - 1)));
		}
		if (key.upArrow || input === "k") {
			store.setActiveCard((prev) => Math.max(0, prev - 1));
		}
		if (key.downArrow || input === "j") {
			store.setActiveCard((prev) => Math.min(lanes[store.activeLane]!.cards.length - 1, prev + 1));
		}
		const num = parseInt(input, 10);
		if (!isNaN(num) && num >= 1 && num <= lanes.length) {
			const target = num - 1;
			store.setActiveLane(target);
			store.setActiveCard((c) => Math.min(c, Math.max(0, lanes[target]!.cards.length - 1)));
		}
		if (input === "$") {
			store.setMode("rename");
			store.setInputValue(store.boardName());
		}
		if (input === "H") store.moveCard("left");
		if (input === "L") store.moveCard("right");
		if (input === "J") store.moveCardVertical("down");
		if (input === "K") store.moveCardVertical("up");
		if (input === "d") store.deleteCard();
		if (input === "p") store.cyclePriority();
	});
}
