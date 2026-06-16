import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

/**
 * Opens a temporary file with the given content in $EDITOR,
 * waits for the editor to close, and returns the updated content.
 * Returns null if no editor is configured or if the operation fails.
 */
export function openInEditor(content: string): string | null {
	const editor = process.env.EDITOR || process.env.VISUAL;
	if (!editor) return null;

	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "termkan-"));
	const tmpFile = path.join(tmpDir, "details.md");

	try {
		fs.writeFileSync(tmpFile, content);

		const result = spawnSync(editor, [tmpFile], {
			stdio: "inherit",
			env: process.env,
		});

		if (result.status !== 0) return null;

		return fs.readFileSync(tmpFile, "utf-8");
	} catch {
		return null;
	} finally {
		try {
			fs.unlinkSync(tmpFile);
			fs.rmdirSync(tmpDir);
		} catch {
			// cleanup best-effort
		}
	}
}
