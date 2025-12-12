"use client";

import { useChat } from "@ai-sdk/react";

/**
 * ============================================================
 * VERCEL AI SDK DEMO
 * ============================================================
 * 
 * Demonstrates:
 * - useChat hook from Vercel AI SDK
 * - Automatic streaming handling
 * - Message history management
 * - Built-in loading states
 * 
 * The Vercel AI SDK provides React hooks that handle:
 * - Streaming responses
 * - Message state management
 * - Error handling
 * - Abort/cancel
 * 
 * NOTE: Todo context is fetched from DB in the API route,
 * not passed from the client (scalable approach).
 */

export default function VercelSdkDemo() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai/vercel-sdk",
      // No body/todoContext needed - fetched from DB in the route!
    });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Vercel AI SDK</h3>
          <p className="text-xs text-slate-400">useChat hook with streaming</p>
        </div>
      </div>

      {/* Messages */}
      <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg text-sm ${
              msg.role === "user"
                ? "bg-blue-600/20 text-blue-200 ml-8"
                : "bg-white/5 text-slate-300 mr-8"
            }`}
          >
            <span className="font-medium text-xs text-slate-500 block mb-1">
              {msg.role === "user" ? "You" : "AI"}
            </span>
            {msg.content}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">
            Start a conversation...
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        💡 useChat hook handles streaming, history, errors automatically
      </p>
      <p className="text-xs text-green-400/70">
        ✓ Context fetched from database server-side
      </p>
    </div>
  );
}
