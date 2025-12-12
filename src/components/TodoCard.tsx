"use client";

import Link from "next/link";
import { toggleTodoComplete, deleteTodo } from "@/lib/actions/todo";
import type { Todo } from "@prisma/client";

// Todo Card Component
// Demonstrates: Client component with server actions

type TodoCardProps = {
  todo: Todo;
};

const priorityColors = {
  LOW: "bg-green-500/20 text-green-400 border-green-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TodoCard({ todo }: TodoCardProps) {
  return (
    <div
      className={`group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 ${
        todo.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleTodoComplete(todo.id)}
          className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? "bg-blue-600 border-blue-600"
              : "border-slate-500 hover:border-blue-500"
          }`}
        >
          {todo.completed && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/todo/${todo.id}`} className="block">
            <h3
              className={`font-medium text-white mb-1 hover:text-blue-400 transition ${
                todo.completed ? "line-through text-slate-400" : ""
              }`}
            >
              {todo.title}
            </h3>
          </Link>

          {todo.description && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-2">
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${priorityColors[todo.priority]}`}
            >
              {todo.priority.toLowerCase()}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(todo.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/todo/${todo.id}/edit`}
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

