import Modal from "@/components/Modal";
import TodoForm from "@/components/TodoForm";

// Intercepting Route for New Todo Modal
// Demonstrates: (.) intercepting route - intercepts /todo/new at same level
// When clicking "New Task" from dashboard, this modal appears
// When navigating directly to /todo/new, full page renders

export default function NewTodoModal() {
  return (
    <Modal title="Create New Task">
      <TodoForm />
    </Modal>
  );
}

