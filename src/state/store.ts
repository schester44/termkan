import { create } from 'zustand';
import {
  loadBoard,
  saveBoard,
  loadMeta,
  saveMeta,
  deleteBoard,
  type Lane,
  type Settings,
  type BoardData,
} from './persistence.js';
import type { Mode } from '../types.js';
import type { Priority, Card } from './persistence.js';

type UndoEntry = {
  card: Card;
  laneIndex: number;
  cardIndex: number;
};

export interface AppState {
  // board data
  boardKey: string;
  boardData: BoardData;

  // navigation
  activeLane: number;
  activeCard: number;
  mode: Mode;

  // input fields
  inputValue: string;
  detailsValue: string;
  searchValue: string;
  searchQuery: string;

  // boards picker
  boardsList: string[];
  boardsCursor: number;

  // lanes editor
  lanesCursor: number;

  // settings
  settingsCursor: number;

  // filter
  priorityFilter: Priority | 'all';

  // undo stack (for card deletions)
  undoStack: UndoEntry[];

  // derived helpers
  lanes: () => Lane[];
  settings: () => Settings;
  boardName: () => string;

  // actions
  setMode: (mode: Mode) => void;
  setActiveLane: (lane: number | ((prev: number) => number)) => void;
  setActiveCard: (card: number | ((prev: number) => number)) => void;
  setInputValue: (value: string) => void;
  setDetailsValue: (value: string) => void;
  setSearchValue: (value: string) => void;
  setSearchQuery: (query: string) => void;
  setBoardsList: (boards: string[]) => void;
  setBoardsCursor: (cursor: number | ((prev: number) => number)) => void;
  setLanesCursor: (cursor: number | ((prev: number) => number)) => void;
  setSettingsCursor: (cursor: number | ((prev: number) => number)) => void;

  updateBoard: (updater: (prev: BoardData) => BoardData) => void;
  persist: () => void;
  switchToBoard: (key: string) => void;

  // card actions
  addCard: (title: string) => void;
  deleteCard: () => void;
  undoDelete: () => void;
  moveCard: (direction: 'left' | 'right') => void;
  moveCardVertical: (direction: 'up' | 'down') => void;
  saveDetails: () => void;
  openDetail: () => void;
  addComment: (text: string, author?: string) => void;
  cyclePriority: () => void;
  renameCard: (title: string) => void;

  // lane actions
  addLane: (name: string) => void;
  renameLane: (name: string) => void;
  deleteLane: () => void;
  moveLane: (direction: 'up' | 'down') => void;

  // board actions
  renameBoard: (name: string) => void;
  createBoard: (key: string) => void;
  deleteBoardEntry: () => void;

  // settings actions
  toggleSetting: (key: keyof Settings) => void;

  // search
  findNext: (forward: boolean) => void;
}

function resolveSetter<T>(val: T | ((prev: T) => T), prev: T): T {
  return typeof val === 'function' ? (val as (prev: T) => T)(prev) : val;
}

