import { createTool } from "@mastra/core";
import { z } from "zod";
import db from "@/db";

/**
 * ============================================================
 * MASTRA TOOLS - Todo Management
 * ============================================================
 * 
 * Tools are functions that agents can call to interact with
 * external systems. Each tool has:
 * - id: Unique identifier
 * - description: What the tool does (used by LLM)
 * - inputSchema: Zod schema for parameters
 * - execute: The actual function logic
 */

// Tool to list all todos
export const listTodosTool = createTool({
  id: "list-todos",
  description: "Lists all todos for the current user. Can filter by completion status or priority.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID"),
    completed: z.boolean().optional().describe("Filter by completion status"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().describe("Filter by priority level"),
  }),
  execute: async ({ context }) => {
    const { userId, completed, priority } = context;

    const where: {
      userId: string;
      completed?: boolean;
      priority?: "LOW" | "MEDIUM" | "HIGH";
    } = { userId };

    if (completed !== undefined) where.completed = completed;
    if (priority) where.priority = priority;

    const todos = await db.todo.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return {
      count: todos.length,
      todos: todos.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        completed: t.completed,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  },
});

// Tool to get todo summary/analytics
export const summarizeTodosTool = createTool({
  id: "summarize-todos",
  description: "Provides a comprehensive summary of the user's todos including statistics and insights.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID"),
  }),
  execute: async ({ context }) => {
    const { userId } = context;

    const todos = await db.todo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const completed = todos.filter((t) => t.completed);
    const pending = todos.filter((t) => !t.completed);

    const summary = {
      totalTodos: todos.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      completionRate: todos.length > 0 ? Math.round((completed.length / todos.length) * 100) : 0,

      byPriority: {
        high: {
          total: todos.filter((t) => t.priority === "HIGH").length,
          pending: pending.filter((t) => t.priority === "HIGH").length,
        },
        medium: {
          total: todos.filter((t) => t.priority === "MEDIUM").length,
          pending: pending.filter((t) => t.priority === "MEDIUM").length,
        },
        low: {
          total: todos.filter((t) => t.priority === "LOW").length,
          pending: pending.filter((t) => t.priority === "LOW").length,
        },
      },

      recentActivity: {
        createdToday: todos.filter((t) => t.createdAt >= todayStart).length,
        createdThisWeek: todos.filter((t) => t.createdAt >= weekAgo).length,
        completedThisWeek: completed.filter((t) => t.updatedAt >= weekAgo).length,
      },

      pendingTasks: pending.map((t) => ({
        title: t.title,
        priority: t.priority,
        daysOld: Math.floor((Date.now() - t.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      })),
    };

    return summary;
  },
});

// Tool to create a new todo
export const createTodoTool = createTool({
  id: "create-todo",
  description: "Creates a new todo item for the user.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID"),
    title: z.string().describe("The title of the todo"),
    description: z.string().optional().describe("Optional description"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM").describe("Priority level"),
  }),
  execute: async ({ context }) => {
    const { userId, title, description, priority } = context;

    const todo = await db.todo.create({
      data: {
        title,
        description,
        priority,
        userId,
      },
    });

    return {
      success: true,
      todo: {
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
      },
    };
  },
});

// Tool to update todo status
export const updateTodoStatusTool = createTool({
  id: "update-todo-status",
  description: "Marks a todo as completed or incomplete.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID"),
    todoId: z.string().describe("The ID of the todo to update"),
    completed: z.boolean().describe("Whether the todo is completed"),
  }),
  execute: async ({ context }) => {
    const { userId, todoId, completed } = context;

    // Verify ownership
    const existing = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!existing) {
      return { success: false, error: "Todo not found or not owned by user" };
    }

    const todo = await db.todo.update({
      where: { id: todoId },
      data: { completed },
    });

    return {
      success: true,
      todo: {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
      },
    };
  },
});

// Tool to delete a todo (with human-in-the-loop confirmation)
export const deleteTodoTool = createTool({
  id: "delete-todo",
  description:
    "Deletes a todo item. IMPORTANT: This is a destructive action that requires confirmation. " +
    "First call with 'confirmed: false' to get todo details, then call again with 'confirmed: true' " +
    "only after the user explicitly confirms they want to delete it.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID"),
    todoId: z.string().describe("The ID of the todo to delete"),
    confirmed: z
      .boolean()
      .optional()
      .describe(
        "Set to true only after the user has explicitly confirmed deletion. " +
          "Do not set this on the first call - wait for user confirmation."
      ),
  }),
  execute: async ({ context }) => {
    const { userId, todoId, confirmed } = context;


    console.log('deleteTodoTool', userId, todoId, confirmed, context);

    const existing = await db.todo.findFirst({
      where: { id: todoId, userId },
    });

    if (!existing) {
      return { success: false, error: "Todo not found or not owned by user" };
    }

    // Human-in-the-loop: require explicit confirmation before deletion
    if (!confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: `⚠️ Are you sure you want to delete this todo?`,
        todoToDelete: {
          id: existing.id,
          title: existing.title,
          description: existing.description,
          priority: existing.priority,
          completed: existing.completed,
          createdAt: existing.createdAt.toISOString(),
        },
        instruction:
          "Please confirm you want to delete this todo. This action cannot be undone.",
      };
    }

    // User confirmed - proceed with deletion
    await db.todo.delete({ where: { id: todoId } });

    return {
      success: true,
      message: `✅ Deleted todo: "${existing.title}"`,
    };
  },
});

// Tool to search todos
export const searchTodosTool = createTool({
  id: "search-todos",
  description: "Searches todos by title or description.",
  inputSchema: z.object({
    userId: z.string().describe("The user ID"),
    query: z.string().describe("Search query to match against title and description"),
  }),
  execute: async ({ context }) => {
    const { userId, query } = context;

    const todos = await db.todo.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
    });

    return {
      count: todos.length,
      query,
      results: todos.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority,
      })),
    };
  },
});

// Export all tools
export const todoTools = [
  listTodosTool,
  summarizeTodosTool,
  createTodoTool,
  updateTodoStatusTool,
  deleteTodoTool,
  searchTodosTool,
];
