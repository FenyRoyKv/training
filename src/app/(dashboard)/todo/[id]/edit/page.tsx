import Link from "next/link";
import { notFound } from "next/navigation";
import TodoForm from "@/components/TodoForm";
import { getTodoById } from "@/lib/actions/todo";

// Dynamic Route for Edit Todo
// Demonstrates: Nested dynamic route [id]/edit

type EditTodoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTodoPage({ params }: EditTodoPageProps) {
  const { id } = await params;
  const todo = await getTodoById(id);

  if (!todo) {
    notFound();
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href={`/todo/${todo.id}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Task
        </Link>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Task</h1>
        <TodoForm todo={todo} />
      </div>
    </div>
  );
}

