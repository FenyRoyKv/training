import { ChatGroq } from "@langchain/groq";

/**
 * ============================================================
 * LANGCHAIN.JS SETUP
 * ============================================================
 *
 * LangChain is a popular framework for building LLM applications.
 * It provides:
 * - Unified interface for multiple LLM providers
 * - Tool/Function calling abstractions
 * - Agents with reasoning capabilities
 * - Memory and conversation management
 * - Chains for complex workflows
 *
 * Docs: https://js.langchain.com/docs
 */

// Initialize Groq model via LangChain
export const chatModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
});

export const fastModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.7,
});

