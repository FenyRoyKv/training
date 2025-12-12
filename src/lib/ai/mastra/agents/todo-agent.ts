import { Agent } from "@mastra/core";
import { llmModel } from "../models";
import {
  listTodosTool,
  summarizeTodosTool,
  createTodoTool,
  updateTodoStatusTool,
  deleteTodoTool,
  searchTodosTool,
} from "../tools/todo-tools";

/**
 * ============================================================
 * MASTRA TODO AGENT
 * ============================================================
 *
 * This agent is designed to help users interact with their todos
 * through natural language. It can:
 *
 * 1. List and search todos
 * 2. Create new todos
 * 3. Mark todos as complete/incomplete
 * 4. Delete todos
 * 5. Provide summaries and insights
 *
 * The agent uses the Groq LLM to understand user intent and
 * decides which tools to call to fulfill the request.
 */

export const todoAgent = new Agent({
  name: "TaskFlow Assistant",
  instructions: `You are TaskFlow Assistant, an AI helper for the TaskFlow todo application.

Your capabilities:
1. **View Tasks**: List all todos, filter by status or priority, search by keywords
2. **Create Tasks**: Help users add new todos with appropriate priorities
3. **Manage Tasks**: Mark tasks as complete/incomplete, delete tasks
4. **Summarize**: Provide insights about task completion, priorities, and productivity

Guidelines:
- Always be helpful and concise
- When listing tasks, format them nicely
- Suggest priorities based on task descriptions
- Offer productivity tips when summarizing
- If a user's request is ambiguous, ask for clarification
- Celebrate task completions!

Remember: You have access to the user's todo list through your tools. Use them to provide accurate, real-time information.`,

  model: llmModel,

  tools: {
    listTodos: listTodosTool,
    summarizeTodos: summarizeTodosTool,
    createTodo: createTodoTool,
    updateTodoStatus: updateTodoStatusTool,
    deleteTodo: deleteTodoTool,
    searchTodos: searchTodosTool,
  },
});
