import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/ai/rate-limiter";
import { runLangChainAgent } from "@/lib/ai/langchain/agent";

/**
 * ============================================================
 * LANGCHAIN.JS AGENT ENDPOINT
 * ============================================================
 *
 * This endpoint uses LangChain.js - a real framework that provides:
 * - Built-in agent executors
 * - Tool calling abstractions
 * - Memory management
 * - Multi-step reasoning
 *
 * Compare this to our custom implementation in agno-agent.ts
 * to see what frameworks abstract away.
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimit.resetIn },
        { status: 429, headers: getRateLimitHeaders(userId) }
      );
    }

    const { message, chatHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Run the LangChain agent
    const result = await runLangChainAgent(message, userId, chatHistory);

    return NextResponse.json(
      {
        response: result.output,
        steps: result.steps,
        iterations: result.iterations,
      },
      { headers: getRateLimitHeaders(userId) }
    );
  } catch (error) {
    console.error("LangChain agent error:", error);
    return NextResponse.json(
      { error: "Agent failed to process request" },
      { status: 500 }
    );
  }
}

