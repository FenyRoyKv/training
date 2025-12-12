import { NextRequest } from "next/server";
import groq, { GROQ_MODELS } from "@/lib/ai/groq-client";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { auth } from "@/lib/auth";
import { getTodoContext } from "@/lib/ai/todo-context";

/**
 * ============================================================
 * STREAMING RESPONSES - Native Implementation
 * ============================================================
 * 
 * Demonstrates:
 * 1. Server-Sent Events (SSE) streaming
 * 2. Real-time token streaming from LLM
 * 3. Database-fetched context (scalable)
 * 
 * This is a low-level implementation showing how streaming works.
 * For production, consider using Vercel AI SDK (see vercel-sdk route).
 * 
 * OPENAI STREAMING ALTERNATIVE:
 * const stream = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [...],
 *   stream: true,
 * });
 * for await (const chunk of stream) {
 *   const content = chunk.choices[0]?.delta?.content;
 *   // Send to client
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
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
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: rateLimit.resetIn }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ SCALABLE: Fetch todo context from database
    const todoContext = await getTodoContext(userId);

    // Build system prompt with database context
    const systemPrompt = `You are a helpful assistant for TaskFlow todo app.

User's todos from database:
${todoContext}

Provide helpful, concise responses. Reference specific tasks when relevant.`;

    // Create streaming response from Groq
    const stream = await groq.chat.completions.create({
      model: GROQ_MODELS.LLAMA_70B,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true, // Enable streaming
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Iterate over the stream chunks
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              // Send as Server-Sent Event format
              const data = JSON.stringify({ content, done: false });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Check for finish reason
            if (chunk.choices[0]?.finish_reason === "stop") {
              const doneData = JSON.stringify({ content: "", done: true });
              controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({ error: "Stream interrupted", done: true });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return streaming response with appropriate headers
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming API error:", error);
    return new Response(JSON.stringify({ error: "Failed to start stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
