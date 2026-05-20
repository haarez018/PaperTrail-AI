/**
 * Smart Suggestions engine.
 * Returns contextual next-action chips based on the current
 * conversation state (last agent, plan presence, case state).
 */

export interface Suggestion {
  id: string;
  label: string;
  /** Prompt to inject into the chat input, or a special action key. */
  prompt: string;
  /** Whether this is a chat prompt (auto-send) or a UI action (handled separately). */
  type: "prompt" | "action";
  /** Lucide icon name */
  icon: string;
}

export type SuggestionContext = {
  lastAgent?: string;
  lastContent?: string;
  hasPlan: boolean;
  procedureCount?: number;
  hasEscalation?: boolean;
  language: string;
};

/* ── Static suggestion banks ── */

const AFTER_INTAKE: Suggestion[] = [
  { id: "si-deps",  label: "What documents do I need?",  prompt: "What documents will I need to gather first?",              type: "prompt", icon: "FileText" },
  { id: "si-time",  label: "How long will this take?",   prompt: "How long will the whole process take?",                    type: "prompt", icon: "Clock" },
  { id: "si-cost",  label: "What are the fees?",         prompt: "What fees and charges should I expect to pay?",            type: "prompt", icon: "IndianRupee" },
  { id: "si-first", label: "Where do I start?",          prompt: "What is the very first step I should take right now?",     type: "prompt", icon: "ArrowRight" },
];

const AFTER_PLAN: Suggestion[] = [
  { id: "sp-step1",  label: "Walk me through Step 1 →",    prompt: "Walk me through step 1 in detail",                            type: "prompt", icon: "ArrowRight" },
  { id: "sp-docs",   label: "What documents do I need?",   prompt: "What are all the documents I need to gather right now?",      type: "prompt", icon: "FileText" },
  { id: "sp-office", label: "Which office first?",         prompt: "Which office should I visit first and what should I bring?",  type: "prompt", icon: "MapPin" },
  { id: "sp-kit",    label: "Download document kit",       prompt: "",                                                            type: "action", icon: "Download" },
  { id: "sp-rti",    label: "What if there's a delay?",    prompt: "What should I do if an office delays beyond the deadline?",   type: "prompt", icon: "AlertCircle" },
];

const AFTER_FOLLOWUP: Suggestion[] = [
  { id: "sf-next",   label: "What's the next step?",    prompt: "What's the next step after this?",                                    type: "prompt", icon: "ArrowRight" },
  { id: "sf-office", label: "Get office directions",    prompt: "Show me how to navigate to the office for this procedure",            type: "prompt", icon: "MapPin" },
  { id: "sf-docs",   label: "What to carry?",           prompt: "What exact documents and copies should I carry to the office?",       type: "prompt", icon: "Briefcase" },
  { id: "sf-delay",  label: "What if they delay?",      prompt: "What should I do if they delay or reject my application?",            type: "prompt", icon: "AlertCircle" },
  { id: "sf-done",   label: "I completed this step ✓",  prompt: "I completed this step, what should I do next?",                      type: "prompt", icon: "ClipboardList" },
];

const AFTER_DOCUMENT: Suggestion[] = [
  { id: "sd-print", label: "Ready to print?",       prompt: "Are all my forms ready to print and submit?",           type: "prompt", icon: "Printer" },
  { id: "sd-more",  label: "What else is needed?",  prompt: "Are there any other forms or documents I need to prepare?", type: "prompt", icon: "Plus" },
  { id: "sd-guide", label: "How do I submit this?", prompt: "How exactly do I submit this form? Where do I go?",      type: "prompt", icon: "Send" },
];

const AFTER_ESCALATION: Suggestion[] = [
  { id: "se-rti", label: "File RTI application",   prompt: "Help me file an RTI application for this delay",                                       type: "prompt", icon: "AlertCircle" },
  { id: "se-law", label: "What does the law say?", prompt: "What does the Right to Services Act say about this delay?",                           type: "prompt", icon: "Scale" },
  { id: "se-cm",  label: "CM Helpline number",     prompt: "What is the Chief Minister helpline for escalating this complaint?",                  type: "prompt", icon: "Phone" },
];

const AFTER_NAVIGATION: Suggestion[] = [
  { id: "sn-timing", label: "Best time to visit?", prompt: "What is the best time of day to visit this office?",                   type: "prompt", icon: "Clock" },
  { id: "sn-docs",   label: "What to carry?",      prompt: "What documents and copies should I carry to the office?",              type: "prompt", icon: "Briefcase" },
  { id: "sn-track",  label: "Track my status",     prompt: "How can I track the status of my application online?",                  type: "prompt", icon: "Search" },
];

const GENERAL: Suggestion[] = [
  { id: "sg-status",  label: "What's my next step?",  prompt: "What should I do next in my case?",                                  type: "prompt", icon: "ArrowRight" },
  { id: "sg-rights",  label: "Know my rights",         prompt: "What are my legal rights in this situation under Tamil Nadu law?",   type: "prompt", icon: "Scale" },
  { id: "sg-trans",   label: "Explain in Tamil",        prompt: "Can you explain this in Tamil?",                                     type: "prompt", icon: "Languages" },
  { id: "sg-summary", label: "Summarise my case",       prompt: "Can you give me a summary of where my case stands right now?",       type: "prompt", icon: "FileText" },
];

/* ── Tamil / Hindi variants ── */
const TAMIL_OVERRIDES: Partial<Record<string, string>> = {
  "sg-trans":  "Explain in English",
  "si-deps":   "என்ன ஆவணங்கள் தேவை?",
  "si-first":  "முதலில் என்ன செய்வது?",
  "sp-step1":  "படி 1 விளக்கவும் →",
  "sf-done":   "இந்த படி முடிந்தது ✓",
};

export function getSuggestions(ctx: SuggestionContext): Suggestion[] {
  let pool: Suggestion[] = [];

  switch (ctx.lastAgent) {
    case "intake":
      pool = [...AFTER_INTAKE];
      break;
    case "planner":
    case "procedure":
    case "done":
      pool = ctx.hasPlan ? [...AFTER_PLAN] : [...AFTER_INTAKE];
      break;
    case "document":
      pool = [...AFTER_DOCUMENT];
      break;
    case "escalation":
      pool = [...AFTER_ESCALATION];
      break;
    case "navigation":
      // navigation agent now handles post-plan follow-up responses
      pool = ctx.hasPlan ? [...AFTER_FOLLOWUP] : [...AFTER_NAVIGATION];
      break;
    default:
      pool = ctx.hasPlan ? [...AFTER_PLAN] : [...GENERAL];
  }

  // Always pad with a few general ones if pool is short
  if (pool.length < 4) {
    const extras = GENERAL.filter((g) => !pool.find((p) => p.id === g.id));
    pool = [...pool, ...extras.slice(0, 4 - pool.length)];
  }

  // Language-aware label tweaks
  if (ctx.language === "ta") {
    pool = pool.map((s) => ({
      ...s,
      label: TAMIL_OVERRIDES[s.id] ?? s.label,
    }));
    // Swap "Explain in Tamil" → "Explain in English" if already in Tamil
    pool = pool.map((s) =>
      s.id === "sg-trans"
        ? { ...s, label: "Explain in English", prompt: "Can you explain this in English?" }
        : s
    );
  }

  return pool.slice(0, 5);
}
