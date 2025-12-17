/**
 * ============================================================
 * EMBEDDINGS
 * ============================================================
 *
 * Simple embedding function for demonstration purposes.
 * Uses character trigrams + word hashing to create vectors.
 *
 * NOTE: In production, use OpenAI, Cohere, or other embedding APIs
 *       for better semantic understanding.
 */

export const EMBEDDING_DIMENSION = 256;

/**
 * Generate a simple embedding vector from text
 *
 * Technique:
 * 1. Character trigram hashing - captures character patterns
 * 2. Word hashing - captures word-level semantics
 * 3. L2 normalization - creates unit vectors for cosine similarity
 */
export function embed(text: string): number[] {
  const normalized = text.toLowerCase();
  const embedding = new Array(EMBEDDING_DIMENSION).fill(0);

  // Character trigram hashing
  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram = normalized.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < trigram.length; j++) {
      hash = (hash << 5) - hash + trigram.charCodeAt(j);
      hash = hash & hash;
    }
    embedding[Math.abs(hash) % EMBEDDING_DIMENSION] += 1;
  }

  // Word hashing (weighted higher for semantic importance)
  const words = normalized.split(/\s+/);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash = hash & hash;
    }
    embedding[Math.abs(hash) % EMBEDDING_DIMENSION] += 2;
  }

  // L2 normalization for cosine similarity
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Embed multiple texts at once
 */
export function embedMany(texts: string[]): number[][] {
  return texts.map((text) => embed(text));
}
