import React from "react";
import { Text } from "ink";

// Preset tag colors for common tags
const PRESET_TAG_COLORS: Record<string, string> = {
	"#bug": "red",
	"#fix": "red",
	"#fixme": "red",
	"#todo": "yellow",
	"#hack": "yellow",
	"#wip": "yellow",
	"#feat": "green",
	"#done": "green",
	"#note": "cyan",
	"#idea": "magenta",
};

// Consistent color mapping for non-preset tags
const TAG_COLORS = ["cyan", "magenta", "green", "yellow", "blue", "red", "white"] as const;

function tagColor(tag: string): string {
	const preset = PRESET_TAG_COLORS[tag.toLowerCase()];
	if (preset) return preset;
	let hash = 0;
	for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
	return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]!;
}

/** Parse #hashtags from text and render them as colored badges */
export function renderWithTags(text: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	const regex = /(#[a-zA-Z0-9_-]+)/g;
	let last = 0;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > last) parts.push(text.slice(last, match.index));
		const tag = match[1]!;
		parts.push(<Text key={match.index} color={tagColor(tag)} bold>{tag}</Text>);
		last = match.index + tag.length;
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts.length > 0 ? parts : text;
}

/** Extract #hashtags from text */
export function extractTags(text: string): string[] {
	const matches = text.match(/#[a-zA-Z0-9_-]+/g);
	return matches ? [...new Set(matches)] : [];
}

export function highlightMatch(text: string, query: string): React.ReactNode {
	const parts: React.ReactNode[] = [];
	const lower = text.toLowerCase();
	const q = query.toLowerCase();
	let last = 0;
	let idx = lower.indexOf(q, last);
	while (idx !== -1) {
		if (idx > last) parts.push(text.slice(last, idx));
		parts.push(<Text key={idx} color="green" bold>{text.slice(idx, idx + q.length)}</Text>);
		last = idx + q.length;
		idx = lower.indexOf(q, last);
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts;
}
