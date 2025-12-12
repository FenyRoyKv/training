/**
 * ============================================================
 * AGNO FRAMEWORK - AI Agent with Tool Discovery
 * ============================================================
 *
 * This implementation demonstrates a more sophisticated agent pattern
 * with TOOL DISCOVERY - the agent discovers available tools at runtime
 * instead of having them hardcoded in the system prompt.
 *
 * Benefits:
 * 1. Smaller system prompt (no tool descriptions)
 * 2. Dynamic tool registration
 * 3. Tools can be added/removed at runtime
 * 4. More realistic agent pattern
 *
 * Flow:
 * 1. Agent starts with minimal instructions
 * 2. Agent calls discover_tools to see what's available
 * 3. Agent uses discovered tools to complete the task
 */

import groq, { GROQ_MODELS } from "./groq-client";
import db from "@/db";

// Configuration
const MAX_ITERATIONS = 7; // Increased to account for discovery step

// Tool Registry - Central place for all tools
export interface Tool {
  name: string;
  description: string;
  parameters: Record<
    string,
    { type: string; description: string; required?: boolean }
  >;
  execute: (params: Record<string, unknown>, userId: string) => Promise<unknown>;
}

// Tool Registry class for dynamic tool management
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  unregister(toolName: string): void {
    this.tools.delete(toolName);
  }

  get(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  // Get tool descriptions for discovery
  getToolDescriptions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string; required?: boolean }>;
  }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }
}

// Create global registry
export const toolRegistry = new ToolRegistry();

// ============================================================
// REGISTER TOOLS
// ============================================================

// Meta-tool: Discover available tools
toolRegistry.register({
  name: "discover_tools",
  description:
    "Discover all available tools and their capabilities. Call this first to see what actions you can perform.",
  parameters: {},
  execute: async () => {
    // Return all tools except discover_tools itself
    const tools = toolRegistry
      .getToolDescriptions()
      .filter((t) => t.name !== "discover_tools");

    return {
      available_tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: Object.entries(tool.parameters).map(([name, config]) => ({
          name,
          type: config.type,
          required: config.required || false,
          description: config.description,
        })),
      })),
      total_count: tools.length,
    };
  },
});

// Tool: List todos
toolRegistry.register({
  name: "list_todos",
  description:
    "List all todos for the user. Can filter by completion status (completed=true/false).",
  parameters: {
    completed: {
      type: "boolean",
      description: "Filter by completion status. Omit for all todos.",
      required: false,
    },
  },
  execute: async (params, userId) => {
    const where: { userId: string; completed?: boolean } = { userId };
    if (params.completed !== undefined) {
      where.completed = params.completed as boolean;
    }
    const todos = await db.todo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, completed: true, priority: true },
    });
    return { todos, count: todos.length };
  },
});

// Tool: Create todo
toolRegistry.register({
  name: "create_todo",
  description: "Create a new todo item for the user.",
  parameters: {
    title: {
      type: "string",
      description: "The title of the todo",
      required: true,
    },
    description: {
      type: "string",
      description: "Optional description",
      required: false,
    },
    priority: {
      type: "string",
      description: "Priority level: LOW, MEDIUM, or HIGH. Defaults to MEDIUM.",
      required: false,
    },
  },
  execute: async (params, userId) => {
    const todo = await db.todo.create({
      data: {
        title: params.title as string,
        description: params.description as string | undefined,
        priority: (params.priority as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM",
        userId,
      },
    });
    return { success: true, todo: { id: todo.id, title: todo.title, priority: todo.priority } };
  },
});

// Tool: Complete todo
toolRegistry.register({
  name: "complete_todo",
  description: "Mark a todo as completed.",
  parameters: {
    todoId: {
      type: "string",
      description: "The ID of the todo to complete",
      required: true,
    },
  },
  execute: async (params, userId) => {
    const todo = await db.todo.findFirst({
      where: { id: params.todoId as string, userId },
    });
    if (!todo) return { success: false, error: "Todo not found" };

    const updated = await db.todo.update({
      where: { id: params.todoId as string },
      data: { completed: true },
    });
    return { success: true, todo: { id: updated.id, title: updated.title, completed: true } };
  },
});

// Tool: Delete todo
toolRegistry.register({
  name: "delete_todo",
  description: "Delete a todo item permanently.",
  parameters: {
    todoId: {
      type: "string",
      description: "The ID of the todo to delete",
      required: true,
    },
  },
  execute: async (params, userId) => {
    const todo = await db.todo.findFirst({
      where: { id: params.todoId as string, userId },
    });
    if (!todo) return { success: false, error: "Todo not found" };

    await db.todo.delete({ where: { id: params.todoId as string } });
    return { success: true, message: `Deleted: "${todo.title}"` };
  },
});

// Tool: Summarize todos
toolRegistry.register({
  name: "summarize_todos",
  description: "Get a comprehensive summary of all todos with statistics.",
  parameters: {},
  execute: async (_, userId) => {
    const todos = await db.todo.findMany({ where: { userId } });

    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      pending: todos.filter((t) => !t.completed).length,
      by_priority: {
        high: todos.filter((t) => t.priority === "HIGH" && !t.completed).length,
        medium: todos.filter((t) => t.priority === "MEDIUM" && !t.completed).length,
        low: todos.filter((t) => t.priority === "LOW" && !t.completed).length,
      },
      pending_titles: todos
        .filter((t) => !t.completed)
        .map((t) => ({ title: t.title, priority: t.priority })),
    };
  },
});

