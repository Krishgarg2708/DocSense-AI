import { Router, Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { DocumentService } from '../services/documentService';
import { EmbeddingService } from '../services/embeddingService';
import { validateDocumentUpload } from '../validators/document';

const router = Router();
const documentService = new DocumentService();
const embeddingService = new EmbeddingService();

// Upload a document
router.post('/upload', validateDocumentUpload, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { fileName, fileContent, fileType } = req.body;

    // Process the document
    const docId = await documentService.processAndStoreDocument({
      userId,
      fileName,
      fileContent,
      fileType,
      uploadDate: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      documentId: docId,
      message: 'Document uploaded and indexed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get user's documents
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const docs = await documentService.getUserDocuments(userId);
    res.json({ documents: docs });
  } catch (error) {
    next(error);
  }
});

// Get document details
router.get('/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { documentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const doc = await documentService.getDocumentDetails(userId, documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(doc);
  } catch (error) {
    next(error);
  }
});

// Delete a document
router.delete('/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    const { documentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await documentService.deleteDocument(userId, documentId);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as documentIngestionRouter };
