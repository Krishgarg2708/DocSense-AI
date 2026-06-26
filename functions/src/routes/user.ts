import { Router, Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

const router = Router();

// Get user profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      const userEmail = req.user?.email || 'unknown';
      const userData = {
        email: userEmail,
        createdAt: new Date().toISOString(),
        documentCount: 0
      };
      await db.collection('users').doc(userId).set(userData);
      return res.json(userData);
    }

    res.json(userDoc.data());
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = admin.firestore();
    const documentsSnapshot = await db.collection('documents')
      .where('userId', '==', userId)
      .get();

    const stats = {
      totalDocuments: documentsSnapshot.size,
      totalQueries: 0,
      storageUsed: 0
    };

    for (const doc of documentsSnapshot.docs) {
      const data = doc.data();
      stats.storageUsed += data.size || 0;
      stats.totalQueries += data.queryCount || 0;
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
