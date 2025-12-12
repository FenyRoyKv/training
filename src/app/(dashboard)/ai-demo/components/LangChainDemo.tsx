"use client";

import { useState } from "react";

/**
 * ============================================================
 * LANGCHAIN.JS DEMO
 * ============================================================
 *
 * Demonstrates LangChain.js - a popular TypeScript framework
 * for building LLM applications with:
 * - Built-in agent executors
 * - Tool calling abstractions
 * - Automatic reasoning loops
 */

type AgentStep = {
  tool: string;
  input: unknown;
  output: string;
};

type AgentResponse = {
  response?: string;
  steps?: AgentStep[];
  iterations?: number;
  error?: string;
};

export default function LangChainDemo() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/langchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data);
    } catch {
      setResponse({ error: "Failed to connect to agent" });
    } finally {
      setLoading(false);
    }
  };

  const exampleCommands = [
    "List my todos",
    "Create a todo: Review documentation",
    "Give me a summary of my tasks",
    "What high priority tasks do I have?",
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
          <span className="text-emerald-400 text-lg">🦜</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">LangChain.js</h3>
          <p className="text-xs text-slate-400">Real framework with AgentExecutor</p>
        </div>
      </div>

      {/* Framework badge */}
      <div className="mb-4 p-2 bg-emerald-600/10 border border-emerald-600/20 rounded-lg">
        <p className="text-xs text-emerald-300">
          ✓ Using <code className="bg-white/10 px-1 rounded">@langchain/core</code> +{" "}
          <code className="bg-white/10 px-1 rounded">@langchain/groq</code>
        </p>
      </div>

      {/* Quick Commands */}
      <div className="mb-4 flex flex-wrap gap-2">
        {exampleCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => setMessage(cmd)}
            className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-300 rounded hover:bg-emerald-600/30 transition"
          >
            {cmd}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask LangChain agent..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg transition"
        >
          {loading ? "Agent executing..." : "Run LangChain Agent"}
        </button>
      </form>

      {response && (
        <div className="mt-4 space-y-3">
          {response.error ? (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {response.error}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-emerald-600/30 text-emerald-300 px-2 py-1 rounded">
                  🦜 LangChain
                </span>
                {response.iterations !== undefined && (
                  <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded">
                    {response.iterations} tool call{response.iterations !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Steps */}
              {response.steps && response.steps.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {response.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-2 bg-emerald-600/10 border border-emerald-600/20 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 bg-emerald-600/30 rounded-full flex items-center justify-center text-xs text-emerald-300">
                          {index + 1}
                        </span>
                        <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded">
                          🔧 {step.tool}
                        </span>
                      </div>
                      <details className="mt-1">
                        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                          View details
                        </summary>
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-slate-400">
                            <strong>Input:</strong>
                          </p>
                          <pre className="text-xs text-slate-500 overflow-x-auto">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                          <p className="text-xs text-slate-400">
                            <strong>Output:</strong>
                          </p>
                          <pre className="text-xs text-slate-500 overflow-x-auto max-h-20">
                            {step.output}
                          </pre>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}

              {/* Final Response */}
              {response.response && (
                <div className="p-3 bg-white/5 rounded-lg border-l-2 border-emerald-500">
                  <p className="text-xs text-emerald-400 mb-1">Agent Response:</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {response.response}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        💡 Uses LangChain&apos;s AgentExecutor with createToolCallingAgent
      </p>
    </div>
  );
}

