import Link from "next/link";
import { notFound } from "next/navigation";
import { getTodoById, toggleTodoComplete, deleteTodo } from "@/lib/actions/todo";

// Dynamic Route for Todo Details
// Demonstrates: Dynamic route segment [id]
// Full page view with complete todo information

type TodoPageProps = {
  params: Promise<{ id: string }>;
};

const priorityConfig = {
  LOW: { label: "Low Priority", class: "bg-green-500/20 text-green-400 border-green-500/30" },
  MEDIUM: { label: "Medium Priority", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  HIGH: { label: "High Priority", class: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default async function TodoPage({ params }: TodoPageProps) {
  const { id } = await params;
  const todo = await getTodoById(id);

  if (!todo) {
    notFound();
  }

  const priority = priorityConfig[todo.priority];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
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

      {/* Todo Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm px-3 py-1 rounded-full border ${priority.class}`}>
                {priority.label}
              </span>
              {todo.completed && (
                <span className="text-sm px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  ✓ Completed
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/todo/${todo.id}/edit`}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              <form action={deleteTodo.bind(null, todo.id)}>
                <button
                  type="submit"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h1 className={`text-2xl font-bold ${todo.completed ? "text-slate-400 line-through" : "text-white"}`}>
              {todo.title}
            </h1>
          </div>

          {todo.description && (
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-2">Description</h2>
              <p className="text-slate-200 whitespace-pre-wrap">{todo.description}</p>
            </div>
          )}

          {/* Toggle Complete */}
          <form action={toggleTodoComplete.bind(null, todo.id)}>
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                todo.completed
                  ? "bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-600/30"
                  : "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30"
              }`}
            >
              {todo.completed ? "Mark as Incomplete" : "Mark as Complete"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Created: {new Date(todo.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(todo.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

