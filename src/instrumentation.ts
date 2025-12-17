/**
 * ============================================================
 * NEXT.JS INSTRUMENTATION - SERVER STARTUP HOOK
 * ============================================================
 *
 * This file is automatically loaded by Next.js at server startup.
 * We use it to:
 * 1. Load and semantically chunk the policy PDF
 * 2. Generate embeddings for each chunk
 * 3. Index into Qdrant vector database
 *
 * This ensures documents are indexed ONCE at startup,
 * not on every RAG query.
 */

export async function register() {
  // Only run on server (not edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("\n" + "🌟".repeat(30));
    console.log("   NEXT.JS SERVER STARTING - Initializing RAG Pipeline");
    console.log("🌟".repeat(30) + "\n");

    try {
      // Dynamic import to avoid issues during build
      const { initializeIndexer } = await import("@/lib/ai/rag/indexer");
      await initializeIndexer();
    } catch (error) {
      console.error("❌ Failed to initialize RAG indexer:", error);
      // Don't throw - allow server to start even if indexing fails
    }
  }
}
