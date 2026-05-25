/**
 * Command registry for the PaperTrail AI command palette.
 * Commands are statically defined; dynamic commands (procedures, cases)
 * are injected at runtime by the CommandPalette component.
 */

export type CommandCategory = "navigate" | "action" | "procedure" | "case";

export interface Command {
  id: string;
  label: string;
  description?: string;
  category: CommandCategory;
  icon: string; // Lucide icon name string
  keywords?: string[]; // extra search terms
  /** Called when the command is executed. */
  action: () => void;
}

export interface StaticCommandDef {
  id: string;
  label: string;
  description?: string;
  category: CommandCategory;
  icon: string;
  keywords?: string[];
  /** Href — commands with href navigate; commands without need a custom action injected. */
  href?: string;
  shortcut?: string;
}

export const STATIC_COMMANDS: StaticCommandDef[] = [
  /* ── Navigate ── */
  {
    id: "nav-chat",
    label: "Go to Chat",
    description: "Open the main conversation",
    category: "navigate",
    icon: "MessageSquare",
    href: "/chat",
    keywords: ["home", "conversation", "message"],
  },
  {
    id: "nav-cases",
    label: "My Cases",
    description: "View all saved cases",
    category: "navigate",
    icon: "FolderOpen",
    href: "/cases",
    keywords: ["history", "saved", "list"],
  },
  {
    id: "nav-procedures",
    label: "Procedure Explorer",
    description: "Browse all government procedures",
    category: "navigate",
    icon: "BookOpen",
    href: "/procedures",
    keywords: ["browse", "search procedures", "explorer"],
  },
  {
    id: "nav-stats",
    label: "Stats Dashboard",
    description: "Usage metrics and insights",
    category: "navigate",
    icon: "BarChart2",
    href: "/stats",
    keywords: ["metrics", "analytics", "dashboard"],
  },
  {
    id: "nav-design",
    label: "Design System",
    description: "Component library reference",
    category: "navigate",
    icon: "Palette",
    href: "/design-system",
    keywords: ["components", "tokens", "ui"],
  },

  /* ── Actions ── */
  {
    id: "action-new-case",
    label: "New Case",
    description: "Start a fresh conversation",
    category: "action",
    icon: "Plus",
    keywords: ["new", "start", "fresh", "reset"],
  },
  {
    id: "action-theme",
    label: "Toggle Dark Mode",
    description: "Cycle between light / dark / system",
    category: "action",
    icon: "Moon",
    shortcut: "Ctrl D",
    keywords: ["dark", "light", "theme", "mode"],
  },
  {
    id: "action-lang-ta",
    label: "Switch to Tamil",
    description: "Set interface language to Tamil",
    category: "action",
    icon: "Languages",
    keywords: ["tamil", "ta", "language", "தமிழ்"],
  },
  {
    id: "action-lang-hi",
    label: "Switch to Hindi",
    description: "Set interface language to Hindi",
    category: "action",
    icon: "Languages",
    keywords: ["hindi", "hi", "language", "हिंदी"],
  },
  {
    id: "action-lang-en",
    label: "Switch to English",
    description: "Set interface language to English",
    category: "action",
    icon: "Languages",
    keywords: ["english", "en", "language"],
  },
  {
    id: "action-shortcuts",
    label: "Keyboard Shortcuts",
    description: "View all keyboard shortcuts",
    category: "action",
    icon: "Keyboard",
    shortcut: "Ctrl /",
    keywords: ["shortcuts", "hotkeys", "keyboard"],
  },
  {
    id: "action-export-kit",
    label: "Download Document Kit",
    description: "Export all forms as a PDF bundle",
    category: "action",
    icon: "Download",
    keywords: ["export", "pdf", "download", "kit", "forms"],
  },
  {
    id: "action-share",
    label: "Share Plan",
    description: "Share your procedure plan via WhatsApp",
    category: "action",
    icon: "Share2",
    keywords: ["share", "whatsapp", "send"],
  },
];

/** Fuzzy-ish match: query words must all appear in label+description+keywords. */
export function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;
  const terms = query.toLowerCase().trim().split(/\s+/);
  return commands.filter((cmd) => {
    const haystack = [
      cmd.label,
      cmd.description ?? "",
      ...(cmd.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigate: "Navigate",
  action: "Actions",
  procedure: "Procedures",
  case: "Cases",
};
