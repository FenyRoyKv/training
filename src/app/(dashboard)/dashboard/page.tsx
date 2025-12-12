import Link from "next/link";
import { getTodos } from "@/lib/actions/todo";
import TodoCard from "@/components/TodoCard";

// Dashboard Page - Main todo list view
// Demonstrates: Server Component fetching data

export default async function DashboardPage() {
  const todos = await getTodos();

  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Tasks</p>
          <p className="text-3xl font-bold text-white mt-1">{todos.length}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Pending</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Completed</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Tasks</h2>
        <Link
          href="/todo/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Link>
      </div>

      {/* Todo List */}
      {todos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No tasks yet</h3>
          <p className="text-slate-400 mb-6">Create your first task to get started</p>
          <Link
            href="/todo/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {todos.map((todo) => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}

