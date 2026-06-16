import React, { useCallback, useState } from "react";
import { Box, Text, useInput, useStdin, useStdout } from "ink";
import TextInput from "ink-text-input";
import TextArea from "../textarea.js";
import { useStore } from "../state/store.js";
import { openInEditor } from "../utils/external-editor.js";
import type { Comment } from "../state/persistence.js";

export function DetailView() {
	const {
		activeLane, activeCard, detailsValue,
		setDetailsValue, saveDetails, lanes, settings,
	} = useStore();

	const boardLanes = lanes();
	const currentSettings = settings();
	const currentCard = boardLanes[activeLane]?.cards[activeCard];

	const { setRawMode } = useStdin();
	const { stdout } = useStdout();

	const [commentMode, setCommentMode] = useState(false);
	const [commentValue, setCommentValue] = useState("");

	// Handle Escape to cancel comment mode
	useInput((_input, key) => {
		if (key.escape && commentMode) {
			setCommentValue("");
			setCommentMode(false);
		}
	}, { isActive: commentMode });

	const handleExternalEdit = useCallback(() => {
		// Temporarily exit raw mode so the editor gets the terminal
		setRawMode(false);
		// Hide cursor escape + clear screen for clean handoff
		stdout?.write("\x1b[?25h"); // show cursor
		stdout?.write("\x1b[2J\x1b[H"); // clear screen

		const result = openInEditor(detailsValue);

		// Restore raw mode for Ink
		setRawMode(true);
		stdout?.write("\x1b[?25l"); // hide cursor again

		if (result !== null) {
			setDetailsValue(result);
		}
	}, [detailsValue, setDetailsValue, setRawMode, stdout]);

	if (!currentCard) return null;

	const detailHints = currentSettings.vimMode ? (
		<Text dimColor>
			Vim keybindings enabled{"  "}
			<Text bold color="yellow">:q</Text> save &amp; back{"  "}
			<Text bold color="yellow">E</Text> open in $EDITOR{"  "}
			<Text bold color="yellow">C</Text> add comment
		</Text>
	) : (
		<Text dimColor>
			Type to edit{"  "}
			<Text bold color="yellow">↑/↓/←/→</Text> move{"  "}
			<Text bold color="red">Esc</Text> save &amp; back
		</Text>
	);

	return (
		<Box flexDirection="column" padding={1}>
			<Box justifyContent="center" marginBottom={1}>
				<Text bold color="cyan">
					📋 Card Details
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				<Box marginBottom={1}>
					<Text bold color="white">
						{currentCard.title}
					</Text>
				</Box>

				<Box marginBottom={1} gap={2}>
					<Text dimColor>
						Lane: <Text color="cyan">{boardLanes[activeLane]!.name}</Text>
					</Text>
					<Text dimColor>
						Priority: {currentCard.priority === "high" ? <Text color="red">🔴 high</Text>
							: currentCard.priority === "medium" ? <Text color="yellow">🟡 medium</Text>
							: currentCard.priority === "low" ? <Text color="blue">🔵 low</Text>
							: <Text>none</Text>}
					</Text>
				</Box>

				<Box marginBottom={1}>
					<Text bold dimColor>Details:</Text>
				</Box>

				<Box
					borderStyle="single"
					borderColor="yellow"
					paddingX={1}
					paddingY={0}
					minHeight={5}
				>
					<TextArea
						value={detailsValue}
						onChange={setDetailsValue}
						focus={!commentMode}
						onExit={saveDetails}
						vimMode={currentSettings.vimMode}
						onExternalEdit={handleExternalEdit}
						onComment={() => setCommentMode(true)}
					/>
				</Box>

				{(currentCard.comments?.length > 0) && (
					<Box flexDirection="column" marginTop={1}>
						<Text bold dimColor>Comments ({currentCard.comments.length}):</Text>
						{currentCard.comments.map((c: Comment, i: number) => (
							<Box key={i} flexDirection="column" marginTop={i > 0 ? 1 : 0} marginLeft={1}>
								<Text>
									{c.author ? <Text color="cyan">{c.author} </Text> : null}
									<Text dimColor>{new Date(c.timestamp).toLocaleString()}</Text>
								</Text>
								<Text>  {c.text}</Text>
							</Box>
						))}
					</Box>
				)}

				{commentMode && (
					<Box marginTop={1}>
						<Text bold color="green">💬 </Text>
						<TextInput
							value={commentValue}
							onChange={setCommentValue}
							onSubmit={(val) => {
								if (val.trim()) {
									useStore.getState().addComment(val.trim());
								}
								setCommentValue("");
								setCommentMode(false);
							}}
							focus={true}
							placeholder="Type a comment..."
						/>
					</Box>
				)}
			</Box>

			<Box marginTop={1} justifyContent="center">
				{commentMode ? (
					<Text dimColor>
						Press <Text bold color="green">Enter</Text> to add comment{"  "}
						<Text bold color="red">Esc</Text> to cancel
					</Text>
				) : detailHints}
			</Box>
		</Box>
	);
}
