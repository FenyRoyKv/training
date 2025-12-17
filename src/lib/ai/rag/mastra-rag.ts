/**
 * ============================================================
 * MASTRA RAG PIPELINE
 * ============================================================
 *
 * Main RAG (Retrieval Augmented Generation) pipeline using:
 * - MDocument from @mastra/rag for document processing
 * - Qdrant for vector storage (via vector-store.ts)
 * - Custom embeddings (via embeddings.ts)
 * - Vercel AI SDK for LLM generation
 *
 * Pipeline Steps:
 * 1. [Indexing] Load PDF → Chunk → Embed → Store in Qdrant
 * 2. [Query] Embed question → Retrieve → Generate answer
 */

import { MDocument } from "@mastra/rag";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import fs from "fs";
import path from "path";
// @ts-expect-error - pdf-parse doesn't have types
import pdf from "pdf-parse";

import { embed, embedMany, EMBEDDING_DIMENSION } from "./embeddings";
import {
  ensureCollection,
  upsertVectors,
  queryVectors,
  COLLECTION_NAME,
} from "./vector-store";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface RagStep {
  step: number;
  name: string;
  description: string;
  data: unknown;
  timestamp: number;
}

export interface MastraRagResult {
  answer: string;
  steps: RagStep[];
  totalChunks: number;
}

// ─────────────────────────────────────────────────────────────
// Indexing State (global for hot-reload persistence)
// ─────────────────────────────────────────────────────────────

declare global {
  var ragIndexed: boolean | undefined;
  var ragIndexedCount: number | undefined;
}

function setIndexed(value: boolean, count: number) {
  globalThis.ragIndexed = value;
  globalThis.ragIndexedCount = count;
}

function getIndexedState() {
  return {
    isIndexed: globalThis.ragIndexed ?? false,
    indexedCount: globalThis.ragIndexedCount ?? 0,
  };
}

export function getIndexStatus(): { isIndexed: boolean; chunksCount: number } {
  const state = getIndexedState();
  return { isIndexed: state.isIndexed, chunksCount: state.indexedCount };
}

// ─────────────────────────────────────────────────────────────
// LLM Configuration
// ─────────────────────────────────────────────────────────────

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────────────────────────────
// INDEXING PIPELINE
// ─────────────────────────────────────────────────────────────

/**
 * Index documents using Mastra's MDocument for chunking
 */
export async function indexWithMastra(): Promise<{
  success: boolean;
  chunksIndexed: number;
  steps: RagStep[];
}> {
  const steps: RagStep[] = [];
  const startTime = Date.now();

  console.log("\n" + "═".repeat(60));
  console.log("🚀 MASTRA RAG INDEXER - Starting");
  console.log("═".repeat(60));

  try {
    // Step 1: Load PDF
    console.log("\n[Step 1] 📄 Loading PDF document...");
    const pdfPath = path.join(process.cwd(), "src/docs/leave_wfh_policy.pdf");
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);

    steps.push({
      step: 1,
      name: "Load PDF",
      description: "Reading PDF file and extracting text",
      data: {
        file: "leave_wfh_policy.pdf",
        textLength: pdfData.text.length,
        pages: pdfData.numpages,
      },
      timestamp: Date.now() - startTime,
    });

    console.log(
      `[Step 1] ✅ Extracted ${pdfData.text.length} chars from ${pdfData.numpages} pages`
    );

    // Step 2: Create MDocument
    console.log("\n[Step 2] 📋 Creating Mastra MDocument...");
    const doc = MDocument.fromText(pdfData.text, {
      source: "leave_wfh_policy.pdf",
      type: "pdf",
    });

    steps.push({
      step: 2,
      name: "Create MDocument",
      description: "Mastra MDocument wrapper for document processing",
      data: {
        documentType: "MDocument.fromText()",
        metadata: { source: "leave_wfh_policy.pdf", type: "pdf" },
      },
      timestamp: Date.now() - startTime,
    });

    console.log(`[Step 2] ✅ MDocument created`);

    // Step 3: Semantic Chunking
    console.log("\n[Step 3] 🔪 Semantic chunking with MDocument.chunk()...");
    console.log(`[Step 3] 📊 Document text length: ${pdfData.text.length} characters`);

    const chunkTexts = await chunkDocument(doc, pdfData.text);

    steps.push({
      step: 3,
      name: "Semantic Chunking",
      description: "MDocument.chunk() with recursive strategy + fallback",
      data: {
        strategy: "recursive (with manual fallback)",
        maxSize: 200,
        overlap: 30,
        finalChunks: chunkTexts.length,
        sampleChunks: chunkTexts.slice(0, 3).map((text, i) => ({
          index: i,
          length: text.length,
          preview: text.slice(0, 100) + "...",
        })),
      },
      timestamp: Date.now() - startTime,
    });

    console.log(`[Step 3] ✅ Created ${chunkTexts.length} semantic chunks`);

    // Step 4: Generate Embeddings
    console.log("\n[Step 4] 🔢 Generating embeddings...");
    const embeddings = embedMany(chunkTexts);

    steps.push({
      step: 4,
      name: "Generate Embeddings",
      description: "Converting text chunks to vectors",
      data: {
        method: "Character trigram + word hashing",
        dimensions: EMBEDDING_DIMENSION,
        embeddingsGenerated: embeddings.length,
      },
      timestamp: Date.now() - startTime,
    });

    console.log(
      `[Step 4] ✅ Generated ${embeddings.length} embeddings (${EMBEDDING_DIMENSION}D)`
    );

    // Step 5: Store in Qdrant
    console.log("\n[Step 5] 🗄️ Storing in Qdrant...");
    await ensureCollection();

    const metadata = chunkTexts.map((text, index) => ({
      text,
      chunkIndex: index,
      source: "leave_wfh_policy.pdf",
    }));

    await upsertVectors(embeddings, metadata);

    steps.push({
      step: 5,
      name: "Store in Qdrant",
      description: "Upserting vectors via @mastra/qdrant",
      data: {
        vectorStore: "@mastra/qdrant (QdrantVector)",
        indexName: COLLECTION_NAME,
        vectorsUpserted: embeddings.length,
        dimension: EMBEDDING_DIMENSION,
        metric: "cosine",
      },
      timestamp: Date.now() - startTime,
    });

    console.log(`[Step 5] ✅ Upserted ${embeddings.length} vectors to Qdrant`);

    setIndexed(true, chunkTexts.length);

    console.log("\n" + "═".repeat(60));
    console.log(
      `✅ INDEXING COMPLETE - ${chunkTexts.length} chunks in ${Date.now() - startTime}ms`
    );
    console.log("═".repeat(60) + "\n");

    return { success: true, chunksIndexed: chunkTexts.length, steps };
  } catch (error) {
    console.error("❌ Indexing failed:", error);
    return { success: false, chunksIndexed: 0, steps };
  }
}

