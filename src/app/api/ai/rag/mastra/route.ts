import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/ai/rate-limiter";
import {
  queryMastraWithRagDetailed,
  queryMastraWithoutRagDetailed,
  getIndexStatus,
} from "@/lib/ai/rag/mastra-rag";

/**
 * ============================================================
 * MASTRA RAG ENDPOINT
 * ============================================================
 *
 * Uses Mastra's RAG package:
 * - MDocument for document processing
 * - @mastra/qdrant for vector storage
 * - Step-by-step pipeline visualization
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

    const { question, useRag = true } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (useRag) {
      const result = await queryMastraWithRagDetailed(question);
      return NextResponse.json(
        {
          answer: result.answer,
          steps: result.steps,
          totalChunks: result.totalChunks,
          mode: "rag",
          framework: "mastra",
        },
        { headers: getRateLimitHeaders(userId) }
      );
    } else {
      const result = await queryMastraWithoutRagDetailed(question);
      return NextResponse.json(
        {
          answer: result.answer,
          steps: result.steps,
          totalChunks: 0,
          mode: "direct",
          framework: "mastra",
        },
        { headers: getRateLimitHeaders(userId) }
      );
    }
  } catch (error) {
    console.error("Mastra RAG error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "RAG query failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = getIndexStatus();
  return NextResponse.json({
    indexed: status.isIndexed,
    chunksCount: status.chunksCount,
    framework: "mastra",
    components: ["MDocument", "@mastra/qdrant", "Vercel AI SDK"],
  });
}
