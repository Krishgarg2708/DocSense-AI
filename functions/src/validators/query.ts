import { Request, Response, NextFunction } from 'express';

export const validateQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { documentId, question } = req.body;

  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Invalid documentId' });
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid question' });
  }

  if (question.length > 5000) {
    return res.status(400).json({ error: 'Question too long' });
  }

  next();
};
