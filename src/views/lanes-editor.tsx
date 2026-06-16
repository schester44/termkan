import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../state/store.js";

export function LanesEditor() {
	const {
		mode, lanesCursor, inputValue, lanes,
		setInputValue, addLane, renameLane,
	} = useStore();

	const boardLanes = lanes();

	return (
		<Box flexDirection="column" padding={1}>
			<Box justifyContent="center" marginBottom={1}>
				<Text bold color="cyan">
					🏊 Lanes
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				{boardLanes.map((lane, i) => {
					const isSelected = i === lanesCursor;
					const cardCount = lane.cards.length;
					return (
						<Box key={i}>
							{mode === "rename-lane" && isSelected ? (
								<Box>
									<Text bold color="yellow">▸ </Text>
									<TextInput
										value={inputValue}
										onChange={setInputValue}
										onSubmit={(val) => val.trim() && renameLane(val.trim())}
										focus={true}
									/>
								</Box>
							) : (
								<Text bold={isSelected} color={isSelected ? "yellow" : "white"}>
									{isSelected ? "▸ " : "  "}
									{lane.name}
									<Text dimColor> ({cardCount} card{cardCount !== 1 ? "s" : ""})</Text>
								</Text>
							)}
						</Box>
					);
				})}

				{mode === "new-lane" && (
					<Box marginTop={1}>
						<Text bold color="green">New lane: </Text>
						<TextInput
							value={inputValue}
							onChange={setInputValue}
							onSubmit={(val) => val.trim() && addLane(val.trim())}
							placeholder="Lane name..."
							focus={true}
						/>
					</Box>
				)}
			</Box>

			<Box marginTop={1} justifyContent="center">
				<Text dimColor>
					<Text bold color="yellow">j/k</Text> navigate{"  "}
					<Text bold color="yellow">J/K</Text> reorder{"  "}
					<Text bold color="yellow">c</Text> create{"  "}
					<Text bold color="yellow">r</Text> rename{"  "}
					{boardLanes.length > 1 && (
						<><Text bold color="yellow">D</Text> delete{"  "}</>
					)}
					<Text bold color="yellow">Esc</Text> back
				</Text>
			</Box>
		</Box>
	);
}
