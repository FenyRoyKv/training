/**
 * ============================================================
 * VECTOR STORE - Qdrant Integration
 * ============================================================
 *
 * Handles all Qdrant vector database operations using @mastra/qdrant.
 *
 * Operations:
 * - Initialize Qdrant client
 * - Create/ensure collection exists
 * - Upsert vectors with metadata
 * - Query for similar vectors
 */

import { QdrantVector } from "@mastra/qdrant";
import { EMBEDDING_DIMENSION } from "./embeddings";

// Collection configuration
export const COLLECTION_NAME = "policy_documents";

// Singleton Qdrant client
let qdrantClient: QdrantVector | null = null;

/**
 * Get or create Qdrant client instance
 */
export function getQdrantClient(): QdrantVector {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;

    if (!url || !apiKey) {
      throw new Error("QDRANT_URL and QDRANT_API_KEY must be set in environment");
    }

    qdrantClient = new QdrantVector({ url, apiKey });
  }
  return qdrantClient;
}

/**
 * Ensure collection exists, create if not
 */
export async function ensureCollection(): Promise<void> {
  const qdrant = getQdrantClient();
  try {
    await qdrant.createIndex({
      indexName: COLLECTION_NAME,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
    });
  } catch {
    // Collection may already exist, continue
  }
}

/**
 * Upsert vectors with metadata to Qdrant
 */
export async function upsertVectors(
  vectors: number[][],
  metadata: Array<{ text: string; chunkIndex: number; source: string }>
): Promise<void> {
  const qdrant = getQdrantClient();
  await qdrant.upsert({
    indexName: COLLECTION_NAME,
    vectors,
    metadata,
  });
}

/**
 * Query Qdrant for similar vectors
 */
export async function queryVectors(
  queryVector: number[],
  topK: number = 5
): Promise<Array<{ score?: number; metadata?: Record<string, unknown> }>> {
  const qdrant = getQdrantClient();
  return await qdrant.query({
    indexName: COLLECTION_NAME,
    queryVector,
    topK,
  });
}
