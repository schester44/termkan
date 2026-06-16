import fs from "node:fs";
import path from "node:path";

export type Comment = {
	text: string;
	timestamp: string;
	author?: string;
};

export type Card = {
	id: number;
	title: string;
	details: string;
	comments: Comment[];
};

export type Lane = {
	name: string;
	cards: Card[];
};

export type Settings = {
	vimMode: boolean;
};

export type BoardData = {
	nextId: number;
	name: string;
	lanes: Lane[];
	settings: Settings;
};

export type Meta = {
	lastBoard: string;
};

const DEFAULT_SETTINGS: Settings = {
	vimMode: true,
};

function defaultBoard(key: string): BoardData {
	return {
		nextId: 1,
		name: key,
		lanes: [
			{ name: "To Do", cards: [] },
			{ name: "In Progress", cards: [] },
			{ name: "Done", cards: [] },
		],
		settings: { ...DEFAULT_SETTINGS },
	};
}

import os from "node:os";

const DATA_DIR = path.join(os.homedir(), ".termkan");
const BOARDS_DIR = path.join(DATA_DIR, "boards");
const META_FILE = path.join(DATA_DIR, "meta.json");

function ensureDirs(): void {
	fs.mkdirSync(BOARDS_DIR, { recursive: true });
}

function boardFile(key: string): string {
	return path.join(BOARDS_DIR, `${key}.json`);
}

export function loadMeta(): Meta {
	ensureDirs();
	try {
		const raw = fs.readFileSync(META_FILE, "utf-8");
		return JSON.parse(raw) as Meta;
	} catch {
		return { lastBoard: "default" };
	}
}

export function saveMeta(meta: Meta): void {
	ensureDirs();
	fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2) + "\n");
}

export function loadBoard(key: string): BoardData {
	ensureDirs();
	try {
		const raw = fs.readFileSync(boardFile(key), "utf-8");
		const data = JSON.parse(raw) as BoardData;
		if (!Array.isArray(data.lanes) || typeof data.nextId !== "number") {
			return defaultBoard(key);
		}
		return {
			...defaultBoard(key),
			...data,
			lanes: (data.lanes || []).map((lane) => ({
				...lane,
				cards: lane.cards.map((card) => ({
					...card,
					comments: card.comments ?? [],
				})),
			})),
			settings: { ...DEFAULT_SETTINGS, ...data.settings },
		};
	} catch {
		return defaultBoard(key);
	}
}

export function saveBoard(key: string, data: BoardData): void {
	ensureDirs();
	fs.writeFileSync(boardFile(key), JSON.stringify(data, null, 2) + "\n");
}

export function listBoards(): string[] {
	try {
		return fs
			.readdirSync(BOARDS_DIR)
			.filter((f) => f.endsWith(".json"))
			.map((f) => f.replace(/\.json$/, ""))
			.sort();
	} catch {
		return [];
	}
}

export function deleteBoard(key: string): void {
	try {
		fs.unlinkSync(boardFile(key));
	} catch {
		// ignore
	}
}

// Migrate old board.json if it exists
export function migrateOldBoard(): void {
	const oldFile = path.join(process.cwd(), "board.json");
	try {
		const raw = fs.readFileSync(oldFile, "utf-8");
		const data = JSON.parse(raw) as BoardData;
		if (Array.isArray(data.lanes)) {
			ensureDirs();
			const key = "default";
			if (!fs.existsSync(boardFile(key))) {
				fs.writeFileSync(boardFile(key), JSON.stringify(data, null, 2) + "\n");
				saveMeta({ lastBoard: key });
			}
			fs.unlinkSync(oldFile);
		}
	} catch {
		// no old file or invalid, ignore
	}
}
