import { Router, Request, Response, NextFunction } from 'express';
import { QueryService } from '../services/queryService';
import { validateQuery } from '../validators/query';

const router = Router();
const queryService = new QueryService();

// Ask a question about documents
router.post('/ask', validateQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { documentId, question } = req.body;

    const result = await queryService.answerQuestion({
      userId,
      documentId,
      question
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Summarize a document
router.post('/summarize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { documentId } = req.body;

    const summary = await queryService.summarizeDocument({
      userId,
      documentId
    });

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export { router as queryRouter };
