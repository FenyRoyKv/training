import Link from "next/link";
import TodoForm from "@/components/TodoForm";

// New Todo Full Page
// Demonstrates: Full page view (when not intercepted)
// This renders when navigating directly to /todo/new

export default function NewTodoPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Task</h1>
        <TodoForm />
      </div>
    </div>
  );
}

