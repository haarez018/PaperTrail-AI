/** Onboarding tutorial state management. */

const STORAGE_KEY = "papertrail-tutorial-completed";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector for the element to spotlight. Null = center of screen. */
  target: string | null;
  position: "top" | "bottom" | "left" | "right" | "center";
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "input",
    title: "Tell us what happened",
    description:
      'Type your situation in Tamil, Hindi, or English. For example: "My father passed away. He had a pension and property."',
    target: null,
    position: "center",
  },
  {
    id: "voice",
    title: "Or just speak",
    description:
      "Tap the mic button to speak instead of typing. PaperTrail AI understands Tamil, Hindi, and Indian English.",
    target: null,
    position: "center",
  },
  {
    id: "plan",
    title: "We build your complete plan",
    description:
      "In 90 seconds, PaperTrail AI identifies every procedure you need — automatically sorted by dependency order.",
    target: null,
    position: "center",
  },
  {
    id: "forms",
    title: "Forms auto-filled for you",
    description:
      "Every government form is pre-filled with your details, ready to print and submit. No more guessing what to write.",
    target: null,
    position: "center",
  },
  {
    id: "escalation",
    title: "If anything stalls — we fight back",
    description:
      "If any office delays beyond the legal limit, PaperTrail AI drafts a pre-filled RTI application citing the exact law section.",
    target: null,
    position: "center",
  },
];

export function isTutorialCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function markTutorialCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "true");
}

export function resetTutorial(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
