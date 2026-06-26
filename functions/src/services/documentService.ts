import * as admin from 'firebase-admin';
import { EmbeddingService } from './embeddingService';
import { TextExtractionService } from './textExtractionService';
import { ChunkingService } from './chunkingService';

interface DocumentUploadParams {
  userId: string;
  fileName: string;
  fileContent: string;
  fileType: string;
  uploadDate: string;
}

export class DocumentService {
  private db = admin.firestore();
  private storage = admin.storage();
  private embeddingService = new EmbeddingService();
  private textExtractionService = new TextExtractionService();
  private chunkingService = new ChunkingService();

  async processAndStoreDocument(params: DocumentUploadParams): Promise<string> {
    const { userId, fileName, fileContent, fileType, uploadDate } = params;

    // Extract text from the document
    const extractedText = await this.textExtractionService.extractText(
      fileContent,
      fileType
    );

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No readable text found in the document');
    }

    // Generate document ID
    const docId = admin.firestore().collection('documents').doc().id;

    // Chunk the text
    const chunks = this.chunkingService.chunkText(extractedText, docId);

    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk) => ({
        ...chunk,
        embedding: await this.embeddingService.getEmbedding(chunk.text)
      }))
    );

    // Store document metadata
    const documentRef = this.db.collection('documents').doc(docId);
    await documentRef.set({
      userId,
      fileName,
      fileType,
      uploadDate,
      size: fileContent.length,
      chunkCount: chunks.length,
      queryCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Store chunks with embeddings
    const batch = this.db.batch();
    for (const chunk of chunksWithEmbeddings) {
      const chunkRef = documentRef.collection('chunks').doc(chunk.id);
      batch.set(chunkRef, {
        text: chunk.text,
        embedding: chunk.embedding,
        index: chunk.index,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();

    return docId;
  }

  async getUserDocuments(userId: string) {
    const snapshot = await this.db.collection('documents')
      .where('userId', '==', userId)
      .orderBy('uploadDate', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getDocumentDetails(userId: string, documentId: string) {
    const docRef = this.db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const docRef = this.db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new Error('Document not found or unauthorized');
    }

    // Delete all chunks
    const chunksSnapshot = await docRef.collection('chunks').get();
    const batch = this.db.batch();
    for (const chunk of chunksSnapshot.docs) {
      batch.delete(chunk.ref);
    }
    batch.delete(docRef);
    await batch.commit();
  }
}
