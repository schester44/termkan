import React from "react";
import { Box, Text } from "ink";
import { highlightMatch } from "../utils.js";

interface CardProps {
	title: string;
	isSelected: boolean;
	hasDetails: boolean;
	searchQuery: string;
	maxContentLines?: number;
}

/**
 * Truncate text to fit within a given number of display lines at a given width.
 * Adds "…" if truncated.
 */
function truncateToLines(text: string, maxLines: number, lineWidth: number): string {
	if (lineWidth <= 0 || maxLines <= 0) return text;
	const maxChars = maxLines * lineWidth;
	if (text.length <= maxChars) return text;
	return text.slice(0, maxChars - 1) + "…";
}

export function Card({ title, isSelected, hasDetails, searchQuery, maxContentLines = 3 }: CardProps) {
	const isMatch = searchQuery && (
		title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const prefix = isSelected ? "▸ " : "  ";
	const suffix = hasDetails ? " 📝" : "";
	const displayTitle = truncateToLines(title, maxContentLines, 40) + suffix;

	return (
		<Box
			borderStyle="round"
			borderColor={isSelected ? "yellow" : "gray"}
			paddingX={1}
			marginBottom={0}
		>
			<Text bold={isSelected} wrap="wrap">
				{prefix}
				{isMatch ? highlightMatch(displayTitle, searchQuery) : displayTitle}
			</Text>
		</Box>
	);
}
