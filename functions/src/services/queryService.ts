import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingService } from './embeddingService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface QueryParams {
  userId: string;
  documentId: string;
  question: string;
}

interface SummarizeParams {
  userId: string;
  documentId: string;
}

export class QueryService {
  private db = admin.firestore();
  private embeddingService = new EmbeddingService();

  async answerQuestion(params: QueryParams) {
    const { userId, documentId, question } = params;

    // Verify document ownership
    const docRef = this.db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new Error('Document not found or unauthorized');
    }

    // Get question embedding
    const questionEmbedding = await this.embeddingService.getEmbedding(question);

    // Retrieve relevant chunks using vector search
    const chunksSnapshot = await docRef.collection('chunks').get();
    
    const relevantChunks = chunksSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        similarity: this.cosineSimilarity(
          questionEmbedding,
          doc.data().embedding || []
        )
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8); // Top-8 chunks

    if (relevantChunks.length === 0) {
      return {
        answer: 'The uploaded document does not contain information relevant to your question.',
        sources: []
      };
    }

    // Generate answer using Gemini
    const contextText = relevantChunks
      .map((c, idx) => `[Chunk ${idx + 1}]: ${c.text}`)
      .join('\n\n---\n\n');

    const prompt = `You are a helpful document assistant. Answer the user's question ONLY using the provided context. If the answer is not in the context, say "This information is not available in the document." Do not use external knowledge.

Context:
${contextText}

User Question: ${question}

Answer:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // Update query count
    await docRef.update({
      queryCount: admin.firestore.FieldValue.increment(1)
    });

    return {
      answer,
      sources: relevantChunks.map((c, idx) => `Chunk ${idx + 1}`)
    };
  }

  async summarizeDocument(params: SummarizeParams) {
    const { userId, documentId } = params;

    // Verify document ownership
    const docRef = this.db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new Error('Document not found or unauthorized');
    }

    // Get first few chunks for summary
    const chunksSnapshot = await docRef.collection('chunks')
      .orderBy('index')
      .limit(10)
      .get();

    const contextText = chunksSnapshot.docs
      .map((c, idx) => `[Chunk ${idx + 1}]: ${c.data().text}`)
      .join('\n\n---\n\n');

    const prompt = `Provide a comprehensive summary of the document based on the provided context segments. Identify key themes, main points, and important details.

Context:
${contextText}

Summary:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return { summary };
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length === 0 || v2.length === 0) return 0;
    
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;

    for (let i = 0; i < Math.min(v1.length, v2.length); i++) {
      dotProduct += v1[i] * v2[i];
      mA += v1[i] * v1[i];
      mB += v2[i] * v2[i];
    }

    return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
  }
}
