import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/ai/rate-limiter";
import { mastra } from "@/lib/ai/mastra";

/**
 * ============================================================
 * MASTRA.AI CHAT ENDPOINT
 * ============================================================
 * 
 * This endpoint provides a conversational interface to the todo app
 * using Mastra's agent framework.
 * 
 * Features:
 * 1. Natural language todo management
 * 2. Task summarization and insights
 * 3. Multi-turn conversations
 * 4. Tool-augmented responses
 * 
 * Example conversations:
 * - "What's my task summary?"
 * - "Show me all high priority tasks"
 * - "Add a todo to call mom with high priority"
 * - "Mark the grocery shopping task as done"
 * - "What should I focus on today?"
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
        { error: "Rate limit exceeded", retryAfter: rateLimit.resetIn },
        { status: 429, headers: getRateLimitHeaders(userId) }
      );
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get the todo agent from Mastra
    const agent = mastra.getAgent("todoAgent");

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 500 });
    }

    // Prepare messages with user context
    const systemContext = `Current user ID: ${userId}. Always pass this userId when calling tools.`;

    const messages = [
      { role: "system" as const, content: systemContext },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Generate response using the agent (using generateLegacy for AI SDK v4 models)
    const response = await agent.generateLegacy(messages);

    return NextResponse.json(
      {
        response: response.text,
        toolCalls: response.toolCalls || [],
        usage: response.usage,
      },
      { headers: getRateLimitHeaders(userId) }
    );
  } catch (error) {
    console.error("Mastra chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

// GET endpoint for quick summaries
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "summary";

    const agent = mastra.getAgent("todoAgent");

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 500 });
    }

    let prompt: string;
    switch (action) {
      case "summary":
        prompt = `Give me a brief summary of my todos. User ID: ${userId}`;
        break;
      case "priorities":
        prompt = `What are my high priority pending tasks? User ID: ${userId}`;
        break;
      case "today":
        prompt = `What should I focus on today based on my todos? User ID: ${userId}`;
        break;
      default:
        prompt = `Give me a quick overview of my tasks. User ID: ${userId}`;
    }

    const response = await agent.generateLegacy([
      { role: "user" as const, content: prompt },
    ]);

    return NextResponse.json({
      action,
      response: response.text,
    });
  } catch (error) {
    console.error("Mastra summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
