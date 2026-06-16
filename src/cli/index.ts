import { migrateOldBoard } from '../state/persistence.js';
import { globalArgs, error } from './helpers.js';
import {
  cmdBoards,
  cmdCards,
  cmdDetail,
  cmdAdd,
  cmdMove,
  cmdDone,
  cmdUpdate,
  cmdDelete,
  cmdComment,
  cmdPriority,
  cmdArchive,
  cmdNew,
  cmdUse,
  cmdHelp,
} from './commands.js';

migrateOldBoard();

const SUBCOMMANDS: Record<string, (args: string[]) => void | 'open'> = {
  boards: () => cmdBoards(),
  cards: cmdCards,
  detail: cmdDetail,
  add: cmdAdd,
  move: cmdMove,
  done: cmdDone,
  update: cmdUpdate,
  rm: cmdDelete,
  ls: cmdCards,
  mv: cmdMove,
  comment: cmdComment,
  priority: cmdPriority,
  archive: cmdArchive,
  new: (args) => {
    if (cmdNew(args) === 'open') return 'open';
  },
  use: cmdUse,
  help: () => cmdHelp(),
};

export function tryRunCli(): boolean {
  const args = globalArgs;

  if (args.includes('--help') || args.includes('-h')) {
    cmdHelp();
    return true;
  }

  // find the first positional arg (skip --flag value pairs)
  let command: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--json') continue;
    if (arg.startsWith('--')) {
      i++;
      continue;
    }
    command = arg;
    break;
  }

  if (!command) return false;
  if (!SUBCOMMANDS[command]) {
    error(`Unknown command: "${command}". Run "tk help" for usage.`);
  }

  const handler = SUBCOMMANDS[command]!;
  const cmdIdx = args.indexOf(command);
  const result = handler(args.slice(cmdIdx + 1).filter((a) => a !== '--json'));
  if (result === 'open') return false;
  return true;
}
