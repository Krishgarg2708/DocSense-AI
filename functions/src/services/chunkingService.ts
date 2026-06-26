interface TextChunk {
  id: string;
  docId: string;
  text: string;
  index: number;
}

export class ChunkingService {
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;

  chunkText(text: string, docId: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);
      const chunkContent = text.substring(start, end);

      chunks.push({
        id: `${docId}-chunk-${index}`,
        docId,
        text: chunkContent,
        index
      });

      start += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
      index++;
    }

    return chunks;
  }
}