// ============================================================
// AGENT SYSTEM PROMPT (Minimal - no tool descriptions!)
// ============================================================

const AGENT_SYSTEM_PROMPT = `You are an AI agent for TaskFlow, a todo management app.

IMPORTANT: You must FIRST call "discover_tools" to see what tools are available before attempting any action.

Your workflow:
1. Call discover_tools to see available capabilities
2. Use the appropriate tools to fulfill the user's request
3. You may need multiple tool calls to complete a task
4. When done, provide a final response (set tool to null)

Respond with JSON:
{
  "thought": "Your reasoning about what to do next",
  "tool": "tool_name" or null if done,
  "parameters": { ... } if calling a tool,
  "response": "Final response to user" (only when tool is null)
}

Remember: Always discover tools first if you haven't already in this conversation.`;

// ============================================================
// AGENT EXECUTION
// ============================================================

export interface AgentStep {
  thought: string;
  tool: string | null;
  parameters?: Record<string, unknown>;
  toolResult?: unknown;
}

export interface AgentResponse {
  steps: AgentStep[];
  finalResponse: string;
  iterations: number;
  toolsDiscovered: boolean;
}

/**
 * Run the agent loop with tool discovery
 */
export async function runAgent(
  userMessage: string,
  userId: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AgentResponse> {
  const steps: AgentStep[] = [];
  let iterations = 0;
  let finalResponse = "";
  let toolsDiscovered = false;

  // Build initial messages
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  // Agent loop
  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Get agent's decision
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.LLAMA_70B,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    let agentDecision: {
      thought: string;
      tool: string | null;
      parameters?: Record<string, unknown>;
      response?: string;
    };

    try {
      agentDecision = JSON.parse(responseText);
    } catch {
      finalResponse = responseText;
      break;
    }

    const step: AgentStep = {
      thought: agentDecision.thought || "",
      tool: agentDecision.tool,
      parameters: agentDecision.parameters,
    };

    // If no tool is selected, we're done
    if (!agentDecision.tool) {
      finalResponse = agentDecision.response || "Done!";
      steps.push(step);
      break;
    }

    // Track if tools were discovered
    if (agentDecision.tool === "discover_tools") {
      toolsDiscovered = true;
    }

    // Find and execute the tool from registry
    const tool = toolRegistry.get(agentDecision.tool);

    if (tool) {
      try {
        const toolResult = await tool.execute(agentDecision.parameters || {}, userId);
        step.toolResult = toolResult;

        // Add to message history for next iteration
        messages.push({
          role: "assistant",
          content: responseText,
        });
        messages.push({
          role: "user",
          content: `Tool "${agentDecision.tool}" returned:\n${JSON.stringify(toolResult, null, 2)}\n\nContinue with the next step or provide a final response.`,
        });
      } catch (error) {
        step.toolResult = { error: String(error) };
        messages.push({
          role: "assistant",
          content: responseText,
        });
        messages.push({
          role: "user",
          content: `Tool "${agentDecision.tool}" failed: ${error}\n\nHandle this error appropriately.`,
        });
      }
    } else {
      // Tool not found - inform the agent
      step.toolResult = { error: `Unknown tool: ${agentDecision.tool}` };
      messages.push({
        role: "assistant",
        content: responseText,
      });
      messages.push({
        role: "user",
        content: `Unknown tool "${agentDecision.tool}". Call discover_tools to see available tools.`,
      });
    }

    steps.push(step);
  }

  // Generate final response if max iterations reached
  if (!finalResponse && iterations >= MAX_ITERATIONS) {
    const summaryCompletion = await groq.chat.completions.create({
      model: GROQ_MODELS.LLAMA_8B,
      messages: [
        ...messages,
        {
          role: "user",
          content: "Maximum iterations reached. Summarize what was done and respond to the user. Plain text only.",
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });
    finalResponse = summaryCompletion.choices[0]?.message?.content || "Task completed.";
  }

  return {
    steps,
    finalResponse,
    iterations,
    toolsDiscovered,
  };
}

// ============================================================
// HELPER: Register custom tools at runtime
// ============================================================

export function registerTool(tool: Tool): void {
  toolRegistry.register(tool);
}

export function unregisterTool(toolName: string): void {
  toolRegistry.unregister(toolName);
}

export function getRegisteredTools(): Tool[] {
  return toolRegistry.getAll();
}
