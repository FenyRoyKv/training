"use client";

import { useActionState } from "react";
import type { Todo } from "@prisma/client";
import { createTodo, updateTodo, type TodoState } from "@/lib/actions/todo";

// Todo Form Component
// Reusable form for create and edit

type TodoFormProps = {
  todo?: Todo;
  onSuccess?: () => void;
};

export default function TodoForm({ todo, onSuccess }: TodoFormProps) {
  const isEditing = !!todo;

  // Bind the todoId if editing
  const action = isEditing
    ? updateTodo.bind(null, todo.id)
    : createTodo;

  const [state, formAction, isPending] = useActionState<TodoState, FormData>(
    action,
    {}
  );

  // Handle success
  if (state.success && onSuccess) {
    onSuccess();
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
          {isEditing ? "Todo updated successfully!" : "Todo created successfully!"}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-200 mb-2">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={todo?.title}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
          Description
          <span className="text-slate-400 font-normal"> (optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={todo?.description || ""}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          placeholder="Add more details..."
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-slate-200 mb-2">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={todo?.priority || "MEDIUM"}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="LOW" className="bg-slate-800">Low</option>
          <option value="MEDIUM" className="bg-slate-800">Medium</option>
          <option value="HIGH" className="bg-slate-800">High</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {isEditing ? "Updating..." : "Creating..."}
          </span>
        ) : (
          isEditing ? "Update Todo" : "Create Todo"
        )}
      </button>
    </form>
  );
}