/**
 * Chunk document using MDocument with fallback to manual splitting
 */
async function chunkDocument(doc: MDocument, rawText: string): Promise<string[]> {
  // Try MDocument.chunk() first
  const chunks = await doc.chunk({
    strategy: "recursive",
    maxSize: 200,
    overlap: 30,
  });

  let chunkTexts = chunks.map((c) => c.text);
  console.log(`[Step 3] 📊 MDocument.chunk() returned ${chunks.length} chunks`);

  // Fallback to manual splitting if MDocument returns too few chunks
  if (chunkTexts.length <= 1 && rawText.length > 300) {
    console.log("[Step 3] ⚠️ MDocument returned few chunks, using manual splitting...");
    chunkTexts = manualChunk(rawText);
    console.log(`[Step 3] ✅ Manual splitting created ${chunkTexts.length} chunks`);
  }

  return chunkTexts;
}

/**
 * Manual chunking fallback - splits by paragraphs and sentences
 */
function manualChunk(text: string): string[] {
  // Split by paragraphs (double newlines)
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter((p: string) => p.length > 20);

  // Split long paragraphs by sentences
  const allSegments: string[] = [];
  for (const para of paragraphs) {
    if (para.length > 300) {
      const sentences = para.split(/(?<=[.!?])\s+/);
      let segment = "";
      for (const sentence of sentences) {
        if (segment.length + sentence.length > 250 && segment.length > 50) {
          allSegments.push(segment.trim());
          segment = sentence;
        } else {
          segment += (segment ? " " : "") + sentence;
        }
      }
      if (segment.trim().length > 30) {
        allSegments.push(segment.trim());
      }
    } else if (para.length > 30) {
      allSegments.push(para);
    }
  }

  // Combine very small segments with overlap
  const finalChunks: string[] = [];
  let currentChunk = "";

  for (const segment of allSegments) {
    if (currentChunk.length + segment.length > 300 && currentChunk.length > 80) {
      finalChunks.push(currentChunk.trim());
      const overlap = currentChunk.slice(-50).trim();
      currentChunk = overlap + " " + segment;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + segment;
    }
  }

  if (currentChunk.trim().length > 30) {
    finalChunks.push(currentChunk.trim());
  }

  return finalChunks;
}

// ─────────────────────────────────────────────────────────────
// QUERY PIPELINE - WITH RAG
// ─────────────────────────────────────────────────────────────

/**
 * Query with Mastra RAG (retrieval + generation)
 */