export const useStore = create<AppState>((set, get) => {
  const meta = loadMeta();
  const initialKey = meta.lastBoard;
  const initialData = loadBoard(initialKey);

  return {
    boardKey: initialKey,
    boardData: initialData,
    activeLane: 0,
    activeCard: 0,
    mode: 'navigate',
    inputValue: '',
    detailsValue: '',
    searchValue: '',
    searchQuery: '',
    boardsList: [],
    boardsCursor: 0,
    lanesCursor: 0,
    settingsCursor: 0,
    priorityFilter: 'all',
    undoStack: [],

    // derived
    lanes: () => get().boardData.lanes,
    settings: () => get().boardData.settings,
    boardName: () => get().boardData.name,

    // basic setters
    setMode: (mode) => set({ mode }),
    setActiveLane: (val) => set((s) => ({ activeLane: resolveSetter(val, s.activeLane) })),
    setActiveCard: (val) => set((s) => ({ activeCard: resolveSetter(val, s.activeCard) })),
    setInputValue: (inputValue) => set({ inputValue }),
    setDetailsValue: (detailsValue) => set({ detailsValue }),
    setSearchValue: (searchValue) => set({ searchValue }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setBoardsList: (boardsList) => set({ boardsList }),
    setBoardsCursor: (val) => set((s) => ({ boardsCursor: resolveSetter(val, s.boardsCursor) })),
    setLanesCursor: (val) => set((s) => ({ lanesCursor: resolveSetter(val, s.lanesCursor) })),
    setSettingsCursor: (val) =>
      set((s) => ({ settingsCursor: resolveSetter(val, s.settingsCursor) })),

    updateBoard: (updater) => set((s) => ({ boardData: updater(s.boardData) })),

    persist: () => {
      const { boardKey, boardData } = get();
      saveBoard(boardKey, boardData);
      saveMeta({ lastBoard: boardKey });
    },

    switchToBoard: (key) => {
      const s = get();
      saveBoard(s.boardKey, s.boardData);
      const data = loadBoard(key);
      set({
        boardKey: key,
        boardData: data,
        activeLane: 0,
        activeCard: 0,
        searchQuery: '',
        mode: 'navigate',
      });
    },

    // card actions
    addCard: (title) => {
      const { activeLane, boardData } = get();
      const now = new Date().toISOString();
      const newCard = {
        id: boardData.nextId,
        title,
        details: '',
        comments: [],
        priority: 'none' as const,
        createdAt: now,
        updatedAt: now,
      };
      set({
        boardData: {
          ...boardData,
          nextId: boardData.nextId + 1,
          lanes: boardData.lanes.map((lane, i) =>
            i === activeLane ? { ...lane, cards: [...lane.cards, newCard] } : lane,
          ),
        },
        activeCard: boardData.lanes[activeLane]!.cards.length,
        mode: 'navigate',
        inputValue: '',
      });
    },

    deleteCard: () => {
      const { activeLane, activeCard, boardData, undoStack } = get();
      if (boardData.lanes[activeLane]!.cards.length === 0) return;
      const deletedCard = boardData.lanes[activeLane]!.cards[activeCard]!;
      set({
        boardData: {
          ...boardData,
          lanes: boardData.lanes.map((lane, i) =>
            i === activeLane
              ? { ...lane, cards: lane.cards.filter((_, ci) => ci !== activeCard) }
              : lane,
          ),
        },
        activeCard: Math.min(activeCard, boardData.lanes[activeLane]!.cards.length - 2),
        undoStack: [
          ...undoStack,
          { card: deletedCard, laneIndex: activeLane, cardIndex: activeCard },
        ],
      });
    },

    undoDelete: () => {
      const { undoStack, boardData } = get();
      if (undoStack.length === 0) return;
      const entry = undoStack[undoStack.length - 1]!;
      const laneIdx = Math.min(entry.laneIndex, boardData.lanes.length - 1);
      const cardIdx = Math.min(entry.cardIndex, boardData.lanes[laneIdx]!.cards.length);
      set({
        boardData: {
          ...boardData,
          lanes: boardData.lanes.map((lane, i) =>
            i === laneIdx
              ? {
                  ...lane,
                  cards: [
                    ...lane.cards.slice(0, cardIdx),
                    entry.card,
                    ...lane.cards.slice(cardIdx),
                  ],
                }
              : lane,
          ),
        },
        activeLane: laneIdx,
        activeCard: cardIdx,
        undoStack: undoStack.slice(0, -1),
      });
    },

    moveCard: (direction) => {
      const { activeLane, activeCard, boardData } = get();
      const lanes = boardData.lanes;
      const targetLane = direction === 'left' ? activeLane - 1 : activeLane + 1;
      if (targetLane < 0 || targetLane >= lanes.length) return;
      if (lanes[activeLane]!.cards.length === 0) return;
      const card = lanes[activeLane]!.cards[activeCard]!;
      set({
        boardData: {
          ...boardData,
          lanes: lanes.map((lane, i) => {
            if (i === activeLane)
              return { ...lane, cards: lane.cards.filter((_, ci) => ci !== activeCard) };
            if (i === targetLane) return { ...lane, cards: [...lane.cards, card] };
            return lane;
          }),
        },
        activeLane: targetLane,
        activeCard: lanes[targetLane]!.cards.length,
      });
    },

    moveCardVertical: (direction) => {
      const { activeLane, activeCard, boardData } = get();
      const cards = boardData.lanes[activeLane]!.cards;
      if (cards.length <= 1) return;
      const targetIndex = direction === 'up' ? activeCard - 1 : activeCard + 1;
      if (targetIndex < 0 || targetIndex >= cards.length) return;
      const newCards = [...cards];
      [newCards[activeCard], newCards[targetIndex]] = [
        newCards[targetIndex]!,
        newCards[activeCard]!,
      ];
      set({
        boardData: {
          ...boardData,
          lanes: boardData.lanes.map((lane, i) =>
            i === activeLane ? { ...lane, cards: newCards } : lane,
          ),
        },
        activeCard: targetIndex,
      });
    },

    saveDetails: () => {
      const { activeLane, activeCard, detailsValue } = get();
      get().updateBoard((prev) => ({
        ...prev,
        lanes: prev.lanes.map((lane, li) =>
          li === activeLane
            ? {
                ...lane,
                cards: lane.cards.map((card, ci) =>
                  ci === activeCard
                    ? { ...card, details: detailsValue, updatedAt: new Date().toISOString() }
                    : card,
                ),
              }
            : lane,
        ),
      }));
      set({ mode: 'navigate' });
    },

    renameCard: (title) => {
      const { activeLane, activeCard } = get();
      get().updateBoard((prev) => ({
        ...prev,
        lanes: prev.lanes.map((lane, li) =>
          li === activeLane
            ? {
                ...lane,
                cards: lane.cards.map((card, ci) =>
                  ci === activeCard
                    ? { ...card, title, updatedAt: new Date().toISOString() }
                    : card,
                ),
              }
            : lane,
        ),
      }));
      set({ mode: 'navigate', inputValue: '' });
    },

    cyclePriority: () => {
      const { activeLane, activeCard } = get();
      const cycle: Record<string, string> = {
        none: 'high',
        high: 'medium',
        medium: 'low',
        low: 'none',
      };
      get().updateBoard((prev) => ({
        ...prev,
        lanes: prev.lanes.map((lane, li) =>
          li === activeLane
            ? {
                ...lane,
                cards: lane.cards.map((card, ci) =>
                  ci === activeCard
                    ? { ...card, priority: (cycle[card.priority ?? 'none'] ?? 'none') as Priority }
                    : card,
                ),
              }
            : lane,
        ),
      }));
    },

    addComment: (text, author) => {
      const { activeLane, activeCard } = get();
      const comment = {
        text,
        timestamp: new Date().toISOString(),
        ...(author ? { author } : {}),
      };
      get().updateBoard((prev) => ({
        ...prev,
        lanes: prev.lanes.map((lane, li) =>
          li === activeLane
            ? {
                ...lane,
                cards: lane.cards.map((card, ci) =>
                  ci === activeCard
                    ? { ...card, comments: [...(card.comments ?? []), comment] }
                    : card,
                ),
              }
            : lane,
        ),
      }));
    },

    openDetail: () => {
      const { activeLane, activeCard, boardData } = get();
      const card = boardData.lanes[activeLane]?.cards[activeCard];
      if (card) {
        set({ detailsValue: card.details, mode: 'detail' });
      }
    },

    // lane actions
    addLane: (name) => {
      const { boardData } = get();
      set({
        boardData: {
          ...boardData,
          lanes: [...boardData.lanes, { name, cards: [] }],
        },
        lanesCursor: boardData.lanes.length,
        mode: 'lanes',
        inputValue: '',
      });
    },

    renameLane: (name) => {
      const { lanesCursor } = get();
      get().updateBoard((prev) => ({
        ...prev,
        lanes: prev.lanes.map((lane, i) => (i === lanesCursor ? { ...lane, name } : lane)),
      }));
      set({ mode: 'lanes', inputValue: '' });
    },

    deleteLane: () => {
      const { lanesCursor, boardData } = get();
      if (boardData.lanes.length <= 1) return;
      set({
        boardData: {
          ...boardData,
          lanes: boardData.lanes.filter((_, i) => i !== lanesCursor),
        },
        lanesCursor: Math.min(lanesCursor, boardData.lanes.length - 2),
        activeLane: Math.min(get().activeLane, boardData.lanes.length - 2),
        activeCard: 0,
      });
    },

    moveLane: (direction) => {
      const { lanesCursor, boardData } = get();
      const target = direction === 'up' ? lanesCursor - 1 : lanesCursor + 1;
      if (target < 0 || target >= boardData.lanes.length) return;
      const newLanes = [...boardData.lanes];
      [newLanes[lanesCursor], newLanes[target]] = [newLanes[target]!, newLanes[lanesCursor]!];
      set({
        boardData: { ...boardData, lanes: newLanes },
        lanesCursor: target,
      });
    },

    // board actions
    renameBoard: (name) => {
      get().updateBoard((prev) => ({ ...prev, name }));
      set({ mode: 'navigate', inputValue: '' });
    },

    createBoard: (key) => {
      if (key) {
        get().switchToBoard(key);
      } else {
        set({ mode: 'boards' });
      }
      set({ inputValue: '' });
    },

    deleteBoardEntry: () => {
      const { boardsList, boardsCursor, boardKey } = get();
      if (boardsList.length <= 1) return;
      const toDelete = boardsList[boardsCursor];
      if (!toDelete || toDelete === boardKey) return;
      deleteBoard(toDelete);
      const updated = boardsList.filter((b) => b !== toDelete);
      set({
        boardsList: updated,
        boardsCursor: Math.min(boardsCursor, updated.length - 1),
      });
    },

    toggleSetting: (key) => {
      get().updateBoard((prev) => ({
        ...prev,
        settings: { ...prev.settings, [key]: !prev.settings[key] },
      }));
    },

    // search
    findNext: (forward) => {
      const { searchQuery, activeLane, activeCard, boardData } = get();
      if (!searchQuery) return;
      const q = searchQuery.toLowerCase();
      const lanes = boardData.lanes;
      const all: { lane: number; card: number }[] = [];
      for (let li = 0; li < lanes.length; li++) {
        for (let ci = 0; ci < lanes[li]!.cards.length; ci++) {
          all.push({ lane: li, card: ci });
        }
      }
      if (all.length === 0) return;
      const curIdx = all.findIndex((e) => e.lane === activeLane && e.card === activeCard);
      const len = all.length;
      for (let i = 1; i <= len; i++) {
        const idx = forward ? (curIdx + i) % len : (curIdx - i + len) % len;
        const entry = all[idx]!;
        const card = lanes[entry.lane]!.cards[entry.card]!;
        if (card.title.toLowerCase().includes(q) || card.details.toLowerCase().includes(q)) {
          set({ activeLane: entry.lane, activeCard: entry.card });
          return;
        }
      }
    },
  };
});
