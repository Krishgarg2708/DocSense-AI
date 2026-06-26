import { Request, Response, NextFunction } from 'express';

export const validateDocumentUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fileName, fileContent, fileType } = req.body;

  if (!fileName || typeof fileName !== 'string') {
    return res.status(400).json({ error: 'Invalid fileName' });
  }

  if (!fileContent || typeof fileContent !== 'string') {
    return res.status(400).json({ error: 'Invalid fileContent' });
  }

  if (!fileType || typeof fileType !== 'string') {
    return res.status(400).json({ error: 'Invalid fileType' });
  }

  const maxFileSize = 100 * 1024 * 1024; // 100MB
  if (fileContent.length > maxFileSize) {
    return res.status(413).json({ error: 'File size exceeds limit' });
  }

  next();
};
