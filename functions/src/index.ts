import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { documentIngestionRouter } from './routes/documentIngestion';
import { queryRouter } from './routes/query';
import { userRouter } from './routes/user';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/documents', authMiddleware, documentIngestionRouter);
app.use('/api/query', authMiddleware, queryRouter);
app.use('/api/users', authMiddleware, userRouter);

// Error handling
app.use(errorHandler);

// Export the Express API as a Cloud Function
export const api = functions
  .region('asia-south1')
  .https.onRequest(app);

// Scheduled cleanup function (run daily)
export const cleanupExpiredSessions = functions
  .region('asia-south1')
  .pubsub.schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const snapshot = await db.collection('documents')
      .where('uploadDate', '<', thirtyDaysAgo)
      .get();
    
    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      await db.collection('documents').doc(doc.id).delete();
      deletedCount++;
    }
    
    console.log(`Cleanup: Deleted ${deletedCount} old documents`);
  });
