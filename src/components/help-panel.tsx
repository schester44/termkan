import React from 'react';
import { Box, Text } from 'ink';
import { useStore } from '../state/store.js';

function ShortcutEntry({ keys, label }: { keys: string; label: string }) {
  return (
    <Text>
      <Text bold color="yellow">
        {keys}
      </Text>
      {'  '}
      {label}
    </Text>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={0}>
        <Text bold color="white">
          {title}
        </Text>
      </Box>
      {children}
    </Box>
  );
}

export function HelpPanel() {
  const laneCount = useStore((s) => s.boardData.lanes.length);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginTop={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          Keyboard Shortcuts
        </Text>
      </Box>

      <Box gap={4}>
        {/* Column 1: Navigation */}
        <Section title="Navigation">
          <ShortcutEntry keys="h/l" label="Switch lane" />
          <ShortcutEntry keys="j/k" label="Select card" />
          <ShortcutEntry keys={`1-${laneCount}`} label="Jump to lane" />
          <ShortcutEntry keys="/" label="Search cards" />
          <ShortcutEntry keys="f" label="Filter by priority" />
          <ShortcutEntry keys="Enter" label="Open card details" />
        </Section>

        {/* Column 2: Cards */}
        <Section title="Cards">
          <ShortcutEntry keys="n" label="New card" />
          <ShortcutEntry keys="d" label="Delete card" />
          <ShortcutEntry keys="H/L" label="Move card left/right" />
          <ShortcutEntry keys="J/K" label="Move card up/down" />
          <ShortcutEntry keys="p" label="Cycle priority" />
          <ShortcutEntry keys="r/R" label="Rename card" />
        </Section>

        {/* Column 3: Views */}
        <Section title="Views">
          <ShortcutEntry keys="b" label="Boards" />
          <ShortcutEntry keys="e" label="Edit lanes" />
          <ShortcutEntry keys="s" label="Settings" />
          <ShortcutEntry keys="a" label="Archive" />
          <ShortcutEntry keys="$" label="Rename board" />
          <ShortcutEntry keys="?" label="Help" />
          <ShortcutEntry keys="q" label="Quit" />
        </Section>
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>
          Press{' '}
          <Text bold color="yellow">
            ?
          </Text>{' '}
          or{' '}
          <Text bold color="red">
            Esc
          </Text>{' '}
          to close
        </Text>
      </Box>
    </Box>
  );
}
