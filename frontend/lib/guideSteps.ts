/** Step Guide — step definitions and trigger logic. */

export interface GuideStep {
  id: number;
  /** Returns true when this step should become active. */
  shouldShow(ctx: GuideContext): boolean;
}

export interface GuideContext {
  messageCount: number;
  isLoading: boolean;
  hasPlan: boolean;
  selectedProcedure: string | null;
  /** seconds the user has spent on a procedure detail without downloading */
  secondsOnDetail: number;
  /** number of distinct procedures the user has viewed */
  viewedProcedureCount: number;
  totalProcedures: number;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    // First visit — zero messages, not loading
    shouldShow: (ctx) => ctx.messageCount === 0 && !ctx.isLoading,
  },
  {
    id: 2,
    // First message sent, agents responding
    shouldShow: (ctx) => ctx.messageCount >= 1 && ctx.isLoading && !ctx.hasPlan,
  },
  {
    id: 3,
    // Plan just appeared
    shouldShow: (ctx) => ctx.hasPlan && ctx.selectedProcedure === null && !ctx.isLoading,
  },
  {
    id: 4,
    // User clicked a procedure card
    shouldShow: (ctx) => ctx.hasPlan && ctx.selectedProcedure !== null,
  },
  {
    id: 5,
    // 60 s on detail without downloading
    shouldShow: (ctx) =>
      ctx.hasPlan &&
      ctx.selectedProcedure !== null &&
      ctx.secondsOnDetail >= 60,
  },
  {
    id: 6,
    // All procedures viewed (at least 2 total)
    shouldShow: (ctx) =>
      ctx.hasPlan &&
      ctx.totalProcedures >= 2 &&
      ctx.viewedProcedureCount >= ctx.totalProcedures,
  },
];

/** Key used in localStorage to persist the dismissed state. */
export const GUIDE_DISMISSED_KEY = "papertrail-guide-dismissed";

/** Auto-hide after this many messages. */
export const GUIDE_AUTO_HIDE_AFTER = 10;
