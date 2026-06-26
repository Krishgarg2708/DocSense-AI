# Frontend-Backend Integration Guide

## Overview
This guide explains how to connect your React frontend to the Firebase backend.

## Step 1: Update Firebase Configuration

Update your frontend `.env.local` with:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=https://your-region-your-project.cloudfunctions.net/api
```

## Step 2: Create API Service

Create `src/services/apiService.ts`:

```typescript
import * as admin from 'firebase-admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export class APIService {
  private static async getToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.getIdToken();
  }

  static async uploadDocument(file: File, fileContent: string): Promise<string> {
    const token = await this.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileContent,
        fileType: file.type
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.documentId;
  }

  static async getDocuments(): Promise<any[]> {
    const token = await this.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.documents;
  }

  static async askQuestion(documentId: string, question: string): Promise<any> {
    const token = await this.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api/query/ask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId, question })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  }

  static async summarizeDocument(documentId: string): Promise<string> {
    const token = await this.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api/query/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data.summary;
  }

  static async deleteDocument(documentId: string): Promise<void> {
    const token = await this.getToken();
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
  }
}
```

## Step 3: Update GeminiService

Update your frontend `GeminiService` to use backend APIs:

```typescript
import { APIService } from './apiService';

export class GeminiService {
  async getEmbedding(text: string): Promise<number[]> {
    // This is now handled by the backend
    // The frontend sends raw text to backend which returns embeddings
    return Array(768).fill(0); // Placeholder
  }

  async askQuestion(question: string, chunks: TextChunk[]): Promise<{ answer: string; citations: string[] }> {
    // Now uses backend API
    const result = await APIService.askQuestion('docId', question);
    return {
      answer: result.answer,
      citations: result.sources
    };
  }

  async summarizeDocument(chunks: TextChunk[]): Promise<string> {
    const result = await APIService.summarizeDocument('docId');
    return result;
  }
}
```

## Step 4: Update App.tsx

Modify your App.tsx to use the new backend:

```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsProcessing(true);
  try {
    // Extract text based on file type
    let text = '';
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') {
      text = await extractPdfText(file);
    } else if (ext === 'docx') {
      text = await extractDocxText(file);
    } else {
      text = await file.text();
    }

    // Send to backend for processing
    const docId = await APIService.uploadDocument(file, text);
    
    const newDoc: DocumentMetadata = {
      id: docId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      userId: 'current-user'
    };
    
    setDocuments(prev => [...prev, newDoc]);
  } catch (error) {
    setError((error as Error).message);
  } finally {
    setIsProcessing(false);
  }
};
```

## Testing

1. **Local Development**
   ```bash
   firebase emulators:start
   npm run dev
   ```

2. **Test Upload**
   ```bash
   curl -X POST http://localhost:5001/api/documents/upload \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "fileName": "test.txt",
       "fileContent": "Sample text",
       "fileType": "text/plain"
     }'
   ```

3. **Test Query**
   ```bash
   curl -X POST http://localhost:5001/api/query/ask \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "documentId": "doc_id",
       "question": "What is this about?"
     }'
   ```

## Troubleshooting

1. **CORS Errors**: Enable CORS in Cloud Functions (already configured)
2. **401 Errors**: Verify Firebase authentication and token generation
3. **Network Errors**: Check API_BASE_URL environment variable
4. **Timeout Issues**: Increase function timeout in firebase.json
