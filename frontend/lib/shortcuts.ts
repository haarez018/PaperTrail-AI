/**
 * Global keyboard shortcut registry for PaperTrail AI.
 * Register handlers once (in a top-level component via useEffect),
 * then clean up on unmount.
 */

export interface Shortcut {
  key: string;                   // e.g. "k", "/", "d"
  ctrl?: boolean;                // Ctrl or Cmd
  shift?: boolean;
  description: string;
  action: () => void;
}

export const SHORTCUT_DEFS: Omit<Shortcut, "action">[] = [
  { key: "k", ctrl: true, description: "Focus chat input" },
  { key: "/", ctrl: true, description: "Show keyboard shortcuts" },
  { key: "d", ctrl: true, description: "Toggle dark mode" },
  { key: "e", ctrl: true, description: "Cycle language (en → ta → hi)" },
  { key: "Escape", description: "Close any modal or panel" },
];

export function matchesShortcut(
  e: KeyboardEvent,
  def: Omit<Shortcut, "action">
): boolean {
  const ctrlOrCmd = e.ctrlKey || e.metaKey;
  if (def.ctrl && !ctrlOrCmd) return false;
  if (!def.ctrl && ctrlOrCmd && def.key !== "Escape") return false;
  if (def.shift && !e.shiftKey) return false;
  return e.key === def.key || e.key === def.key.toLowerCase();
}
