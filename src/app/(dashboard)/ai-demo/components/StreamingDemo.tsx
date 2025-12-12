"use client";

import { useState, useRef } from "react";

/**
 * ============================================================
 * STREAMING RESPONSE DEMO
 * ============================================================
 * 
 * Demonstrates:
 * - Server-Sent Events (SSE) streaming
 * - Real-time token rendering
 * - Stream parsing and handling
 * 
 * NOTE: Todo context is fetched from DB in the API route,
 * not passed from the client (scalable approach).
 */

export default function StreamingDemo() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch("/api/ai/streaming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }), 
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Stream failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setResponse((prev) => prev + data.content);
              }
              if (data.error) {
                setError(data.error);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Streaming Response</h3>
          <p className="text-xs text-slate-400">Real-time token streaming (SSE)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something... Watch the response stream in!"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          rows={3}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition"
          >
            {loading ? "Streaming..." : "Start Stream"}
          </button>

          {loading && (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
            >
              Stop
            </button>
          )}
        </div>
      </form>

      {(response || error) && (
        <div className="mt-4">
          {error ? (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          ) : (
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {response}
                {loading && <span className="animate-pulse">▊</span>}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-green-400/70">
        ✓ Context fetched from database server-side
      </p>
    </div>
  );
}
