import Groq from "groq-sdk";

/**
 * ============================================================
 * GROQ API CLIENT - Basic Setup
 * ============================================================
 * 
 * Groq provides fast inference for open-source LLMs like Llama, Mixtral, etc.
 * 
 * ALTERNATIVES (uncomment to use):
 * 
 * // OpenAI Alternative:
 * // import OpenAI from 'openai';
 * // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * // Usage: openai.chat.completions.create({ model: 'gpt-4', messages: [...] })
 * 
 * // Anthropic Alternative:
 * // import Anthropic from '@anthropic-ai/sdk';
 * // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * // Usage: anthropic.messages.create({ model: 'claude-3-opus-20240229', ... })
 */

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;

// Available Groq models
export const GROQ_MODELS = {
  LLAMA_70B: "llama-3.3-70b-versatile",
  LLAMA_8B: "llama-3.1-8b-instant",
  MIXTRAL: "mixtral-8x7b-32768",
  GEMMA: "gemma2-9b-it",
} as const;

export type GroqModel = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS];
