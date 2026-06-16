import React from "react";
import { Box, Text } from "ink";
import { highlightMatch } from "../utils.js";
import type { Priority } from "../state/persistence.js";

interface CardProps {
	title: string;
	isSelected: boolean;
	hasDetails: boolean;
	searchQuery: string;
	priority?: Priority;
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

const PRIORITY_INDICATOR: Record<Priority, { icon: string; color: string }> = {
	high:   { icon: "🔴", color: "red" },
	medium: { icon: "🟡", color: "yellow" },
	low:    { icon: "🔵", color: "blue" },
	none:   { icon: "",   color: "" },
};

export function Card({ title, isSelected, hasDetails, searchQuery, priority = "none", maxContentLines = 3 }: CardProps) {
	const isMatch = searchQuery && (
		title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const prefix = isSelected ? "▸ " : "  ";
	const prio = PRIORITY_INDICATOR[priority];
	const prioPrefix = prio.icon ? prio.icon + " " : "";
	const suffix = hasDetails ? " 📝" : "";
	const displayTitle = truncateToLines(title, maxContentLines, 40) + suffix;

	const borderColor = priority !== "none" && isSelected
		? prio.color
		: isSelected ? "yellow" : "gray";

	return (
		<Box
			borderStyle="round"
			borderColor={borderColor}
			paddingX={1}
			marginBottom={0}
		>
			<Text bold={isSelected} wrap="wrap">
				{prefix}{prioPrefix}
				{isMatch ? highlightMatch(displayTitle, searchQuery) : displayTitle}
			</Text>
		</Box>
	);
}
