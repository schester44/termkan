import { loadBoard, loadMeta, type BoardData, type Card } from '../state/persistence.js';

// --- globals ---

export const globalArgs = process.argv.slice(2);
export const jsonMode = globalArgs.includes('--json');

// --- helpers ---

export function resolveBoard(): { key: string; data: BoardData } {
  const meta = loadMeta();
  const boardIdx = globalArgs.indexOf('--board');
  const key =
    boardIdx !== -1 && globalArgs[boardIdx + 1] ? globalArgs[boardIdx + 1]! : meta.lastBoard;
  return { key, data: loadBoard(key) };
}

export function json(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

export function out(pretty: string, data: unknown): void {
  if (jsonMode) {
    json(data);
  } else {
    process.stdout.write(pretty + '\n');
  }
}

export function error(msg: string): never {
  if (jsonMode) {
    json({ error: msg });
  } else {
    process.stderr.write(`\x1b[31merror:\x1b[0m ${msg}\n`);
  }
  process.exit(1);
}

export function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith('--') && arg !== '--json' && i + 1 < args.length) {
      flags[arg.slice(2)] = args[i + 1]!;
      i++;
    }
  }
  return flags;
}

export function getPositionalArgs(args: string[]): string[] {
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--json') continue;
    if (arg.startsWith('--')) {
      i++; // skip flag value
    } else {
      positional.push(arg);
    }
  }
  return positional;
}

export function findCardById(
  data: BoardData,
  id: number,
): { card: Card; laneIndex: number; cardIndex: number } | null {
  for (let li = 0; li < data.lanes.length; li++) {
    for (let ci = 0; ci < data.lanes[li]!.cards.length; ci++) {
      if (data.lanes[li]!.cards[ci]!.id === id) {
        return { card: data.lanes[li]!.cards[ci]!, laneIndex: li, cardIndex: ci };
      }
    }
  }
  return null;
}

export function findLaneByName(data: BoardData, name: string): number {
  const lower = name.toLowerCase();
  const idx = data.lanes.findIndex((l) => l.name.toLowerCase() === lower);
  if (idx === -1)
    error(`Lane "${name}" not found. Available: ${data.lanes.map((l) => l.name).join(', ')}`);
  return idx;
}

// --- formatting helpers ---

export const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
export const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
export const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
export const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
export const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
