import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";

/** Apply lightweight markdown styling to a line of text */
function styledLine(line: string): React.ReactNode {
	// Headings
	if (line.startsWith("### ")) return <Text bold color="cyan">{line}</Text>;
	if (line.startsWith("## ")) return <Text bold color="cyan">{line}</Text>;
	if (line.startsWith("# ")) return <Text bold color="yellow">{line}</Text>;

	// Horizontal rule
	if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
		return <Text dimColor>{"─".repeat(40)}</Text>;
	}

	// List items
	const listMatch = line.match(/^(\s*)([-*])\s/);
	if (listMatch) {
		const indent = listMatch[1];
		const rest = line.slice(listMatch[0].length);
		return <Text>{indent}<Text color="cyan">•</Text> {styledInline(rest)}</Text>;
	}

	return styledInline(line);
}

/** Apply inline markdown styling: **bold**, *italic*, `code` */
function styledInline(text: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
	let last = 0;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > last) parts.push(text.slice(last, match.index));
		if (match[2]) {
			parts.push(<Text key={match.index} bold>{match[2]}</Text>);
		} else if (match[3]) {
			parts.push(<Text key={match.index} italic>{match[3]}</Text>);
		} else if (match[4]) {
			parts.push(<Text key={match.index} color="green">{match[4]}</Text>);
		}
		last = match.index + match[0].length;
	}
	if (last === 0) return text;
	if (last < text.length) parts.push(text.slice(last));
	return <>{parts}</>;
}
import {
	TextBuffer,
	createInitialContext,
	processKeystroke,
	type VimContext,
	type VimMode,
} from "@vimee/core";

type Props = {
	value: string;
	onChange: (value: string) => void;
	focus?: boolean;
	onExit?: () => void;
	vimMode?: boolean;
	onExternalEdit?: () => void;
	onComment?: () => void;
};

