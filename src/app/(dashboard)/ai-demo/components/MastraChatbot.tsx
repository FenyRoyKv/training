"use client";

import { useState, useRef, useEffect } from "react";

/**
 * ============================================================
 * MASTRA.AI CHATBOT
 * ============================================================
 * 
 * Full-featured chatbot for todo management using Mastra.ai
 * 
 * Features:
 * - Multi-turn conversations
 * - Task summarization
 * - Natural language todo management
 * - Conversation history
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ toolName: string }>;
};

export default function MastraChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/mastra-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || "No response",
        toolCalls: data.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/ai/mastra-chat?action=${action}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          content: `[Quick Action: ${action}]`,
        },
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "No response",
        },
      ]);
    } catch {
      // Silent fail for quick actions
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Mastra.ai Chatbot</h3>
            <p className="text-xs text-slate-400">Chat with your todos</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Clear Chat
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex gap-2 overflow-x-auto">
        <button
          onClick={() => handleQuickAction("summary")}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-sm rounded-lg transition disabled:opacity-50"
        >
          📊 Summary
        </button>
        <button
          onClick={() => handleQuickAction("priorities")}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 text-sm rounded-lg transition disabled:opacity-50"
        >
          🔥 High Priority
        </button>
        <button
          onClick={() => handleQuickAction("today")}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-200 text-sm rounded-lg transition disabled:opacity-50"
        >
          📅 Today&apos;s Focus
        </button>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-white font-medium mb-2">TaskFlow Assistant</h4>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Ask me about your todos! Try &quot;Show my tasks&quot;, &quot;Add a todo&quot;, 
              or &quot;What should I focus on?&quot;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-slate-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.toolCalls.map((tool, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/20 px-2 py-0.5 rounded"
                    >
                      🔧 {tool.toolName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your todos..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-xl transition flex items-center gap-2"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
