"use client";

import { useState } from "react";
import { readStreamableValue } from "ai/rsc";
import { summarizeTodos, streamTodoAdvice } from "@/lib/actions/ai";

/**
 * ============================================================
 * VERCEL AI SDK - SERVER ACTIONS DEMO
 * ============================================================
 *
 * Demonstrates using Vercel AI SDK directly in Server Actions:
 * - No API routes needed
 * - Type-safe
 * - Supports streaming via createStreamableValue + readStreamableValue
 */

export default function ServerActionsDemo() {
  const [summary, setSummary] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  // Handle non-streaming summary
  const handleSummarize = async () => {
    setLoading(true);
    setSummary("");
    try {
      const result = await summarizeTodos();
      setSummary(result.summary);
    } catch (error) {
      setSummary(`Error: ${error instanceof Error ? error.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle streaming response
  const handleStream = async () => {
    if (!question.trim()) return;

    setStreaming(true);
    setStreamedText("");

    try {
      const { output } = await streamTodoAdvice(question);

      // Read the streamable value from the server action
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setStreamedText((prev) => prev + delta);
        }
      }
    } catch (error) {
      setStreamedText(
        `Error: ${error instanceof Error ? error.message : "Failed"}`
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Server Actions</h3>
          <p className="text-xs text-slate-400">
            Vercel AI SDK without API routes
          </p>
        </div>
      </div>

      {/* Non-streaming example */}
      <div className="mb-6">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg transition mb-3"
        >
          {loading ? "Summarizing..." : "Summarize My Todos"}
        </button>

        {summary && (
          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-cyan-400 mb-1">generateText result:</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}
      </div>

      {/* Streaming example */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-slate-400 mb-2">
          Streaming with Server Actions:
        </p>
        <div className="flex gap-2 mb-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your todos..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleStream}
            disabled={streaming || !question.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white text-sm rounded-lg transition"
          >
            {streaming ? "..." : "Ask"}
          </button>
        </div>

        {streamedText && (
          <div className="p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-cyan-400 mb-1">streamText result:</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {streamedText}
              {streaming && <span className="animate-pulse">▊</span>}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        💡 No API route needed - calls Server Actions directly
      </p>
    </div>
  );
}
