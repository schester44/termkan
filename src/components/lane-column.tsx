import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Card } from './card.js';
import { useStore } from '../state/store.js';
import type { Lane } from '../state/persistence.js';

interface LaneColumnProps {
  lane: Lane;
  laneIndex: number;
  laneWidth: number;
  isLast?: boolean;
  maxHeight?: number;
}

export function LaneColumn({
  lane,
  laneIndex,
  laneWidth,
  isLast = false,
  maxHeight = 24,
}: LaneColumnProps) {
  const {
    activeLane,
    activeCard,
    mode,
    inputValue,
    searchQuery,
    priorityFilter,
    setInputValue,
    addCard,
    renameCard,
  } = useStore();
  const isActive = laneIndex === activeLane;

  // Filter cards by priority if a filter is active
  const filteredCards =
    priorityFilter === 'all'
      ? lane.cards
      : lane.cards.filter((c) => (c.priority ?? 'none') === priorityFilter);
  const totalCards = filteredCards.length;

  // Height budget for the card content area
  // Lane box chrome: border (2) + header+margin (2) + indicators (2) = 6
  const addInputHeight = mode === 'add' && isActive ? 3 : 0;
  const contentHeight = maxHeight - 6 - addInputHeight;

  // Rough estimate: 5 lines per card (border top, up to 3 content lines, border bottom)
  // Used to decide how many cards to render — overflow="hidden" is the safety net
  const maxVisible = Math.max(1, Math.floor(contentHeight / 5));

  // Scroll offset — how many cards to skip from the top
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (!isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScrollOffset(0);
      return;
    }
    setScrollOffset((prev) => {
      if (activeCard < prev) return activeCard;
      if (activeCard >= prev + maxVisible) return activeCard - maxVisible + 1;
      return prev;
    });
  }, [activeCard, isActive, maxVisible]);

  // Slice to only render cards that should be visible
  const renderStart = isActive ? scrollOffset : 0;
  const renderEnd = renderStart + maxVisible;
  const visibleCards = filteredCards.slice(renderStart, renderEnd);

  // Map filtered card back to its original index in lane.cards
  const originalIndex = (card: (typeof lane.cards)[0]) => lane.cards.indexOf(card);

  const hiddenAbove = renderStart;
  const hiddenBelow = Math.max(0, totalCards - renderEnd);

  return (
    <Box
      flexDirection="column"
      width={laneWidth}
      height={maxHeight}
      borderStyle={isActive ? 'double' : 'single'}
      borderColor={isActive ? 'red' : 'gray'}
      marginRight={isLast ? 0 : 1}
      paddingX={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color={isActive ? 'red' : 'white'}>
          <Text dimColor>{laneIndex + 1}.</Text> {lane.name}
          {totalCards > 0 ? <Text dimColor> ({totalCards})</Text> : null}
        </Text>
      </Box>

      {hiddenAbove > 0 ? (
        <Box justifyContent="center">
          <Text dimColor>▲ {hiddenAbove} more</Text>
        </Box>
      ) : (
        <Box height={1} />
      )}

      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {visibleCards.map((card) => {
          const origIdx = originalIndex(card);
          return (
            <Card
              key={card.id}
              title={card.title}
              isSelected={isActive && origIdx === activeCard}
              hasDetails={card.details.length > 0}
              priority={card.priority}
              searchQuery={searchQuery}
            />
          );
        })}

        {filteredCards.length === 0 && (
          <Box justifyContent="center">
            <Text dimColor italic>
              empty
            </Text>
          </Box>
        )}
      </Box>

      {hiddenBelow > 0 ? (
        <Box justifyContent="center">
          <Text dimColor>▼ {hiddenBelow} more</Text>
        </Box>
      ) : (
        <Box height={1} />
      )}

      {mode === 'add' && isActive && (
        <Box marginTop={1} borderStyle="round" borderColor="green" paddingX={1}>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(val) => val.trim() && addCard(val.trim())}
            placeholder="Card title..."
            focus={true}
          />
        </Box>
      )}

      {mode === 'rename-card' && isActive && (
        <Box marginTop={1} borderStyle="round" borderColor="yellow" paddingX={1}>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(val) => val.trim() && renameCard(val.trim())}
            focus={true}
          />
        </Box>
      )}
    </Box>
  );
}
