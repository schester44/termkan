import {
	loadMeta, saveBoard, saveMeta, listBoards,
	type Card, type Comment,
} from "../state/persistence.js";
import {
	resolveBoard, jsonMode, json, out, error,
	parseFlags, getPositionalArgs, findCardById, findLaneByName,
	dim, bold, cyan, yellow, green,
} from "./helpers.js";

export function cmdStatus(): void {
	const { key, data } = resolveBoard();

	const jsonData = {
		board: key,
		name: data.name,
		lanes: data.lanes.map((lane) => ({
			name: lane.name,
			cards: lane.cards.map((c) => ({
				id: c.id,
				title: c.title,
				hasDetails: c.details.length > 0,
				comments: (c.comments ?? []).length,
			})),
		})),
	};

	if (jsonMode) { json(jsonData); return; }

	const lines: string[] = [];
	lines.push(`${cyan("🗂  " + data.name)} ${dim(`[${key}]`)}`);
	lines.push("");
	for (const lane of data.lanes) {
		lines.push(`  ${bold(lane.name)} ${dim(`(${lane.cards.length})`)}`);
		if (lane.cards.length === 0) {
			lines.push(`    ${dim("empty")}`);
		} else {
			for (const card of lane.cards) {
				const detail = card.details.length > 0 ? " 📝" : "";
				lines.push(`    ${dim(`#${card.id}`)} ${card.title}${detail}`);
			}
		}
		lines.push("");
	}
	process.stdout.write(lines.join("\n") + "\n");
}

export function cmdBoards(): void {
	const boards = listBoards();
	const meta = loadMeta();

	const jsonData = { boards, current: meta.lastBoard };

	if (jsonMode) { json(jsonData); return; }

	const lines: string[] = [];
	lines.push(cyan("📚 Boards"));
	lines.push("");
	for (const b of boards) {
		const marker = b === meta.lastBoard ? ` ${green("← active")}` : "";
		lines.push(`  ${b}${marker}`);
	}
	process.stdout.write(lines.join("\n") + "\n");
}

export function cmdCards(args: string[]): void {
	const flags = parseFlags(args);
	const { key, data } = resolveBoard();
	const laneFilter = flags["lane"];

	const lanes = laneFilter
		? data.lanes.filter((l) => l.name.toLowerCase() === laneFilter.toLowerCase())
		: data.lanes;

	const cards = lanes.flatMap((lane) =>
		lane.cards.map((c) => ({
			id: c.id,
			title: c.title,
			lane: lane.name,
			hasDetails: c.details.length > 0,
			comments: (c.comments ?? []).length,
		}))
	);

	const jsonData = { board: key, cards };

	if (jsonMode) { json(jsonData); return; }

	if (cards.length === 0) {
		process.stdout.write(dim("No cards found.") + "\n");
		return;
	}
	const lines: string[] = [];
	let currentLane = "";
	for (const c of cards) {
		if (c.lane !== currentLane) {
			if (currentLane) lines.push("");
			lines.push(`  ${bold(c.lane)}`);
			currentLane = c.lane;
		}
		const detail = c.hasDetails ? " 📝" : "";
		lines.push(`    ${dim(`#${c.id}`)} ${c.title}${detail}`);
	}
	process.stdout.write(lines.join("\n") + "\n");
}

export function cmdDetail(args: string[]): void {
	const positional = getPositionalArgs(args);
	const idStr = positional[0];
	if (!idStr) error("Usage: tk detail <card-id>");
	const id = parseInt(idStr, 10);
	if (isNaN(id)) error("Card ID must be a number");

	const { key, data } = resolveBoard();
	const found = findCardById(data, id);
	if (!found) error(`Card #${id} not found`);

	const comments = found.card.comments ?? [];
	const jsonData = {
		board: key,
		id: found.card.id,
		title: found.card.title,
		details: found.card.details,
		comments,
		lane: data.lanes[found.laneIndex]!.name,
	};

	if (jsonMode) { json(jsonData); return; }

	const lines: string[] = [];
	lines.push(`${bold(found.card.title)} ${dim(`#${found.card.id}`)}`);
	lines.push(`${dim("Lane:")} ${cyan(data.lanes[found.laneIndex]!.name)}`);
	if (found.card.details) {
		lines.push("");
		lines.push(found.card.details);
	} else {
		lines.push(dim("\nNo details."));
	}
	if (comments.length > 0) {
		lines.push("");
		lines.push(`${bold("Comments")} ${dim(`(${comments.length})`)}`);
		for (const c of comments) {
			const author = c.author ? `${cyan(c.author)} ` : "";
			const time = dim(new Date(c.timestamp).toLocaleString());
			lines.push(`  ${author}${time}`);
			lines.push(`    ${c.text}`);
		}
	}
	process.stdout.write(lines.join("\n") + "\n");
}

export function cmdAdd(args: string[]): void {
	const flags = parseFlags(args);
	const positional = getPositionalArgs(args);
	const title = positional[0];
	if (!title) error("Usage: tk add <title> [--lane <name>] [--details <text>]");

	const { key, data } = resolveBoard();
	const laneName = flags["lane"] ?? data.lanes[0]!.name;
	const laneIdx = findLaneByName(data, laneName);
	const details = flags["details"] ?? "";

	const newCard: Card = { id: data.nextId, title, details, comments: [] };
	data.nextId++;
	data.lanes[laneIdx]!.cards.push(newCard);
	saveBoard(key, data);

	const jsonData = { ok: true, id: newCard.id, title: newCard.title, lane: data.lanes[laneIdx]!.name };

	out(
		`${green("✓")} Added ${bold(`#${newCard.id}`)} "${newCard.title}" to ${cyan(data.lanes[laneIdx]!.name)}`,
		jsonData,
	);
}

export function cmdMove(args: string[]): void {
	const flags = parseFlags(args);
	const positional = getPositionalArgs(args);
	const idStr = positional[0];
	const toLane = flags["to"];

	if (!idStr || !toLane) error("Usage: tk move <card-id> --to <lane-name>");
	const id = parseInt(idStr, 10);
	if (isNaN(id)) error("Card ID must be a number");

	const { key, data } = resolveBoard();
	const found = findCardById(data, id);
	if (!found) error(`Card #${id} not found`);

	const targetIdx = findLaneByName(data, toLane);
	if (targetIdx === found.laneIndex) {
		out(
			`${dim("Already in")} ${cyan(data.lanes[targetIdx]!.name)}`,
			{ ok: true, id, lane: data.lanes[targetIdx]!.name, moved: false },
		);
		return;
	}

	const fromName = data.lanes[found.laneIndex]!.name;
	const toName = data.lanes[targetIdx]!.name;

	data.lanes[found.laneIndex]!.cards.splice(found.cardIndex, 1);
	data.lanes[targetIdx]!.cards.push(found.card);
	saveBoard(key, data);

	out(
		`${green("✓")} Moved ${bold(`#${id}`)} "${found.card.title}" ${dim(fromName)} → ${cyan(toName)}`,
		{ ok: true, id, title: found.card.title, from: fromName, to: toName },
	);
}

export function cmdDone(args: string[]): void {
	const positional = getPositionalArgs(args);
	const idStr = positional[0];
	if (!idStr) error("Usage: tk done <card-id>");

	const { data } = resolveBoard();
	const lastLane = data.lanes[data.lanes.length - 1]!.name;
	cmdMove([idStr, "--to", lastLane, ...(jsonMode ? ["--json"] : [])]);
}

export function cmdUpdate(args: string[]): void {
	const flags = parseFlags(args);
	const positional = getPositionalArgs(args);
	const idStr = positional[0];
	if (!idStr) error("Usage: tk update <card-id> [--title <text>] [--details <text>]");
	const id = parseInt(idStr, 10);
	if (isNaN(id)) error("Card ID must be a number");

	const { key, data } = resolveBoard();
	const found = findCardById(data, id);
	if (!found) error(`Card #${id} not found`);

	if (flags["title"] !== undefined) found.card.title = flags["title"];
	if (flags["details"] !== undefined) found.card.details = flags["details"];
	saveBoard(key, data);

	const jsonData = {
		ok: true,
		id: found.card.id,
		title: found.card.title,
		details: found.card.details,
		lane: data.lanes[found.laneIndex]!.name,
	};

	out(
		`${green("✓")} Updated ${bold(`#${found.card.id}`)} "${found.card.title}"`,
		jsonData,
	);
}

export function cmdDelete(args: string[]): void {
	const positional = getPositionalArgs(args);
	const idStr = positional[0];
	if (!idStr) error("Usage: tk rm <card-id>");
	const id = parseInt(idStr, 10);
	if (isNaN(id)) error("Card ID must be a number");

	const { key, data } = resolveBoard();
	const found = findCardById(data, id);
	if (!found) error(`Card #${id} not found`);

	const laneName = data.lanes[found.laneIndex]!.name;
	data.lanes[found.laneIndex]!.cards.splice(found.cardIndex, 1);
	saveBoard(key, data);

	out(
		`${green("✓")} Deleted ${bold(`#${id}`)} "${found.card.title}" from ${cyan(laneName)}`,
		{ ok: true, id, title: found.card.title, lane: laneName },
	);
}

export function cmdNew(args: string[]): "open" | "done" {
	const positional = getPositionalArgs(args);
	const name = positional[0];
	if (!name) error("Usage: tk new <board-name> [-d]");

	const detached = args.includes("-d");
	const key = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
	const boards = listBoards();
	if (boards.includes(key)) error(`Board "${key}" already exists`);

	saveBoard(key, {
		nextId: 1,
		name: key,
		lanes: [
			{ name: "To Do", cards: [] },
			{ name: "In Progress", cards: [] },
			{ name: "Done", cards: [] },
		],
		settings: { vimMode: true },
	});
	saveMeta({ lastBoard: key });

	if (detached) {
		out(
			`${green("✓")} Created board ${cyan(key)} ${dim("(now active)")}`,
			{ ok: true, board: key },
		);
		return "done";
	}
	return "open";
}

export function cmdUse(args: string[]): void {
	const positional = getPositionalArgs(args);
	const name = positional[0];
	if (!name) error("Usage: tk use <board-name>");

	const boards = listBoards();
	if (!boards.includes(name)) error(`Board "${name}" not found. Available: ${boards.join(", ")}`);

	saveMeta({ lastBoard: name });

	out(
		`${green("✓")} Switched to board ${cyan(name)}`,
		{ ok: true, board: name },
	);
}

export function cmdComment(args: string[]): void {
	const positional = getPositionalArgs(args);
	const idStr = positional[0];
	const text = positional.slice(1).join(" ");
	if (!idStr || !text) error("Usage: tk comment <card-id> <text> [--author <name>]");
	const id = parseInt(idStr, 10);
	if (isNaN(id)) error("Card ID must be a number");

	const flags = parseFlags(args);
	const { key, data } = resolveBoard();
	const found = findCardById(data, id);
	if (!found) error(`Card #${id} not found`);

	const comment: Comment = {
		text,
		timestamp: new Date().toISOString(),
		...(flags["author"] ? { author: flags["author"] } : {}),
	};

	if (!found.card.comments) found.card.comments = [];
	found.card.comments.push(comment);
	saveBoard(key, data);

	const jsonData = {
		ok: true,
		id: found.card.id,
		comment,
		totalComments: found.card.comments.length,
	};

	out(
		`${green("✓")} Added comment to ${bold(`#${found.card.id}`)} "${found.card.title}"`,
		jsonData,
	);
}

export function cmdHelp(): void {
	const help = `${bold("tk")} - terminal kanban board

${bold("Usage:")} tk [command] [options]

${bold("Commands:")}
  ${dim("(none)")}                    Open interactive TUI
  ${yellow("status")}                    Show board overview
  ${yellow("boards")}                    List all boards
  ${yellow("cards")} ${dim("[--lane <name>]")}     List cards, optionally filtered by lane
  ${yellow("detail")} ${dim("<id>")}               Show card details
  ${yellow("add")} ${dim("<title>")} ${dim("[options]")}     Add a new card
    ${dim("--lane <name>")}           Target lane (default: first lane)
    ${dim("--details <text>")}        Card details/description
  ${yellow("move")} ${dim("<id> --to <lane>")}     Move card to a different lane
  ${yellow("done")} ${dim("<id>")}                 Move card to last lane
  ${yellow("update")} ${dim("<id>")} ${dim("[options]")}   Update a card
    ${dim("--title <text>")}          New title
    ${dim("--details <text>")}        New details
  ${yellow("comment")} ${dim("<id> <text>")} ${dim("[options]")}  Add a comment to a card
    ${dim("--author <name>")}        Comment author
  ${yellow("rm")} ${dim("<id>")}                   Delete a card
  ${yellow("new")} ${dim("<board>")} ${dim("[-d]")}          Create a new board (-d: detached, don't open TUI)
  ${yellow("use")} ${dim("<board>")}               Switch active board

${bold("Global options:")}
  ${dim("--board <name>")}            Use a specific board (default: last used)
  ${dim("--json")}                    Output full structured JSON
  ${yellow("help")}                      Show this help message
`;
	process.stdout.write(help);
}
