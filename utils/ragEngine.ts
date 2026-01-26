
import { TextChunk, SearchResult } from "../types";
import { RAG_CONFIG } from "../constants";

/**
 * Splits text into overlapping chunks for indexing.
 */
export function chunkText(text: string, docId: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  const size = RAG_CONFIG.CHUNK_SIZE;
  const overlap = RAG_CONFIG.CHUNK_OVERLAP;
  
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const chunkContent = text.substring(start, end);
    
    chunks.push({
      id: `${docId}-chunk-${index}`,
      docId,
      text: chunkContent,
      index
    });

    start += (size - overlap);
    index++;
  }

  return chunks;
}

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    mA += v1[i] * v1[i];
    mB += v2[i] * v2[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

/**
 * Performs a vector search over indexed chunks.
 */
export function searchChunks(queryVector: number[], allChunks: TextChunk[]): SearchResult[] {
  const results = allChunks
    .filter(chunk => chunk.embedding)
    .map(chunk => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.embedding!)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RAG_CONFIG.TOP_K);

  return results;
}
