import { indexWithMastra, getIndexStatus } from "./mastra-rag";

/**
 * ============================================================
 * MASTRA RAG INDEXER - RUNS AT SERVER STARTUP
 * ============================================================
 *
 * Uses Mastra's RAG capabilities:
 * - MDocument for document processing
 * - QdrantVector for vector storage
 *
 * Called once at server startup.
 */

/**
 * Initialize indexer - call at server startup
 */
export async function initializeIndexer(): Promise<void> {
  console.log("\n🚀 Initializing Mastra RAG indexer...");

  try {
    const result = await indexWithMastra();

    if (result.success) {
      console.log(`✅ Mastra RAG ready - ${result.chunksIndexed} chunks indexed`);
    } else {
      console.error("❌ Mastra RAG indexing failed");
    }
  } catch (error) {
    console.error("Failed to initialize Mastra RAG indexer:", error);
  }
}

// Re-export for convenience
export { getIndexStatus };
