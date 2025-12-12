"use client";

import { useState } from "react";

/**
 * ============================================================
 * GROQ API DEMO COMPONENT
 * ============================================================
 * 
 * Demonstrates:
 * - Basic Groq API call
 * - Rate limiting feedback
 * - Token usage display
 * 
 * NOTE: Todo context is fetched from DB in the API route,
 * not passed from the client (scalable approach).
 */

type ApiResponse = {
  response?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
  };
  error?: string;
};

export default function GroqDemo() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/groq-basic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }), // No todoContext - fetched from DB!
      });

      const data = await res.json();
      setResponse(data);
    } catch {
      setResponse({ error: "Failed to connect to API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
          <span className="text-orange-400 font-bold">G</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Groq API</h3>
          <p className="text-xs text-slate-400">Basic non-streaming request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about your todos... (e.g., 'What should I prioritize?')"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          rows={3}
        />

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white rounded-lg transition"
        >
          {loading ? "Processing..." : "Send Request"}
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
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {response.response}
                </p>
              </div>

              {response.usage && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-white/10 rounded text-slate-400">
                    Model: {response.usage.model}
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded text-slate-400">
                    Tokens: {response.usage.totalTokens}
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 rounded text-green-400">
                    ✓ Context from DB
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
