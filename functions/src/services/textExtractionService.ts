import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class TextExtractionService {
  async extractText(fileContent: string, fileType: string): Promise<string> {
    // For text-based formats, content is already extracted
    if (['text/plain', 'text/markdown', 'application/json'].includes(fileType)) {
      return fileContent;
    }

    // For binary formats, use Gemini Vision if it's an image
    if (['image/png', 'image/jpeg', 'image/webp'].includes(fileType)) {
      return await this.extractTextFromImage(fileContent);
    }

    // For other text-based content
    return fileContent;
  }

  private async extractTextFromImage(base64Content: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Content,
            mimeType: 'image/jpeg'
          }
        },
        'Extract all text from this document image. Maintain logical order and formatting.'
      ]);

      const text = result.response.text();
      return text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }
}
