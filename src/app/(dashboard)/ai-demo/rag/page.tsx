import Link from "next/link";
import MastraRagDemo from "./components/MastraRagDemo";

/**
 * ============================================================
 * MASTRA RAG DEMO PAGE
 * ============================================================
 *
 * Demonstrates Mastra's RAG capabilities:
 * - MDocument for document processing & chunking
 * - @mastra/qdrant for vector storage
 * - Semantic search and retrieval
 * - Step-by-step pipeline visualization
 */

export default async function RagDemoPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            RAG with Mastra
          </h1>
          <p className="text-slate-400">
            Retrieval Augmented Generation using @mastra/rag
          </p>
        </div>
        <Link
          href="/ai-demo"
          className="text-slate-400 hover:text-white transition"
        >
          ← Back to AI Demos
        </Link>
      </div>

      {/* Architecture Overview */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Mastra RAG Architecture</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { icon: "📄", label: "PDF", sub: "Document" },
            { icon: "→", label: "", sub: "" },
            { icon: "📋", label: "MDocument", sub: "Chunking" },
            { icon: "→", label: "", sub: "" },
            { icon: "🗄️", label: "Qdrant", sub: "Vectors" },
            { icon: "🤖", label: "LLM", sub: "Generate" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`${
                item.label ? "bg-white/5 border border-white/10 rounded-lg p-3" : ""
              } text-center flex flex-col items-center justify-center`}
            >
              <div className="text-xl mb-1">{item.icon}</div>
              {item.label && (
                <>
                  <div className="text-xs font-medium text-white">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.sub}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Indexing Note */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚡</span>
          <div>
            <h4 className="font-medium text-amber-300">Pre-indexed at Startup</h4>
            <p className="text-sm text-amber-200/70 mt-1">
              The policy PDF is semantically chunked and indexed to Qdrant when the server starts.
              RAG queries only perform retrieval + generation - no re-indexing needed.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400">✓</span>
            <span className="font-medium text-purple-300">With RAG</span>
          </div>
          <p className="text-xs text-slate-400">
            Question → Embed → Qdrant similarity search → Top-K chunks retrieved →
            Context added to prompt → Grounded response
          </p>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400">✗</span>
            <span className="font-medium text-red-300">Without RAG</span>
          </div>
          <p className="text-xs text-slate-400">
            Question → Direct LLM query → No context → Response based only on
            training data (may hallucinate company policies)
          </p>
        </div>
      </div>

      {/* Demo */}
      <MastraRagDemo />

      {/* Technical Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Technical Stack</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Mastra Packages</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• <code className="text-purple-400">@mastra/rag</code> - MDocument, chunking</li>
              <li>• <code className="text-purple-400">@mastra/qdrant</code> - Vector storage</li>
              <li>• <code className="text-purple-400">@mastra/core</code> - Framework core</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Configuration</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Chunk size: 512 tokens</li>
              <li>• Overlap: 50 tokens</li>
              <li>• Strategy: Recursive</li>
              <li>• Top-K: 5 results</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Required Environment Variables</h4>
        <code className="text-xs text-slate-400 block">
          QDRANT_URL=https://your-cluster.qdrant.io<br/>
          QDRANT_API_KEY=your-api-key<br/>
          GROQ_API_KEY=your-groq-key
        </code>
      </div>
    </div>
  );
}
