import { createGroq } from "@ai-sdk/groq";

/**
 * ============================================================
 * MASTRA - Model Configuration
 * ============================================================
 *
 * Separate file to avoid circular dependencies.
 * Models are defined here and imported by agents.
 */

// Initialize Groq provider
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Export models for use in agents
export const llmModel = groq("llama-3.3-70b-versatile");
export const fastModel = groq("llama-3.1-8b-instant");
