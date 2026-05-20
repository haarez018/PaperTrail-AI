"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/api";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatInterface({ messages, isLoading }: ChatInterfaceProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-nyaya-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-nyaya-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">How can I help you today?</h2>
            <p className="mt-2 text-gray-500 max-w-md">
              Tell me about your situation and I&apos;ll identify every government procedure
              you need, generate the forms, and guide you step by step.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {[
              "My grandfather passed away in Chennai",
              "I need to change my name after marriage",
              "My widow pension was rejected twice",
              "I want to file an RTI about my ration card",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.value = prompt;
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype, 'value'
                    )?.set;
                    nativeInputValueSetter?.call(input, prompt);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="p-3 text-left text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-nyaya-50 hover:border-nyaya-200 transition-colors"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-nyaya-600 text-white"
                : "bg-white border border-gray-200 text-gray-900 shadow-sm"
            }`}
          >
            {msg.role === "agent" && msg.agent && (
              <div className="text-xs font-medium text-nyaya-600 mb-1 uppercase tracking-wide">
                {msg.agent === "done" ? "PaperTrail AI" : msg.agent}
              </div>
            )}
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
            />
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-nyaya-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-nyaya-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-nyaya-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
