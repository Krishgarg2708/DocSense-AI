import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class EmbeddingService {
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = genAI.getGenerativeModel({
        model: 'embedding-001'
      });

      const result = await model.embedContent(text);
      
      if (result.embedding && result.embedding.values) {
        return result.embedding.values;
      }

      throw new Error('Invalid embedding response');
    } catch (error) {
      console.error('Embedding error:', error);
      // Return fallback embedding
      return this.generateFallbackEmbedding(text);
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
}
