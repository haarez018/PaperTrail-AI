import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ChatMessage, ProcedurePlan, CaseData } from "./api";

const generateAnonymousId = (): string =>
  `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/** One step in the agent reasoning trace. */
export interface TraceStep {
  id: string;
  agent: string;
  action: string;
  details: string[];
  timestamp: number;
  durationMs?: number;
}

/** Deadline tracking entry for a submitted procedure. */
export interface DeadlineEntry {
  submittedAt: number;
  deadlineDays: number;
  receiptRef?: string;
}

/** Global application state for the PaperTrail AI chat interface. */
interface AppState {
  caseId: string | null;
  messages: ChatMessage[];
  plan: ProcedurePlan | null;
  caseData: CaseData | null;
  isLoading: boolean;
  language: string;
  selectedProcedure: string | null;
  traces: TraceStep[];
  deadlines: Record<string, DeadlineEntry>;
  userId: string;
  userIdGenerated: boolean;

  setCaseId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setPlan: (plan: ProcedurePlan) => void;
  setCaseData: (data: CaseData) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: string) => void;
  setSelectedProcedure: (id: string | null) => void;
  addTrace: (step: TraceStep) => void;
  clearTraces: () => void;
  markSubmitted: (procedureId: string, deadlineDays: number, receiptRef?: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      caseId: null,
      messages: [],
      plan: null,
      caseData: null,
      isLoading: false,
      language: "en",
      selectedProcedure: null,
      traces: [],
      deadlines: {},
      userId: generateAnonymousId(),
      userIdGenerated: true,

      setCaseId: (id) => set({ caseId: id }),
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      setPlan: (plan) => set({ plan }),
      setCaseData: (data) => set({ caseData: data }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLanguage: (lang) => set({ language: lang }),
      setSelectedProcedure: (id) => set({ selectedProcedure: id }),
      addTrace: (step) =>
        set((state) => ({ traces: [...state.traces, step] })),
      clearTraces: () => set({ traces: [] }),
      markSubmitted: (procedureId, deadlineDays, receiptRef) =>
        set((state) => ({
          deadlines: {
            ...state.deadlines,
            [procedureId]: {
              submittedAt: Date.now(),
              deadlineDays,
              receiptRef,
            },
          },
        })),
      reset: () =>
        set({
          caseId: null,
          messages: [],
          plan: null,
          caseData: null,
          isLoading: false,
          selectedProcedure: null,
          traces: [],
          deadlines: {},
        }),
    }),
    {
      name: "papertrail-session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({
        caseId: state.caseId,
        messages: state.messages.slice(-20),
        plan: state.plan,
        caseData: state.caseData,
        language: state.language,
        deadlines: state.deadlines,
        userId: state.userId,
        userIdGenerated: state.userIdGenerated,
      }),
    }
  )
);
