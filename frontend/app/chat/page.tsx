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
import { useAppStore } from "@/lib/store";
import { sendMessage, SSEEvent } from "@/lib/api";

export default function ChatPage() {
  const {
    caseId,
    messages,
    plan,
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
  } = useAppStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
    addMessage({ role: "user", content: userMsg, timestamp: Date.now() });
    setLoading(true);

    try {
      await sendMessage(userMsg, caseId, language, (event: SSEEvent) => {
        if (event.event === "agent_response") {
          addMessage({
            role: "agent",
            content: event.data.content,
            agent: event.data.agent,
            timestamp: Date.now(),
          });
        } else if (event.event === "plan_ready") {
          setPlan(event.data.plan);
        } else if (event.event === "case_state_update") {
          setCaseData(event.data.case);
        } else if (event.event === "done") {
          if (event.data.case_id) {
            setCaseId(event.data.case_id);
          }
        }
      });
    } catch {
      addMessage({
        role: "agent",
        content:
          "Hmm, I can’t reach the server right now. Everything works offline though — I can still help with procedures and forms. Could you try again in a moment?",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
  };

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
            </div>
          )}
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
          isFirstMessage={messages.length === 0}
        />
      </div>

      {/* ── Timeline Panel — appears when plan is ready ── */}
      {plan && (
        <div className="w-1/2 overflow-y-auto border-l border-paper-dark bg-surface scrollbar-thin">
          <ProcedureTimeline
            plan={plan}
            selectedProcedure={selectedProcedure}
            onSelect={setSelectedProcedure}
          />
          {selectedProcedure && (
            <ProcedureDetail
              procedureId={selectedProcedure}
              caseId={caseId}
              onClose={() => setSelectedProcedure(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
