import { Mastra } from "@mastra/core";
import { todoAgent } from "./agents/todo-agent";

/**
 * ============================================================
 * MASTRA.AI FRAMEWORK SETUP
 * ============================================================
 *
 * Mastra is a TypeScript framework for building AI applications.
 * It provides:
 * 1. Agent abstraction with tool calling
 * 2. Workflow orchestration
 * 3. RAG (Retrieval Augmented Generation)
 * 4. Integrations with various AI providers
 *
 * Key Components:
 * - Agents: AI entities with specific capabilities
 * - Tools: Functions agents can execute
 * - Workflows: Multi-step AI processes
 * - Memory: Conversation history and context
 *
 * Docs: https://mastra.ai/docs
 */

// Initialize Mastra with configuration
export const mastra = new Mastra({
  agents: {
    todoAgent,
  },
});

// Re-export models for convenience
export { llmModel, fastModel } from "./models";
