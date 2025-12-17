"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/db";
import { auth } from "@/lib/auth";
import { todoSchema } from "@/lib/validations";

// Server Actions for Todo CRUD Operations
// Demonstrates: Data mutations with Server Actions and Prisma

export type TodoState = {
  error?: string;
  success?: boolean;
};

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// Create a new todo
export async function createTodo(
  _prevState: TodoState,
  formData: FormData
): Promise<TodoState> {
  const rawData = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    priority: (formData.get("priority") as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM",
  };

  const validatedFields = todoSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();

    await db.todo.create({
      data: {
        ...validatedFields.data,
        userId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to create todo" };
  }
}

// Update an existing todo
export async function updateTodo(
  todoId: string,
  _prevState: TodoState,
  formData: FormData
): Promise<TodoState> {
  const rawData = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    priority: (formData.get("priority") as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM",
  };

  const validatedFields = todoSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    const existingTodo = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!existingTodo) {
      return { error: "Todo not found" };
    }

    await db.todo.update({
      where: { id: todoId },
      data: validatedFields.data,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/todo/${todoId}`);
    return { success: true };
  } catch {
    return { error: "Failed to update todo" };
  }
}

// Toggle todo completion status
export async function toggleTodoComplete(todoId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const todo = await db.todo.findFirst({
    where: { id: todoId, userId },
  });

  if (!todo) {
    throw new Error("Todo not found");
  }

  await db.todo.update({
    where: { id: todoId },
    data: { completed: !todo.completed },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/todo/${todoId}`);
}

// Delete a todo
export async function deleteTodo(todoId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const todo = await db.todo.findFirst({
    where: { id: todoId, userId },
  });

  if (!todo) {
    throw new Error("Todo not found");
  }

  await db.todo.delete({
    where: { id: todoId },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Get all todos for current user
export async function getTodos() {
  const userId = await getCurrentUserId();

  return db.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Get a single todo by ID
export async function getTodoById(todoId: string) {
  const userId = await getCurrentUserId();

  return db.todo.findFirst({
    where: { id: todoId, userId },
  });
}

