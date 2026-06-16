import React from "react";
import { Text } from "ink";

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
