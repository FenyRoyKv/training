import { notFound } from "next/navigation";
import Modal from "@/components/Modal";
import { getTodoById } from "@/lib/actions/todo";

// Intercepting Route for Todo Details Modal
// Demonstrates: (.) intercepting route with dynamic segment
// Clicking a todo from dashboard shows this modal
// Direct navigation shows full page

type TodoModalProps = {
  params: Promise<{ id: string }>;
};

const priorityLabels = {
  LOW: { label: "Low Priority", class: "bg-green-500/20 text-green-400 border-green-500/30" },
  MEDIUM: { label: "Medium Priority", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  HIGH: { label: "High Priority", class: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default async function TodoModal({ params }: TodoModalProps) {
  const { id } = await params;
  const todo = await getTodoById(id);

  if (!todo) {
    notFound();
  }

  const priority = priorityLabels[todo.priority];

  return (
    <Modal title="Task Details">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${priority.class}`}>
            {priority.label}
          </span>
          {todo.completed && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              Completed
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-white">{todo.title}</h3>

        {todo.description && (
          <p className="text-slate-300">{todo.description}</p>
        )}

        <div className="pt-4 border-t border-white/10 text-sm text-slate-400 space-y-1">
          <p>Created: {new Date(todo.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(todo.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </Modal>
  );
}

