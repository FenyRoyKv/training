import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/ai/rate-limiter";
import { runAgent, getRegisteredTools } from "@/lib/ai/agno-agent";

/**
 * ============================================================
 * AGNO-STYLE AI AGENT WITH TOOL DISCOVERY
 * ============================================================
 *
 * This agent discovers its tools at runtime instead of having
 * them hardcoded in the system prompt.
 *
 * Flow:
 * 1. Agent receives user message
 * 2. Agent calls discover_tools to see available capabilities
 * 3. Agent uses discovered tools to complete the task
 * 4. Agent provides final response
 *
 * Benefits:
 * - Dynamic tool registration
 * - Smaller system prompt
 * - More flexible architecture
 */

// GET: List all registered tools (for debugging/UI)
export async function GET() {
  const tools = getRegisteredTools();

  return NextResponse.json({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
    count: tools.length,
  });
}

// POST: Run the agent
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

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const agentResponse = await runAgent(message, userId, conversationHistory);

    return NextResponse.json(
      {
        steps: agentResponse.steps,
        response: agentResponse.finalResponse,
        iterations: agentResponse.iterations,
        toolsDiscovered: agentResponse.toolsDiscovered,
      },
      { headers: getRateLimitHeaders(userId) }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: "Agent failed to process request" },
      { status: 500 }
    );
  }
}
