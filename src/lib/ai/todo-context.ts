import db from "@/db";

/**
 * ============================================================
 * TODO CONTEXT HELPER
 * ============================================================
 * 
 * Fetches and formats todo data for AI context.
 * This is the scalable approach - fetch from DB in the API route
 * instead of passing context from the client.
 */

export type TodoContextOptions = {
  includeCompleted?: boolean;
  limit?: number;
};

/**
 * Get formatted todo context for AI prompts
 */
export async function getTodoContext(
  userId: string,
  options: TodoContextOptions = {}
): Promise<string> {
  const { includeCompleted = true, limit = 50 } = options;

  const todos = await db.todo.findMany({
    where: {
      userId,
      ...(includeCompleted ? {} : { completed: false }),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  if (todos.length === 0) {
    return "No todos found.";
  }

  // Format todos for AI context
  const formattedTodos = todos.map((todo) => {
    const status = todo.completed ? "✓" : "○";
    const priority = todo.priority.toLowerCase();
    const description = todo.description ? ` - ${todo.description}` : "";
    return `${status} [${priority}] ${todo.title}${description}`;
  });

  const summary = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    pending: todos.filter((t) => !t.completed).length,
    highPriority: todos.filter((t) => t.priority === "HIGH" && !t.completed).length,
  };

  return `
Todo Summary:
- Total: ${summary.total} tasks
- Completed: ${summary.completed}
- Pending: ${summary.pending}
- High Priority Pending: ${summary.highPriority}

Tasks:
${formattedTodos.join("\n")}
`.trim();
}

/**
 * Get raw todos for structured operations
 */
export async function getTodosForContext(userId: string, limit = 50) {
  return db.todo.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      completed: true,
      priority: true,
      createdAt: true,
    },
  });
}
