"use client";

import { useState, useEffect } from "react";

/**
 * ============================================================
 * MASTRA RAG DEMO WITH STEP VISUALIZATION
 * ============================================================
 *
 * Demonstrates Mastra's RAG pipeline:
 * - MDocument for document processing
 * - @mastra/qdrant for vector storage
 * - Step-by-step visualization
 */

interface RagStep {
  step: number;
  name: string;
  description: string;
  data: unknown;
  timestamp: number;
}

interface RagResponse {
  answer?: string;
  steps?: RagStep[];
  totalChunks?: number;
  mode?: string;
  error?: string;
}

interface IndexStatus {
  indexed: boolean;
  chunksCount: number;
  framework: string;
  components: string[];
}

export default function MastraRagDemo() {
  const [question, setQuestion] = useState("");
  const [useRag, setUseRag] = useState(true);
  const [response, setResponse] = useState<RagResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);

  useEffect(() => {
    fetch("/api/ai/rag/mastra")
      .then((res) => res.json())
      .then(setIndexStatus)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponse(null);
    setExpandedSteps(new Set());

    try {
      const res = await fetch("/api/ai/rag/mastra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, useRag }),
      });

      const data = await res.json();
      setResponse(data);
    } catch {
      setResponse({ error: "Failed to connect" });
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNum: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) {
        next.delete(stepNum);
      } else {
        next.add(stepNum);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (response?.steps) {
      setExpandedSteps(new Set(response.steps.map((s) => s.step)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const exampleQuestions = [
    "How many casual leaves do I get?",
    "What is the WFH policy?",
    "Can I carry forward unused leaves?",
    "What is the notice period for leave?",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔮</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Mastra RAG Pipeline</h2>
              <p className="text-sm text-slate-400">
                MDocument + @mastra/qdrant + Vercel AI SDK
              </p>
            </div>
          </div>
          {indexStatus && (
            <div className="text-right">
              <div className="text-xs text-slate-400">Index Status</div>
              <div className={`text-sm font-medium ${indexStatus.indexed ? "text-green-400" : "text-yellow-400"}`}>
                {indexStatus.indexed ? `✓ ${indexStatus.chunksCount} chunks` : "Not indexed"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mastra Components */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">📄</div>
          <div className="text-sm font-medium text-white">MDocument</div>
          <div className="text-xs text-slate-400">Document Processing</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🗄️</div>
          <div className="text-sm font-medium text-white">@mastra/qdrant</div>
          <div className="text-xs text-slate-400">Vector Storage</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🤖</div>
          <div className="text-sm font-medium text-white">Vercel AI SDK</div>
          <div className="text-xs text-slate-400">LLM Generation</div>
        </div>
      </div>

      {/* RAG Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-white">Use Mastra RAG</span>
            <p className="text-xs text-slate-400 mt-1">
              {useRag
                ? "✓ Query → Embed → Qdrant Search → Context → LLM"
                : "✗ Query → LLM (no retrieval)"}
            </p>
          </div>
          <button
            onClick={() => setUseRag(!useRag)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              useRag ? "bg-purple-600" : "bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                useRag ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {exampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => setQuestion(q)}
            className="text-xs px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about leave or WFH policies..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-medium rounded-xl transition"
        >
          {loading ? "Processing RAG Pipeline..." : useRag ? "Query with Mastra RAG" : "Query without RAG"}
        </button>
      </form>

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {response.error ? (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
              {response.error}
            </div>
          ) : (
            <>
              {/* Mode Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    response.mode === "rag"
                      ? "bg-purple-600/30 text-purple-300"
                      : "bg-red-600/30 text-red-300"
                  }`}
                >
                  {response.mode === "rag" ? "✓ Mastra RAG" : "✗ No RAG"}
                </span>
                {response.totalChunks !== undefined && response.totalChunks > 0 && (
                  <span className="text-xs bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full">
                    📄 {response.totalChunks} chunks indexed
                  </span>
                )}
              </div>

              {/* Pipeline Steps */}
              {response.steps && response.steps.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <span>📊</span> RAG Pipeline Steps ({response.steps.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={expandAll}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Expand All
                      </button>
                      <button
                        onClick={collapseAll}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Collapse
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {response.steps.map((step) => (
                      <div
                        key={step.step}
                        className="bg-white/5 rounded-lg overflow-hidden border border-white/5"
                      >
                        <button
                          onClick={() => toggleStep(step.step)}
                          className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-purple-600/30 text-purple-300 rounded-full text-xs flex items-center justify-center font-medium">
                              {step.step}
                            </span>
                            <div>
                              <span className="text-sm font-medium text-white">{step.name}</span>
                              <span className="text-xs text-slate-500 ml-2">
                                +{step.timestamp}ms
                              </span>
                            </div>
                          </div>
                          <span className="text-slate-400 text-sm">
                            {expandedSteps.has(step.step) ? "▼" : "▶"}
                          </span>
                        </button>

                        {expandedSteps.has(step.step) && (
                          <div className="px-3 pb-3 border-t border-white/5 bg-black/20">
                            <p className="text-xs text-slate-400 py-2">{step.description}</p>
                            <pre className="text-xs text-slate-300 bg-black/40 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Answer */}
              <div
                className={`p-4 bg-white/5 rounded-xl border-l-4 ${
                  response.mode === "rag" ? "border-purple-500" : "border-red-500"
                }`}
              >
                <p className="text-xs text-slate-400 mb-2">Final Answer:</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {response.answer}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
