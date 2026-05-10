import { create } from "zustand";
import { ChatMessage, ProcedurePlan, CaseData } from "./api";

/** One step in the agent reasoning trace. */
export interface TraceStep {
  id: string;
  agent: string;
  action: string;
  details: string[];
  timestamp: number;
  durationMs?: number;
}

/** Global application state for the NyayaMitra chat interface. */
interface AppState {
  caseId: string | null;
  messages: ChatMessage[];
  plan: ProcedurePlan | null;
  caseData: CaseData | null;
  isLoading: boolean;
  language: string;
  selectedProcedure: string | null;
  traces: TraceStep[];

  setCaseId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setPlan: (plan: ProcedurePlan) => void;
  setCaseData: (data: CaseData) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: string) => void;
  setSelectedProcedure: (id: string | null) => void;
  addTrace: (step: TraceStep) => void;
  clearTraces: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  caseId: null,
  messages: [],
  plan: null,
  caseData: null,
  isLoading: false,
  language: "en",
  selectedProcedure: null,
  traces: [],

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
  reset: () =>
    set({
      caseId: null,
      messages: [],
      plan: null,
      caseData: null,
      isLoading: false,
      selectedProcedure: null,
      traces: [],
    }),
}));
