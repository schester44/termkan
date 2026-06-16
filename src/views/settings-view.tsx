import React from "react";
import { Box, Text } from "ink";
import { useStore } from "../state/store.js";
import type { Settings } from "../state/persistence.js";

const SETTINGS_ITEMS: { key: keyof Settings; label: string }[] = [
	{ key: "vimMode", label: "Vim keybindings in editor" },
];

export function SettingsView() {
	const { settingsCursor, settings } = useStore();
	const currentSettings = settings();

	return (
		<Box flexDirection="column" padding={1}>
			<Box justifyContent="center" marginBottom={1}>
				<Text bold color="cyan">
					⚙️  Settings
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				{SETTINGS_ITEMS.map((item, i) => {
					const isSelected = i === settingsCursor;
					const isOn = currentSettings[item.key];
					return (
						<Box key={item.key} marginBottom={0}>
							<Text bold={isSelected} color={isSelected ? "yellow" : "white"}>
								{isSelected ? "▸ " : "  "}
								<Text color={isOn ? "green" : "red"}>{isOn ? "[✓]" : "[ ]"}</Text>
								{" "}{item.label}
							</Text>
						</Box>
					);
				})}
			</Box>

			<Box marginTop={1} justifyContent="center">
				<Text dimColor>
					<Text bold color="yellow">j/k</Text> navigate{"  "}
					<Text bold color="yellow">Enter/Space</Text> toggle{"  "}
					<Text bold color="yellow">Esc</Text> back
				</Text>
			</Box>
		</Box>
	);
}

export { SETTINGS_ITEMS };
