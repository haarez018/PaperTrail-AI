"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import ReviewModal from "@/components/ReviewModal";
import {
  ChatBubble,
  TypingIndicator,
  WelcomeScreen,
  ChatHeader,
  ChatInput,
} from "@/components/chat";
import ProcedureTimeline from "@/components/ProcedureTimeline";
import ProcedureDetail from "@/components/ProcedureDetail";
import { AgentTrace } from "@/components/AgentTrace";
import { Onboarding } from "@/components/Onboarding";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import dynamic from "next/dynamic";
const CommandPalette = dynamic(
  () => import("@/components/CommandPalette").then((m) => ({ default: m.CommandPalette })),
  { ssr: false },
);
import { SmartSuggestions } from "@/components/SmartSuggestions";
import { StepGuide } from "@/components/StepGuide";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { getSuggestions, Suggestion } from "@/lib/suggestions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/lib/store";
import { sendMessage, SSEEvent, ProcedurePlan, CaseData } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { playSend, playPlanReady, playAgentResponse } from "@/lib/sounds";

/** Main chat interface — message stream with optional procedure timeline side panel. */
export default function ChatPage() {
  const {
    caseId,
    messages,
    plan,
    traces,
    isLoading,
    language,
    selectedProcedure,
    setCaseId,
    addMessage,
    setPlan,
    setCaseData,
    setLoading,
    setLanguage,
    setSelectedProcedure,
    addTrace,
    clearTraces,
  } = useAppStore();

  const [input, setInput] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const reviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastAgent, setLastAgent] = useState<string | undefined>();
  const [viewedProcedures, setViewedProcedures] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendStartRef = useRef<number>(0);

  const LANGUAGES = ["en", "ta", "hi"];

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (ctrl && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
      if (ctrl && e.key === "d") {
        e.preventDefault();
        const stored =
          localStorage.getItem("papertrail-theme") ?? "system";
        const next =
          stored === "light" ? "dark" : stored === "dark" ? "system" : "light";
        localStorage.setItem("papertrail-theme", next);
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        if (next === "dark") root.classList.add("dark");
        else if (next === "light") root.classList.add("light");
      }
      if (ctrl && e.key === "e") {
        e.preventDefault();
        const current = LANGUAGES.indexOf(language);
        const next = LANGUAGES[(current + 1) % LANGUAGES.length];
        setLanguage(next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    clearTraces();
    addMessage({ role: "user", content: userMsg, timestamp: Date.now() });
    setLoading(true);
    sendStartRef.current = Date.now();
    playSend();

    try {
      // Pass last 5 exchanges (10 messages) as conversation memory
      const recentHistory = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      await sendMessage(userMsg, caseId, language, (event: SSEEvent) => {
        const agentKey = (event.data.agent as string) || "done";

        if (event.event === "agent_response") {
          const content = event.data.content as string;
          const agentName = agentKey;
          setLastAgent(agentName);

          // Build a trace step from the agent's response
          const details: string[] = [];
          if (agentName === "intake") {
            // Extract hints from content
            details.push(`Detected language: ${language === "ta" ? "Tamil" : language === "hi" ? "Hindi" : "English"}`);
            if (content.toLowerCase().includes("death") || content.toLowerCase().includes("passed")) {
              details.push("Identified life event: Death");
            }
          } else if (agentName === "planner") {
            details.push("Queried procedure knowledge graph");
          } else if (agentName === "document") {
            details.push("Loaded PDF form templates");
            details.push("Auto-filled fields from case data");
          } else if (agentName === "navigation") {
            details.push("Looked up office locations by pincode");
            details.push("Calculated optimal visit schedule");
          } else if (agentName === "escalation") {
            details.push("Identified applicable RTI / RTS provisions");
            details.push("Generated pre-filled escalation letter");
          }

          addTrace({
            id: `${agentName}-${Date.now()}`,
            agent: agentName,
            action: content.slice(0, 120) + (content.length > 120 ? "…" : ""),
            details,
            timestamp: Date.now(),
            durationMs: Date.now() - sendStartRef.current,
          });

          addMessage({
            role: "agent",
            content,
            agent: agentName,
            timestamp: Date.now(),
          });
          playAgentResponse();
        } else if (event.event === "plan_ready") {
          const p = event.data.plan as ProcedurePlan;
          setPlan(p);
          playPlanReady();

          // Schedule review modal 60 s after plan loads (once per case)
          if (reviewTimerRef.current) clearTimeout(reviewTimerRef.current);
          reviewTimerRef.current = setTimeout(() => {
            const currentCaseId = useAppStore.getState().caseId;
            const alreadyReviewed = currentCaseId
              ? localStorage.getItem(`review_submitted_${currentCaseId}`)
              : null;
            if (!alreadyReviewed) setShowReviewModal(true);
          }, 60_000);

          addTrace({
            id: `planner-plan-${Date.now()}`,
            agent: "planner",
            action: `Built procedure plan: ${p.procedures.length} procedures identified`,
            details: [
              `Topological sort by dependencies`,
              `Estimated total: ~${p.total_estimated_days} days`,
              `Total fees: ₹${p.total_estimated_cost_inr}`,
              `Without PaperTrail AI: ~${p.without_papertrail_baseline_days} days, ₹${p.without_papertrail_baseline_cost_inr}`,
              ...p.procedures.slice(0, 3).map(
                (proc) => `→ ${proc.procedure_id.replace(/^tn_/, "").replace(/_/g, " ")}`
              ),
              p.procedures.length > 3 ? `  …and ${p.procedures.length - 3} more` : "",
            ].filter(Boolean),
            timestamp: Date.now(),
            durationMs: Date.now() - sendStartRef.current,
          });
        } else if (event.event === "case_state_update") {
          setCaseData(event.data.case as CaseData);
        } else if (event.event === "done") {
          if (event.data.case_id) {
            setCaseId(event.data.case_id as string);
          }
          addTrace({
            id: `done-${Date.now()}`,
            agent: "done",
            action: "Processing complete",
            details: [
              `Case ID: ${event.data.case_id ?? "pending"}`,
              `Total time: ${formatDuration(Date.now() - sendStartRef.current)}`,
            ],
            timestamp: Date.now(),
            durationMs: Date.now() - sendStartRef.current,
          });
        }
      }, recentHistory);
    } catch {
      addMessage({
        role: "agent",
        content:
          "Hmm, I can't reach the server right now. Everything works offline though — I can still help with procedures and forms. Could you try again in a moment?",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    // Auto-send welcome-screen suggestions — same UX as suggestion chips
    sendDirectMessage(prompt);
  };

  /** Send a message directly without requiring the user to press Send.
   *  Used by suggestion chips for one-tap actions. */
  const sendDirectMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    clearTraces();
    addMessage({ role: "user", content: text, timestamp: Date.now() });
    setLoading(true);
    sendStartRef.current = Date.now();
    playSend();
    try {
      const recentHistory = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      await sendMessage(text, caseId, language, (event: SSEEvent) => {
        const agentKey = (event.data.agent as string) || "done";
        if (event.event === "agent_response") {
          const content = event.data.content as string;
          setLastAgent(agentKey);
          addMessage({ role: "agent", content, agent: agentKey, timestamp: Date.now() });
          playAgentResponse();
        } else if (event.event === "plan_ready") {
          setPlan(event.data.plan as ProcedurePlan);
          playPlanReady();
        } else if (event.event === "case_state_update") {
          setCaseData(event.data.case as CaseData);
        } else if (event.event === "done") {
          if (event.data.case_id) setCaseId(event.data.case_id as string);
        }
      }, recentHistory);
    } catch {
      addMessage({ role: "agent", content: "Couldn't reach the server. Please try again.", timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProcedure = (procedureId: string | null) => {
    setSelectedProcedure(procedureId);
    if (procedureId) {
      setViewedProcedures((prev) => { const s = new Set(prev); s.add(procedureId); return s; });
    }
  };

  const totalDuration =
    traces.length > 0
      ? traces[traces.length - 1].timestamp - traces[0].timestamp
      : undefined;

  return (
    <div className="flex h-screen flex-col bg-ivory sm:flex-row">
      <Onboarding />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        plan={plan}
        caseId={caseId}
        onNewCase={() => setPaletteOpen(false)}
        onSetLanguage={(lang) => { setLanguage(lang); }}
        onShowShortcuts={() => { setShortcutsOpen(true); }}
      />
      {/* ── Chat Panel ── */}
      <div
        className={`flex min-h-0 flex-1 flex-col transition-all duration-500 ease-smooth sm:flex-none ${
          plan
            ? "w-full sm:w-1/2"          // mobile: full width, desktop: half
            : "w-full sm:max-w-3xl sm:mx-auto"
        }`}
      >
        <ChatHeader
          language={language}
          onLanguageChange={setLanguage}
          caseId={caseId}
          messages={messages}
        />

        {/* Messages Area */}
        <ErrorBoundary section="Chat" variant="chat">
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-4 py-6 sm:px-6"
          role="log"
          aria-live="polite"
          aria-label="Conversation with PaperTrail AI"
        >
          {messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <ChatBubble
                    key={`${msg.timestamp}-${i}`}
                    role={msg.role}
                    content={msg.content}
                    agent={msg.agent}
                    timestamp={msg.timestamp}
                    index={i}
                    isLatest={i === messages.length - 1}
                  />
                ))}
              </AnimatePresence>

              {isLoading && <TypingIndicator />}

              {/* Agent Reasoning Trace */}
              {!isLoading && traces.length > 0 && (
                <AgentTrace traces={traces} totalDurationMs={totalDuration} />
              )}
            </div>
          )}
        </div>
        </ErrorBoundary>

        <SmartSuggestions
          suggestions={getSuggestions({
            lastAgent,
            hasPlan: !!plan,
            procedureCount: plan?.procedures.length,
            language,
          })}
          visible={!isLoading && messages.length > 0}
          onSelect={(s: Suggestion) => {
            if (s.type === "prompt" && s.prompt) {
              // Auto-send the suggestion — one tap = message sent
              sendDirectMessage(s.prompt);
            } else if (s.id === "sp-kit") {
              document.querySelector<HTMLButtonElement>("[data-export-kit]")?.click();
            } else if (s.id === "sp-graph") {
              document.querySelector<HTMLButtonElement>("[data-view-graph]")?.click();
            }
          }}
        />
        <StepGuide
          language={language}
          messageCount={messages.length}
          isLoading={isLoading}
          hasPlan={!!plan}
          selectedProcedure={selectedProcedure}
          totalProcedures={plan?.procedures.length ?? 0}
          viewedProcedures={viewedProcedures}
        />
        <DeadlineCountdown />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          isFirstMessage={messages.length === 0}
          language={language}
        />
      </div>

      {/* ── Review Modal ── */}
      {showReviewModal && caseId && (
        <ReviewModal
          caseId={caseId}
          language={language}
          onSubmit={async (data) => {
            const { userId } = useAppStore.getState();
            const res = await fetch(`${API_URL}/api/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data, user_id: userId, language }),
            });
            const json = await res.json();
            // Store review ID so the user can delete their own review later
            if (json.id) {
              const prev = JSON.parse(localStorage.getItem("my_review_ids") ?? "[]") as number[];
              localStorage.setItem("my_review_ids", JSON.stringify([...prev, json.id]));
            }
            localStorage.setItem(`review_submitted_${caseId}`, "true");
          }}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {/* ── Timeline Panel — appears when plan is ready ── */}
      {plan && (
        <div className="w-full overflow-y-auto border-t border-paper-dark bg-surface scrollbar-thin sm:w-1/2 sm:border-l sm:border-t-0 max-h-[45vh] sm:max-h-none">
          <ErrorBoundary section="Timeline">
            <ProcedureTimeline
              plan={plan}
              selectedProcedure={selectedProcedure}
              onSelect={handleSelectProcedure}
              caseId={caseId}
            />
          </ErrorBoundary>
          {selectedProcedure && (
            <ErrorBoundary section="Procedure Details">
              <ProcedureDetail
                procedureId={selectedProcedure}
                caseId={caseId}
                onClose={() => setSelectedProcedure(null)}
              />
            </ErrorBoundary>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
