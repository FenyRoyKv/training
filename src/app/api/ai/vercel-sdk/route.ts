import { streamText, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
// import { createOpenAI } from "@ai-sdk/openai"; // OpenAI alternative
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { getTodoContext } from "@/lib/ai/todo-context";

/**
 * ============================================================
 * VERCEL AI SDK - Recommended Approach
 * ============================================================
 * 
 * The Vercel AI SDK provides a unified interface for multiple AI providers
 * with built-in streaming support and React hooks.
 * 
 * Benefits:
 * 1. Provider-agnostic: Easy to switch between OpenAI, Anthropic, Groq, etc.
 * 2. Built-in streaming with proper cleanup
 * 3. React hooks for client-side (useChat, useCompletion)
 * 4. Type-safe responses
 * 5. Automatic error handling
 * 
 * SWITCHING PROVIDERS:
 * 
 * // OpenAI:
 * import { createOpenAI } from "@ai-sdk/openai";
 * const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const model = openai("gpt-4-turbo");
 * 
 * // Anthropic:
 * import { createAnthropic } from "@ai-sdk/anthropic";
 * const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * const model = anthropic("claude-3-opus-20240229");
 * 
 * // Google:
 * import { createGoogleGenerativeAI } from "@ai-sdk/google";
 * const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });
 * const model = google("gemini-pro");
 */

// Initialize Groq provider with Vercel AI SDK
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// POST: Streaming response using Vercel AI SDK
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429 }
      );
    }

    const { messages } = await request.json();

    // ✅ SCALABLE: Fetch todo context from database
    const todoContext = await getTodoContext(userId);

    // System message with database-fetched context
    const systemMessage = {
      role: "system" as const,
      content: `You are a helpful assistant for TaskFlow, a todo management app.

User's current todos from database:
${todoContext}

Help users with:
- Task prioritization and organization
- Productivity tips
- Task breakdown and planning
- Time management suggestions

Be concise and actionable. Reference specific tasks when relevant.`,
    };

    // Use streamText for streaming responses
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      maxTokens: 1024,
    });

    // Return the streaming response
    // The Vercel AI SDK handles all the complexity
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Vercel AI SDK error:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET: Non-streaming example with generateText
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt") || "Give me a productivity tip for managing todos.";

    // ✅ SCALABLE: Fetch todo context from database
    const todoContext = await getTodoContext(userId, { includeCompleted: false });

    // Use generateText for non-streaming responses
    const { text, usage } = await generateText({
      model: groq("llama-3.1-8b-instant"), // Faster model for quick responses
      system: `You are a TaskFlow assistant. User's pending todos:\n${todoContext}`,
      prompt,
      temperature: 0.7,
      maxTokens: 256,
    });

    return new Response(
      JSON.stringify({
        response: text,
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Vercel AI SDK error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
