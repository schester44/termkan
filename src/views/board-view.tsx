import React from "react";
import { Box, Text, useStdout } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../state/store.js";
import { LaneColumn } from "../components/lane-column.js";
import { HelpPanel } from "../components/help-panel.js";

export function BoardView() {
	const {
		mode, boardName, inputValue, searchValue, searchQuery, priorityFilter,
		setInputValue, setSearchValue, setSearchQuery,
		renameBoard, findNext, lanes,
	} = useStore();

	const { stdout } = useStdout();
	const termWidth = stdout?.columns ?? 80;
	const termHeight = stdout?.rows ?? 24;
	const boardLanes = lanes();

	// Calculate lane widths
	// Ink's width includes border+padding, so only subtract outer padding (2) and margins between lanes
	const laneMargins = boardLanes.length - 1; // last lane has no right margin
	const availableWidth = termWidth - 2 - laneMargins;
	const laneWidth = Math.max(20, Math.floor(availableWidth / boardLanes.length));

	// Calculate available height for lanes
	// outer padding: 2 (top+bottom)
	// board title + marginBottom: 2
	// bottom hint bar + marginTop: 2
	// search bar (if active): 2
	const chromeHeight = 2 + 2 + 2 + (mode === "search" ? 2 : 0);
	const lanesHeight = termHeight - chromeHeight;

	const handleSearchSubmit = (query: string) => {
		if (query.trim()) {
			setSearchQuery(query.trim());
			findNext(true);
		}
		useStore.getState().setMode("navigate");
		setSearchValue("");
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				{mode === "rename" ? (
					<Box>
						<Text bold color="cyan">🗂  </Text>
						<TextInput
							value={inputValue}
							onChange={setInputValue}
							onSubmit={(val) => val.trim() && renameBoard(val.trim())}
							focus={true}
						/>
					</Box>
				) : (
					<Box>
						<Text bold color="cyan">
							🗂  {boardName()}
						</Text>
						<Text dimColor> [{useStore.getState().boardKey}]</Text>
					</Box>
				)}
			</Box>

			<Box>
				{boardLanes.map((lane, i) => (
					<LaneColumn key={lane.name} lane={lane} laneIndex={i} laneWidth={laneWidth} isLast={i === boardLanes.length - 1} maxHeight={lanesHeight} />
				))}
			</Box>

			{mode === "search" && (
				<Box marginTop={1}>
					<Text bold color="yellow">/</Text>
					<TextInput
						value={searchValue}
						onChange={setSearchValue}
						onSubmit={handleSearchSubmit}
						focus={true}
					/>
				</Box>
			)}

			{mode === "help" && <HelpPanel />}

			<Box marginTop={mode === "search" || mode === "help" ? 0 : 1} justifyContent="center">
				{mode === "navigate" ? (
					<Text dimColor>
						Press <Text bold color="yellow">?</Text> for help
						{searchQuery ? (
							<Text>{"  "}<Text bold color="yellow">n</Text>/<Text bold color="yellow">N</Text> next/prev result</Text>
						) : null}
						{priorityFilter !== "all" ? (
							<Text>{"  "}filter: <Text bold color={priorityFilter === "high" ? "red" : priorityFilter === "medium" ? "yellow" : priorityFilter === "low" ? "blue" : "white"}>{priorityFilter}</Text> <Text dimColor>(<Text bold color="yellow">f</Text> to change)</Text></Text>
						) : null}
					</Text>
				) : mode === "search" ? (
					<Text dimColor>
						Type search and press <Text bold color="green">Enter</Text>
						{"  "}
						<Text bold color="red">Esc</Text> to cancel
					</Text>
				) : mode === "add" ? (
					<Text dimColor>
						Type card title and press <Text bold color="green">Enter</Text> to add
						{"  "}
						<Text bold color="red">Esc</Text> to cancel
					</Text>
				) : null}
			</Box>
		</Box>
	);
}