export default function TextArea({ value, onChange, focus = true, onExit, vimMode = false, onExternalEdit, onComment }: Props) {
	// Simple mode: just cursor position
	const [cursor, setCursor] = useState({ line: 0, col: value.length });

	// Vim mode: full engine state
	const bufferRef = useRef(new TextBuffer(value));
	const [vimCtx, setVimCtx] = useState<VimContext>(() =>
		createInitialContext({ line: 0, col: 0 })
	);
	// Track the last value we emitted via onChange so we can distinguish
	// our own edits from genuinely external value changes
	const lastEmittedRef = useRef(value);

	// Only recreate buffer when the value changes from an external source
	// (e.g. opening a different card), not from our own edits
	useEffect(() => {
		if (vimMode) {
			if (value === lastEmittedRef.current) return;
			const buf = bufferRef.current;
			if (buf.getContent() !== value) {
				bufferRef.current = new TextBuffer(value);
				setVimCtx(createInitialContext({ line: 0, col: 0 }));
				lastEmittedRef.current = value;
			}
		}
	}, [value, vimMode]);

	// Simple mode: keep cursor in bounds
	useEffect(() => {
		if (!vimMode) {
			const lines = value.split("\n");
			setCursor((c) => ({
				line: Math.min(c.line, lines.length - 1),
				col: Math.min(c.col, (lines[c.line] ?? "").length),
			}));
		}
	}, [value, vimMode]);

	// --- Simple (non-vim) helpers ---
	const posFromLineCol = (line: number, col: number): number => {
		const lines = value.split("\n");
		let pos = 0;
		for (let i = 0; i < line && i < lines.length; i++) pos += lines[i]!.length + 1;
		return pos + Math.min(col, (lines[line] ?? "").length);
	};

	const insertAtCursor = (text: string) => {
		const pos = posFromLineCol(cursor.line, cursor.col);
		const next = value.slice(0, pos) + text + value.slice(pos);
		onChange(next);
		// advance cursor
		const added = text.split("\n");
		if (added.length > 1) {
			setCursor({ line: cursor.line + added.length - 1, col: added[added.length - 1]!.length });
		} else {
			setCursor({ ...cursor, col: cursor.col + text.length });
		}
	};

	const backspace = () => {
		const pos = posFromLineCol(cursor.line, cursor.col);
		if (pos > 0) {
			onChange(value.slice(0, pos - 1) + value.slice(pos));
			if (cursor.col > 0) {
				setCursor({ ...cursor, col: cursor.col - 1 });
			} else {
				const prevLine = cursor.line - 1;
				const prevLen = value.split("\n")[prevLine]?.length ?? 0;
				setCursor({ line: prevLine, col: prevLen });
			}
		}
	};

	useInput(
		(input, key) => {
			if (!focus) return;

			if (vimMode) {
				// Handle quit action from :q
				const mapKey = (input: string, key: any): { mapped: string; ctrl: boolean } => {
					if (key.escape) return { mapped: "Escape", ctrl: false };
					if (key.return) return { mapped: "Enter", ctrl: false };
					if (key.backspace || key.delete) return { mapped: "Backspace", ctrl: false };
					if (key.upArrow) return { mapped: "ArrowUp", ctrl: false };
					if (key.downArrow) return { mapped: "ArrowDown", ctrl: false };
					if (key.leftArrow) return { mapped: "ArrowLeft", ctrl: false };
					if (key.rightArrow) return { mapped: "ArrowRight", ctrl: false };
					if (key.tab) return { mapped: "Tab", ctrl: false };
					if (key.ctrl) return { mapped: input, ctrl: true };
					return { mapped: input, ctrl: false };
				};

				// Arrow keys in insert mode — handle directly since vimee doesn't
				if (vimCtx.mode === "insert" && (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow)) {
					const buf = bufferRef.current;
					const lines = buf.getContent().split("\n");
					const { line, col } = vimCtx.cursor;
					let newLine = line;
					let newCol = col;
					if (key.leftArrow) {
						newCol = Math.max(0, col - 1);
					} else if (key.rightArrow) {
						newCol = Math.min((lines[line] ?? "").length, col + 1);
					} else if (key.upArrow) {
						if (line > 0) {
							newLine = line - 1;
							newCol = Math.min(col, (lines[newLine] ?? "").length);
						}
					} else if (key.downArrow) {
						if (line < lines.length - 1) {
							newLine = line + 1;
							newCol = Math.min(col, (lines[newLine] ?? "").length);
						}
					}
					setVimCtx({ ...vimCtx, cursor: { line: newLine, col: newCol } });
					return;
				}

				// Esc in normal mode exits
				if (key.escape && vimCtx.mode === "normal") {
					onExit?.();
					return;
				}

				// E in normal mode opens external editor
				if (input === "E" && vimCtx.mode === "normal" && onExternalEdit) {
					onExternalEdit();
					return;
				}

				// C in normal mode opens comment input
				if (input === "C" && vimCtx.mode === "normal" && onComment) {
					onComment();
					return;
				}

				const { mapped, ctrl } = mapKey(input, key);
				const buf = bufferRef.current;
				const { newCtx, actions } = processKeystroke(mapped, vimCtx, buf, ctrl);
				setVimCtx(newCtx);

				// Process actions
				for (const action of actions) {
					if (action.type === "content-change") {
						lastEmittedRef.current = action.content;
						onChange(action.content);
					} else if (action.type === "quit") {
						onExit?.();
						return;
					}
				}

				// Sync buffer content after mutation
				const content = buf.getContent();
				if (content !== value) {
					lastEmittedRef.current = content;
					onChange(content);
				}
			} else {
				// SIMPLE MODE
				if (key.escape) { onExit?.(); return; }

				const lines = value.split("\n");
				if (key.return) {
					insertAtCursor("\n");
				} else if (key.backspace || key.delete) {
					backspace();
				} else if (key.leftArrow) {
					if (cursor.col > 0) setCursor({ ...cursor, col: cursor.col - 1 });
				} else if (key.rightArrow) {
					const lineLen = (lines[cursor.line] ?? "").length;
					if (cursor.col < lineLen) setCursor({ ...cursor, col: cursor.col + 1 });
				} else if (key.upArrow) {
					if (cursor.line > 0) {
						const prevLen = (lines[cursor.line - 1] ?? "").length;
						setCursor({ line: cursor.line - 1, col: Math.min(cursor.col, prevLen) });
					}
				} else if (key.downArrow) {
					if (cursor.line < lines.length - 1) {
						const nextLen = (lines[cursor.line + 1] ?? "").length;
						setCursor({ line: cursor.line + 1, col: Math.min(cursor.col, nextLen) });
					}
				} else if (!key.tab && !key.ctrl && !key.meta) {
					insertAtCursor(input);
				}
			}
		},
		{ isActive: focus }
	);

	// Determine cursor position and mode for rendering
	const cursorPos = vimMode ? vimCtx.cursor : cursor;
	const currentMode: VimMode | "insert" = vimMode ? vimCtx.mode : "insert";
	const lines = value.split("\n");

	return (
		<Box flexDirection="column">
			{value === "" ? (
				<Text dimColor>{vimMode && currentMode !== "insert" ? "█ Press i to start typing..." : "█ Start typing..."}</Text>
			) : (
				lines.map((line, i) => {
					if (i === cursorPos.line) {
						const col = Math.min(cursorPos.col, line.length);
						const before = line.slice(0, col);
						const cursorChar = line[col] ?? " ";
						const after = line.slice(col + 1);
						return (
							<Text key={i}>
								{before}
								<Text inverse>{cursorChar}</Text>
								{after}
							</Text>
						);
					}
					return <Text key={i}>{line ? styledLine(line) : " "}</Text>;
				})
			)}

			{/* Mode indicator */}
			{vimMode && (
				<Box justifyContent="flex-end" marginTop={1}>
					<Text dimColor color={currentMode === "insert" ? "green" : currentMode === "visual" || currentMode === "visual-line" ? "magenta" : "blue"}>
						{currentMode.toUpperCase()}
					</Text>
					{vimCtx.statusMessage && !vimCtx.statusMessage.startsWith("--") && (
						<Text color={vimCtx.statusError ? "red" : "white"}> {vimCtx.statusMessage}</Text>
					)}
				</Box>
			)}
		</Box>
	);
}
