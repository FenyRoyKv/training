import { NextRequest, NextResponse } from "next/server";
import groq, { GROQ_MODELS } from "@/lib/ai/groq-client";
import {
  checkRateLimit,
  trackTokenUsage,
  estimateTokens,
  getRateLimitHeaders,
} from "@/lib/ai/rate-limiter";
import { auth } from "@/lib/auth";
import { getTodoContext } from "@/lib/ai/todo-context";

/**
 * ============================================================
 * GROQ API - Basic Non-Streaming Example
 * ============================================================
 *
 * Demonstrates:
 * 1. Basic Groq API usage
 * 2. Rate limiting implementation
 * 3. Token tracking
 * 4. Database-fetched context (scalable approach)
 *
 * OPENAI ALTERNATIVE:
 * Replace groq.chat.completions.create with:
 *
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [...],
 * });
 */

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimit.resetIn,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(userId),
        }
      );
    }

    // Parse request body
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // ✅ SCALABLE: Fetch todo context directly from database
    // Instead of relying on client to pass context
    const todoContext = await getTodoContext(userId);

    // Estimate input tokens
    const inputTokens = estimateTokens(prompt + todoContext);

    // Check token budget
    const tokenCheck = trackTokenUsage(userId, inputTokens);
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        {
          error: "Daily token limit exceeded",
          usage: tokenCheck,
        },
        { status: 429 }
      );
    }

    // Build system prompt with database-fetched context
    const systemPrompt = `You are a helpful assistant for a todo application called TaskFlow. 
You help users manage their tasks, provide productivity tips, and answer questions about their todos.

Here is the user's current todo list from the database:
${todoContext}

Be concise and helpful. Reference specific tasks when relevant.`;

    // Make Groq API call
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.LLAMA_70B,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content || "";
    const outputTokens = estimateTokens(response);

    // Track output tokens
    trackTokenUsage(userId, outputTokens);

    return NextResponse.json(
      {
        response,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          model: GROQ_MODELS.LLAMA_70B,
        },
      },
      { headers: getRateLimitHeaders(userId) }
    );
  } catch (error) {
    console.error("Groq API error:", error);

    // Handle specific Groq errors
    if (error instanceof Error) {
      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          { error: "Groq API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
