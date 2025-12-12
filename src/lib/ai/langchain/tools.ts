import { tool } from "@langchain/core/tools";
import { z } from "zod";
import db from "@/db";

/**
 * ============================================================
 * LANGCHAIN TOOLS
 * ============================================================
 *
 * In LangChain, tools are defined using the `tool` function with:
 * - name: Tool identifier
 * - description: What the tool does (used by LLM)
 * - schema: Zod schema for input validation
 * - func: The actual implementation
 *
 * The LLM uses the description to decide when to use each tool.
 */

// Tool: List todos
export const listTodosTool = tool(
  async ({ userId, completed }) => {
    const where: { userId: string; completed?: boolean } = { userId };
    if (completed !== undefined) {
      where.completed = completed;
    }

    const todos = await db.todo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, completed: true, priority: true },
    });

    return JSON.stringify({ todos, count: todos.length });
  },
  {
    name: "list_todos",
    description: "List all todos for the user. Can optionally filter by completion status.",
    schema: z.object({
      userId: z.string().describe("The user's ID"),
      completed: z.boolean().optional().describe("Filter by completion status"),
    }),
  }
);

// Tool: Create todo
export const createTodoTool = tool(
  async ({ userId, title, description, priority }) => {
    const todo = await db.todo.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        userId,
      },
    });

    return JSON.stringify({
      success: true,
      todo: { id: todo.id, title: todo.title, priority: todo.priority },
    });
  },
  {
    name: "create_todo",
    description: "Create a new todo item for the user.",
    schema: z.object({
      userId: z.string().describe("The user's ID"),
      title: z.string().describe("The title of the todo"),
      description: z.string().optional().describe("Optional description"),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().describe("Priority level"),
    }),
  }
);

// Tool: Complete todo
export const completeTodoTool = tool(
  async ({ userId, todoId }) => {
    const todo = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!todo) {
      return JSON.stringify({ success: false, error: "Todo not found" });
    }

    const updated = await db.todo.update({
      where: { id: todoId },
      data: { completed: true },
    });

    return JSON.stringify({
      success: true,
      todo: { id: updated.id, title: updated.title, completed: true },
    });
  },
  {
    name: "complete_todo",
    description: "Mark a todo as completed.",
    schema: z.object({
      userId: z.string().describe("The user's ID"),
      todoId: z.string().describe("The ID of the todo to complete"),
    }),
  }
);

// Tool: Delete todo
export const deleteTodoTool = tool(
  async ({ userId, todoId }) => {
    const todo = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!todo) {
      return JSON.stringify({ success: false, error: "Todo not found" });
    }

    await db.todo.delete({ where: { id: todoId } });

    return JSON.stringify({
      success: true,
      message: `Deleted: "${todo.title}"`,
    });
  },
  {
    name: "delete_todo",
    description: "Delete a todo item permanently.",
    schema: z.object({
      userId: z.string().describe("The user's ID"),
      todoId: z.string().describe("The ID of the todo to delete"),
    }),
  }
);

// Tool: Summarize todos
export const summarizeTodosTool = tool(
  async ({ userId }) => {
    const todos = await db.todo.findMany({ where: { userId } });

    const summary = {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      pending: todos.filter((t) => !t.completed).length,
      byPriority: {
        high: todos.filter((t) => t.priority === "HIGH" && !t.completed).length,
        medium: todos.filter((t) => t.priority === "MEDIUM" && !t.completed).length,
        low: todos.filter((t) => t.priority === "LOW" && !t.completed).length,
      },
      pendingTasks: todos
        .filter((t) => !t.completed)
        .map((t) => ({ title: t.title, priority: t.priority })),
    };

    return JSON.stringify(summary);
  },
  {
    name: "summarize_todos",
    description: "Get a comprehensive summary of all todos with statistics.",
    schema: z.object({
      userId: z.string().describe("The user's ID"),
    }),
  }
);

// Export all tools as an array
export const todoTools = [
  listTodosTool,
  createTodoTool,
  completeTodoTool,
  deleteTodoTool,
  summarizeTodosTool,
];

