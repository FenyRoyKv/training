import { notFound } from "next/navigation";
import Modal from "@/components/Modal";
import TodoForm from "@/components/TodoForm";
import { getTodoById } from "@/lib/actions/todo";

// Intercepting Route for Edit Todo Modal
// Demonstrates: Nested intercepting route with dynamic segment

type EditTodoModalProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTodoModal({ params }: EditTodoModalProps) {
  const { id } = await params;
  const todo = await getTodoById(id);

  if (!todo) {
    notFound();
  }

  return (
    <Modal title="Edit Task">
      <TodoForm todo={todo} />
    </Modal>
  );
}

