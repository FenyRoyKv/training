"use client";

import { useState } from "react";

/**
 * ============================================================
 * AGNO AGENT DEMO - With Tool Discovery
 * ============================================================
 *
 * Demonstrates:
 * - Tool discovery at runtime
 * - Multi-step execution
 * - Dynamic tool registration pattern
 */

type AgentStep = {
  thought: string;
  tool: string | null;
  parameters?: Record<string, unknown>;
  toolResult?: unknown;
};

type AgentResponse = {
  steps?: AgentStep[];
  response?: string;
  iterations?: number;
  toolsDiscovered?: boolean;
  error?: string;
};

export default function AgnoDemo() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/agno-agent", {
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
    "Show me my todos",
    "Create a high priority todo: Fix bug",
    "Create 2 todos: Review code, Write tests",
    "Summarize my tasks",
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Agno Agent</h3>
          <p className="text-xs text-slate-400">
            Tool discovery + multi-step execution
          </p>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mb-4 flex flex-wrap gap-2">
        {exampleCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => setMessage(cmd)}
            className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded hover:bg-purple-600/30 transition"
          >
            {cmd}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the agent what to do..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition"
        >
          {loading ? "Agent working..." : "Run Agent"}
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
              {/* Stats Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {response.toolsDiscovered && (
                  <span className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tools Discovered
                  </span>
                )}
                {response.iterations && (
                  <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded">
                    {response.iterations} iteration{response.iterations > 1 ? "s" : ""}
                  </span>
                )}
                <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded">
                  {response.steps?.length || 0} step{(response.steps?.length || 0) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Steps Timeline */}
              {response.steps && response.steps.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {response.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg text-sm ${
                        step.tool === "discover_tools"
                          ? "bg-green-600/10 border border-green-600/20"
                          : "bg-purple-600/10 border border-purple-600/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            step.tool === "discover_tools"
                              ? "bg-green-600/30 text-green-300"
                              : "bg-purple-600/30 text-purple-300"
                          }`}
                        >
                          {index + 1}
                        </span>
                        {step.tool && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              step.tool === "discover_tools"
                                ? "bg-green-600/20 text-green-300"
                                : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {step.tool === "discover_tools" ? "🔍 " : "🔧 "}
                            {step.tool}
                          </span>
                        )}
                      </div>
                      <p className="text-purple-200 text-xs">{step.thought}</p>
                      {step.toolResult !== undefined && (
                        <details className="mt-1">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                            {step.tool === "discover_tools"
                              ? "Discovered tools"
                              : "Tool result"}
                          </summary>
                          <pre className="text-xs text-slate-400 mt-1 overflow-x-auto max-h-32">
                            {JSON.stringify(step.toolResult, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Final Response */}
              {response.response && (
                <div className="p-3 bg-white/5 rounded-lg border-l-2 border-purple-500">
                  <p className="text-xs text-purple-400 mb-1">Final Response:</p>
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
        💡 Agent discovers tools at runtime via discover_tools
      </p>
    </div>
  );
}
