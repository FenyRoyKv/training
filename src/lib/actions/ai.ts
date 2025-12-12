"use server";

import { generateText, streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createStreamableValue } from "ai/rsc";
import { auth } from "@/lib/auth";
import { getTodoContext } from "@/lib/ai/todo-context";

/**
 * ============================================================
 * VERCEL AI SDK - SERVER ACTIONS
 * ============================================================
 *
 * Using Vercel AI SDK directly in Server Actions (no API route needed!)
 *
 * Benefits:
 * 1. No need to create API routes
 * 2. Type-safe end-to-end
 * 3. Can be called directly from client components
 * 4. Automatic request deduplication
 * 5. Works with streaming via createStreamableValue
 */

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Non-streaming: Generate a quick todo suggestion
 */
export async function generateTodoSuggestion(currentTask: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const todoContext = await getTodoContext(session.user.id, {
    includeCompleted: false,
    limit: 10,
  });

  const { text } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    system: `You are a productivity assistant. User's pending todos:\n${todoContext}`,
    prompt: `The user is working on: "${currentTask}". Suggest a brief next step or tip (1-2 sentences).`,
    maxTokens: 100,
  });

  return text;
}

/**
 * Non-streaming: Summarize all todos
 */
export async function summarizeTodos() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const todoContext = await getTodoContext(session.user.id);

  const { text, usage } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: "You are a productivity assistant.",
    prompt: `Analyze these todos and provide a brief summary with priorities:\n\n${todoContext}`,
    maxTokens: 300,
  });

  return { summary: text, usage };
}

/**
 * Streaming: Stream a response using createStreamableValue
 * This allows streaming from Server Actions to client components
 */
export async function streamTodoAdvice(question: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const todoContext = await getTodoContext(session.user.id);

  // Create a streamable value that can be consumed by the client
  const stream = createStreamableValue("");

  // Start streaming in the background
  (async () => {
    const { textStream } = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are TaskFlow assistant. User's todos:\n${todoContext}`,
      prompt: question,
      maxTokens: 500,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
