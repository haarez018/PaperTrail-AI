"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStore } from "@/lib/store";
import { sendMessage, SSEEvent, ProcedurePlan, CaseData } from "@/lib/api";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendStartRef = useRef<number>(0);

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

    try {
      await sendMessage(userMsg, caseId, language, (event: SSEEvent) => {
        const agentKey = (event.data.agent as string) || "done";

        if (event.event === "agent_response") {
          const content = event.data.content as string;
          const agentName = agentKey;

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
        } else if (event.event === "plan_ready") {
          const p = event.data.plan as ProcedurePlan;
          setPlan(p);

          addTrace({
            id: `planner-plan-${Date.now()}`,
            agent: "planner",
            action: `Built procedure plan: ${p.procedures.length} procedures identified`,
            details: [
              `Topological sort by dependencies`,
              `Estimated total: ~${p.total_estimated_days} days`,
              `Total fees: ₹${p.total_estimated_cost_inr}`,
              `Without NyayaMitra: ~${p.without_nyayamitra_baseline_days} days, ₹${p.without_nyayamitra_baseline_cost_inr}`,
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
      });
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
    setInput(prompt);
  };

  const totalDuration =
    traces.length > 0
      ? traces[traces.length - 1].timestamp - traces[0].timestamp
      : undefined;

  return (
    <div className="flex h-screen bg-ivory">
      {/* ── Chat Panel ── */}
      <div
        className={`flex flex-col transition-all duration-500 ease-smooth ${
          plan ? "w-1/2" : "w-full max-w-3xl mx-auto"
        }`}
      >
        <ChatHeader
          language={language}
          onLanguageChange={setLanguage}
          caseId={caseId}
        />

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-4 py-6 sm:px-6"
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

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          isFirstMessage={messages.length === 0}
          language={language}
        />
      </div>

      {/* ── Timeline Panel — appears when plan is ready ── */}
      {plan && (
        <div className="w-1/2 overflow-y-auto border-l border-paper-dark bg-surface scrollbar-thin">
          <ErrorBoundary section="Timeline">
            <ProcedureTimeline
              plan={plan}
              selectedProcedure={selectedProcedure}
              onSelect={setSelectedProcedure}
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
