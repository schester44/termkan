import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../state/store.js";

export function ArchiveView() {
	const { boardData, settingsCursor } = useStore();
	const archive = boardData.archive ?? [];

	return (
		<Box flexDirection="column" padding={1}>
			<Box justifyContent="center" marginBottom={1}>
				<Text bold color="cyan">
					📦 Archive ({archive.length})
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				{archive.length === 0 ? (
					<Text dimColor italic>No archived cards</Text>
				) : (
					archive.map((card, i) => {
						const isSelected = i === settingsCursor;
						return (
							<Box key={card.id} marginBottom={i < archive.length - 1 ? 0 : 0}>
								<Text bold={isSelected} color={isSelected ? "yellow" : "white"}>
									{isSelected ? "▸ " : "  "}
									<Text dimColor>#{card.id}</Text> {card.title}
									<Text dimColor> [{card.fromLane} → archived {new Date(card.archivedAt).toLocaleDateString()}]</Text>
								</Text>
							</Box>
						);
					})
				)}
			</Box>

			<Box marginTop={1} justifyContent="center">
				<Text dimColor>
					<Text bold color="yellow">j/k</Text> navigate{"  "}
					<Text bold color="yellow">Esc</Text> back
				</Text>
			</Box>
		</Box>
	);
}
