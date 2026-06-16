import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useStore } from "../state/store.js";

export function BoardsPicker() {
	const {
		mode, boardKey, boardsList, boardsCursor, inputValue,
		setInputValue, createBoard,
	} = useStore();

	const handleNewBoardSubmit = (value: string) => {
		const key = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
		createBoard(key);
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box justifyContent="center" marginBottom={1}>
				<Text bold color="cyan">
					📚 Boards
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				{boardsList.map((key, i) => {
					const isSelected = i === boardsCursor;
					const isCurrent = key === boardKey;
					return (
						<Box key={key}>
							<Text bold={isSelected} color={isSelected ? "yellow" : "white"}>
								{isSelected ? "▸ " : "  "}
								{key}
								{isCurrent ? <Text color="cyan"> (current)</Text> : ""}
							</Text>
						</Box>
					);
				})}

				{boardsList.length === 0 && (
					<Text dimColor italic>No boards yet</Text>
				)}

				{mode === "new-board" && (
					<Box marginTop={1}>
						<Text bold color="green">New board key: </Text>
						<TextInput
							value={inputValue}
							onChange={setInputValue}
							onSubmit={handleNewBoardSubmit}
							placeholder="my-board"
							focus={true}
						/>
					</Box>
				)}
			</Box>

			<Box marginTop={1} justifyContent="center">
				<Text dimColor>
					<Text bold color="yellow">j/k</Text> navigate{"  "}
					<Text bold color="yellow">Enter</Text> switch{"  "}
					<Text bold color="yellow">c</Text> create new{"  "}
					{boardsList.length > 1 && (
						<><Text bold color="yellow">D</Text> delete{"  "}</>
					)}
					<Text bold color="yellow">Esc</Text> back
				</Text>
			</Box>
		</Box>
	);
}
