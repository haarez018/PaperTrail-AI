"use client";

import { useRef, useState } from "react";
import ChatInterface from "@/components/ChatInterface";
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
    setSelectedProcedure,
  } = useAppStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    } catch (err) {
      addMessage({
        role: "agent",
        content: "Sorry, there was an error connecting to the server. Please make sure the backend is running.",
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Panel */}
      <div className={`flex flex-col ${plan ? "w-1/2" : "w-full"} max-w-3xl mx-auto transition-all duration-500`}>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Nyaya<span className="text-nyaya-600">Mitra</span>
            </h1>
            <p className="text-sm text-gray-500">Your Bureaucracy Navigator</p>
          </div>
          <div className="flex gap-2">
            {["en", "ta", "hi"].map((lang) => (
              <button
                key={lang}
                onClick={() => useAppStore.getState().setLanguage(lang)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === lang
                    ? "bg-nyaya-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lang === "en" ? "EN" : lang === "ta" ? "தமிழ்" : "हिंदी"}
              </button>
            ))}
          </div>
        </header>

        {/* Messages */}
        <ChatInterface messages={messages} isLoading={isLoading} />

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                messages.length === 0
                  ? "Tell me what happened... (e.g., 'My grandfather passed away in Chennai')"
                  : "Type your response..."
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nyaya-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-nyaya-600 text-white rounded-lg font-medium hover:bg-nyaya-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Panel — appears when plan is ready */}
      {plan && (
        <div className="w-1/2 border-l bg-white overflow-y-auto">
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
