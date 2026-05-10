import { create } from "zustand";
import { ChatMessage, ProcedurePlan, CaseData } from "./api";

/** Global application state for the NyayaMitra chat interface. */
interface AppState {
  caseId: string | null;
  messages: ChatMessage[];
  plan: ProcedurePlan | null;
  caseData: CaseData | null;
  isLoading: boolean;
  language: string;
  selectedProcedure: string | null;

  setCaseId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setPlan: (plan: ProcedurePlan) => void;
  setCaseData: (data: CaseData) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: string) => void;
  setSelectedProcedure: (id: string | null) => void;
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

  setCaseId: (id) => set({ caseId: id }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setPlan: (plan) => set({ plan }),
  setCaseData: (data) => set({ caseData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLanguage: (lang) => set({ language: lang }),
  setSelectedProcedure: (id) => set({ selectedProcedure: id }),
  reset: () =>
    set({
      caseId: null,
      messages: [],
      plan: null,
      caseData: null,
      isLoading: false,
      selectedProcedure: null,
    }),
}));
