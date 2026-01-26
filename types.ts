
export interface DocumentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  userId: string;
}

export interface TextChunk {
  id: string;
  docId: string;
  text: string;
  embedding?: number[];
  index: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: number;
}

export interface SearchResult {
  chunk: TextChunk;
  score: number;
}
