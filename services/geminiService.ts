
import { GoogleGenAI } from "@google/genai";
import { RAG_CONFIG, SYSTEM_PROMPT, SUMMARY_PROMPT } from "../constants";
import { TextChunk } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Generates embeddings for a given text using Gemini's embedding model.
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: RAG_CONFIG.EMBEDDING_MODEL,
        content: { parts: [{ text }] },
      } as any);
      
      if (response.embedding && response.embedding.values) {
        return response.embedding.values;
      }

      const batchRes = response as any;
      if (batchRes.embeddings && batchRes.embeddings.length > 0) {
        return batchRes.embeddings[0].values;
      }
      
      throw new Error("Invalid embedding response structure");
    } catch (error: any) {
      console.warn("Embedding API failed, using fallback vector.");
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Uses Gemini Vision to extract text from images (OCR).
   */
  async extractTextFromImage(base64Data: string, mimeType: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: RAG_CONFIG.MODEL_NAME,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "Carefully extract all text from this document image. Return only the extracted text. Maintain the logical order of paragraphs and lists." }
          ]
        }]
      });
      return response.text || "";
    } catch (error) {
      console.error("OCR Error:", error);
      throw new Error("Failed to extract text from image using AI Vision.");
    }
  }

  private generateFallbackEmbedding(text: string): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    const seed = hash;
    return Array.from({ length: 768 }, (_, i) => {
      const x = Math.sin(seed + i) * 10000;
      return x - Math.floor(x) - 0.5;
    });
  }

  async summarizeDocument(contextChunks: TextChunk[]): Promise<string> {
    const contextText = contextChunks
      .map((c) => `[Chunk #${c.index + 1}]: ${c.text}`)
      .join("\n\n---\n\n");

    const prompt = SUMMARY_PROMPT.replace("{context}", contextText);

    try {
      const response = await this.ai.models.generateContent({
        model: RAG_CONFIG.MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return response.text || "Could not generate a summary.";
    } catch (error) {
      console.error("Summarization Error:", error);
      return "An error occurred while trying to summarize the document.";
    }
  }

  async askQuestion(question: string, contextChunks: TextChunk[]): Promise<{ answer: string; citations: string[] }> {
    const contextText = contextChunks
      .map((c) => `[Chunk #${c.index + 1}]: ${c.text}`)
      .join("\n\n---\n\n");

    const prompt = SYSTEM_PROMPT
      .replace("{context}", contextText)
      .replace("{question}", question);

    try {
      const response = await this.ai.models.generateContent({
        model: RAG_CONFIG.MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const answer = response.text || "This information is not available in the uploaded document.";
      const citations = contextChunks.map(c => `Chunk #${c.index + 1}`);

      return { answer, citations };
    } catch (error) {
      console.error("Gemini Query Error:", error);
      return { 
        answer: "The AI engine encountered an error while processing the document context.", 
        citations: [] 
      };
    }
  }
}