export async function queryMastraWithRagDetailed(
  question: string
): Promise<MastraRagResult> {
  const steps: RagStep[] = [];
  const startTime = Date.now();
  const indexState = getIndexedState();

  // Step 1: User Question
  steps.push({
    step: 1,
    name: "User Question",
    description: "The question received from the user",
    data: { question },
    timestamp: Date.now() - startTime,
  });

  // Step 2: Index Status
  steps.push({
    step: 2,
    name: "Index Status",
    description: "Documents pre-indexed at server startup via Mastra",
    data: {
      isIndexed: indexState.isIndexed,
      chunksIndexed: indexState.indexedCount,
      vectorStore: "@mastra/qdrant",
      note: "Semantic chunking done via MDocument.chunk()",
    },
    timestamp: Date.now() - startTime,
  });

  // Step 3: Query Embedding
  const queryVector = embed(question);
  steps.push({
    step: 3,
    name: "Query Embedding",
    description: "Converting question to vector",
    data: {
      dimensions: queryVector.length,
      method: "Same embedding function as indexing",
      nonZeroValues: queryVector.filter((v) => v !== 0).length,
    },
    timestamp: Date.now() - startTime,
  });

  // Step 4: Qdrant Retrieval
  const searchResults = await queryVectors(queryVector, 5);

  steps.push({
    step: 4,
    name: "Qdrant Retrieval",
    description: "Searching via @mastra/qdrant QdrantVector.query()",
    data: {
      method: "QdrantVector.query()",
      topK: 5,
      resultsFound: searchResults.length,
      results: searchResults.map((r, idx) => ({
        rank: idx + 1,
        score: ((r.score ?? 0) * 100).toFixed(1) + "%",
        preview: (r.metadata?.text as string)?.slice(0, 80) + "...",
      })),
    },
    timestamp: Date.now() - startTime,
  });

  // Step 5: Retrieved Documents
  const sources = searchResults.map((r, idx) => ({
    rank: idx + 1,
    score: r.score ?? 0,
    content: r.metadata?.text as string,
  }));

  steps.push({
    step: 5,
    name: "Retrieved Chunks",
    description: "Top matching chunks from Qdrant",
    data: {
      count: sources.length,
      chunks: sources.map((s) => ({
        rank: s.rank,
        score: (s.score * 100).toFixed(1) + "%",
        preview: s.content?.slice(0, 100) + "...",
      })),
    },
    timestamp: Date.now() - startTime,
  });

  // Step 6: Build Prompt
  const context = sources.map((s, idx) => `[${idx + 1}] ${s.content}`).join("\n\n---\n\n");

  const systemPrompt = `You are an HR assistant for KeyValue Software Systems Pvt Ltd.
Answer questions based on the retrieved policy information.
Be specific and cite relevant sections. If info is missing, say so.`;

  const userPrompt = `Retrieved Policy Information:
${context}

Question: ${question}

Answer:`;

  steps.push({
    step: 6,
    name: "Prompt Construction",
    description: "Building prompts with retrieved context",
    data: {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      contextLength: context.length,
    },
    timestamp: Date.now() - startTime,
  });

  // Step 7: LLM Generation
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
    maxTokens: 800,
  });

  steps.push({
    step: 7,
    name: "LLM Generation",
    description: "Generating response via Vercel AI SDK → Groq",
    data: {
      provider: "Vercel AI SDK",
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      answerLength: text.length,
    },
    timestamp: Date.now() - startTime,
  });

  // Step 8: Final Answer
  steps.push({
    step: 8,
    name: "Final Answer",
    description: "Grounded response based on Mastra RAG retrieval",
    data: { answer: text },
    timestamp: Date.now() - startTime,
  });

  return { answer: text, steps, totalChunks: indexState.indexedCount };
}

// ─────────────────────────────────────────────────────────────
// QUERY PIPELINE - WITHOUT RAG
// ─────────────────────────────────────────────────────────────

/**
 * Query WITHOUT RAG (direct LLM call)
 */
export async function queryMastraWithoutRagDetailed(
  question: string
): Promise<MastraRagResult> {
  const steps: RagStep[] = [];
  const startTime = Date.now();

  steps.push({
    step: 1,
    name: "User Question",
    description: "The question received from the user",
    data: { question },
    timestamp: Date.now() - startTime,
  });

  steps.push({
    step: 2,
    name: "No RAG - Skip Retrieval",
    description: "Not using Mastra RAG pipeline",
    data: {
      message: "Qdrant NOT queried",
      warning: "LLM has no company-specific context",
    },
    timestamp: Date.now() - startTime,
  });

  const systemPrompt = `You are an HR assistant. Answer the following question about company policies.
Note: You don't have access to the specific company policy documents.`;

  steps.push({
    step: 3,
    name: "Prompt (No Context)",
    description: "Simple prompt without retrieved documents",
    data: { systemPrompt, userPrompt: question },
    timestamp: Date.now() - startTime,
  });

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    prompt: question,
    temperature: 0.3,
    maxTokens: 800,
  });

  steps.push({
    step: 4,
    name: "LLM Generation",
    description: "LLM responds without RAG context",
    data: { model: "llama-3.3-70b-versatile" },
    timestamp: Date.now() - startTime,
  });

  steps.push({
    step: 5,
    name: "Final Answer",
    description: "Response may not reflect actual company policies",
    data: { answer: text, warning: "Not grounded in company documents" },
    timestamp: Date.now() - startTime,
  });

  return { answer: text, steps, totalChunks: 0 };
}
