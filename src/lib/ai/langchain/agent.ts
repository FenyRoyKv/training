import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { chatModel } from "./index";
import { todoTools } from "./tools";

/**
 * ============================================================
 * LANGCHAIN AGENT
 * ============================================================
 *
 * LangChain provides built-in agent executors that handle:
 * - Tool selection based on user input
 * - Multi-step reasoning (ReAct pattern)
 * - Error handling and retries
 * - Conversation memory
 *
 * Agent Types in LangChain:
 * - Tool Calling Agent: Uses LLM's native function calling
 * - ReAct Agent: Reason + Act pattern
 * - OpenAI Functions Agent: OpenAI-specific function calling
 *
 * We use createToolCallingAgent which works with any LLM
 * that supports tool/function calling.
 */

// Define the prompt template
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are TaskFlow Assistant, a helpful AI for managing todos.

You have access to tools for:
- Listing todos (with optional filters)
- Creating new todos
- Completing todos
- Deleting todos
- Summarizing all todos

IMPORTANT: The userId will be provided in the context. Always use it when calling tools.

Current User ID: {userId}

Be helpful, concise, and friendly. Celebrate when users complete tasks!`,
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

/**
 * Create a LangChain agent executor for todo management
 */
export async function createTodoAgent(userId: string) {
  // Bind the model with tools
  const modelWithTools = chatModel.bindTools(todoTools);

  // Create the agent
  const agent = createToolCallingAgent({
    llm: modelWithTools,
    tools: todoTools,
    prompt,
  });

  // Create the executor that handles the agent loop
  const executor = new AgentExecutor({
    agent,
    tools: todoTools,
    verbose: false, // Set to true for debugging
    maxIterations: 5,
    returnIntermediateSteps: true,
  });

  return { executor, userId };
}

/**
 * Run the agent with a user message
 */
export async function runLangChainAgent(
  message: string,
  userId: string,
  chatHistory: Array<{ role: "human" | "ai"; content: string }> = []
) {
  const { executor } = await createTodoAgent(userId);

  // Format chat history for LangChain
  const formattedHistory = chatHistory.map((msg) => ({
    type: msg.role,
    content: msg.content,
  }));

  // Run the agent
  const result = await executor.invoke({
    input: message,
    userId, // Passed to the prompt
    chat_history: formattedHistory,
  });

  // Extract intermediate steps for transparency
  const steps = result.intermediateSteps?.map(
    (step: { action: { tool: string; toolInput: unknown }; observation: string }) => ({
      tool: step.action.tool,
      input: step.action.toolInput,
      output: step.observation,
    })
  ) || [];

  return {
    output: result.output,
    steps,
    iterations: steps.length,
  };
}

