import Link from "next/link";
import { Suspense } from "react";
import { getTodos } from "@/lib/actions/todo";
import GroqDemo from "./components/GroqDemo";
import StreamingDemo from "./components/StreamingDemo";
import VercelSdkDemo from "./components/VercelSdkDemo";
import ServerActionsDemo from "./components/ServerActionsDemo";
import AgnoDemo from "./components/AgnoDemo";
import LangChainDemo from "./components/LangChainDemo";
import MastraChatbot from "./components/MastraChatbot";

/**
 * ============================================================
 * AI DEMO PAGE
 * ============================================================
 * 
 * This page showcases various LLM API implementations:
 * 1. Groq API - Basic usage with rate limiting
 * 2. Streaming - Real-time token streaming
 * 3. Vercel AI SDK - Provider-agnostic approach
 * 4. Agno Agent - Tool-calling agent pattern
 * 5. Mastra Chatbot - Full-featured AI assistant
 * 
 * NOTE: All API routes fetch todo context directly from the database
 * using the authenticated user's session. This is the scalable approach.
 */

export default async function AIDemoPage() {
  const todos = await getTodos();

  // Display current todos for reference (not passed to APIs anymore!)
  const todoDisplay = todos
    .map((t) => `- [${t.completed ? "✓" : " "}] ${t.title} (${t.priority})`)
    .join("\n");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">LLM APIs in Practice</h1>
          <p className="text-slate-400">
            Interactive demos of various AI/LLM implementations
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-white transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Architecture Note */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-green-300">Scalable Architecture</h3>
            <p className="text-sm text-green-200/70 mt-1">
              All API routes fetch todo context directly from the database using the authenticated 
              user&apos;s session. No context is passed from the client - this is secure and scalable.
            </p>
          </div>
        </div>
      </div>

      {/* Current Todos Display (for reference only) */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">
          Your Todos (fetched server-side)
        </h3>
        <pre className="text-sm text-slate-300 whitespace-pre-wrap">
          {todoDisplay || "No todos yet. Create some to see AI in action!"}
        </pre>
      </div>

      {/* Demo Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. Groq Basic Demo */}
        <Suspense fallback={<DemoSkeleton title="Groq API" />}>
          <GroqDemo />
        </Suspense>

        {/* 2. Streaming Demo */}
        <Suspense fallback={<DemoSkeleton title="Streaming" />}>
          <StreamingDemo />
        </Suspense>

        {/* 3. Vercel AI SDK Demo (API Route + useChat) */}
        <Suspense fallback={<DemoSkeleton title="Vercel AI SDK" />}>
          <VercelSdkDemo />
        </Suspense>

        {/* 4. Vercel AI SDK (Server Actions - no API route!) */}
        <Suspense fallback={<DemoSkeleton title="Server Actions" />}>
          <ServerActionsDemo />
        </Suspense>

        {/* 5. Custom Agent Pattern (Educational) */}
        <Suspense fallback={<DemoSkeleton title="Custom Agent" />}>
          <AgnoDemo />
        </Suspense>

        {/* 6. LangChain.js (Real Framework) */}
        <Suspense fallback={<DemoSkeleton title="LangChain.js" />}>
          <LangChainDemo />
        </Suspense>
      </div>

      {/* 5. Mastra Chatbot - Full Width */}
      <Suspense fallback={<DemoSkeleton title="Mastra.ai Chatbot" />}>
        <MastraChatbot />
      </Suspense>
    </div>
  );
}

function DemoSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-32 bg-white/5 rounded-lg" />
    </div>
  );
}
