# DocuMind Backend Setup Guide

## Overview
This document describes the complete backend infrastructure for DocuMind RAG Assistant built with Firebase and Google Cloud Functions.

## Architecture

### Services
1. **DocumentService** - Handles document upload, extraction, and indexing
2. **EmbeddingService** - Generates vector embeddings using Gemini
3. **QueryService** - Performs vector search and generates answers
4. **TextExtractionService** - Extracts text from various file formats
5. **ChunkingService** - Splits documents into overlapping chunks

### Database Schema

```
Firestore
├── users/{userId}
│   ├── email
│   ├── createdAt
│   └── documentCount
│
├── documents/{documentId}
│   ├── userId
│   ├── fileName
│   ├── fileType
│   ├── uploadDate
│   ├── size
│   ├── chunkCount
│   ├── queryCount
│   └── chunks/{chunkId}
│       ├── text
│       ├── embedding (vector)
│       ├── index
│       └── createdAt
```

## API Endpoints

### Document Management

#### Upload Document
```
POST /api/documents/upload
Authorization: Bearer {token}

Request:
{
  "fileName": "document.pdf",
  "fileContent": "base64_encoded_content",
  "fileType": "application/pdf"
}

Response:
{
  "success": true,
  "documentId": "doc_123",
  "message": "Document uploaded and indexed successfully"
}
```

#### Get User Documents
```
GET /api/documents
Authorization: Bearer {token}

Response:
{
  "documents": [
    {
      "id": "doc_123",
      "fileName": "document.pdf",
      "uploadDate": "2024-01-15",
      "chunkCount": 42,
      "queryCount": 5
    }
  ]
}
```

#### Get Document Details
```
GET /api/documents/{documentId}
Authorization: Bearer {token}

Response:
{
  "id": "doc_123",
  "fileName": "document.pdf",
  "uploadDate": "2024-01-15",
  "chunkCount": 42,
  "queryCount": 5
}
```

#### Delete Document
```
DELETE /api/documents/{documentId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Query & Answering

#### Ask Question
```
POST /api/query/ask
Authorization: Bearer {token}

Request:
{
  "documentId": "doc_123",
  "question": "What is the main topic?"
}

Response:
{
  "answer": "The document discusses...",
  "sources": ["Chunk 1", "Chunk 3", "Chunk 5"]
}
```

#### Summarize Document
```
POST /api/query/summarize
Authorization: Bearer {token}

Request:
{
  "documentId": "doc_123"
}

Response:
{
  "summary": "This document covers..."
}
```

### User Management

#### Get User Profile
```
GET /api/users/profile
Authorization: Bearer {token}

Response:
{
  "email": "user@example.com",
  "createdAt": "2024-01-01",
  "documentCount": 5
}
```

#### Get User Statistics
```
GET /api/users/stats
Authorization: Bearer {token}

Response:
{
  "totalDocuments": 5,
  "totalQueries": 23,
  "storageUsed": 15728640
}
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Firebase CLI
- Google Cloud Account
- Gemini API Key

### Step 1: Initialize Firebase Project
```bash
firebase login
firebase init
```

### Step 2: Install Dependencies
```bash
cd functions
npm install
cd ..
```

### Step 3: Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Step 4: Build Cloud Functions
```bash
cd functions
npm run build
cd ..
```

### Step 5: Deploy to Firebase
```bash
firebase deploy
```

### Step 6: Run Locally (Optional)
```bash
firebase emulators:start
```

## Environment Variables

```env
# Firebase
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx

# Gemini AI
GEMINI_API_KEY=xxx
```

## Security Features

1. **Authentication**: Firebase Authentication with ID tokens
2. **Authorization**: Firestore rules enforce user-level data isolation
3. **Validation**: Input validation on all API endpoints
4. **Rate Limiting**: Cloud Functions built-in scaling
5. **Encryption**: Firebase handles encryption at rest and in transit
6. **Storage Rules**: User-specific access to file storage

## Performance Optimization

1. **Chunking**: Documents split into 1000-char chunks with 200-char overlap
2. **Vector Search**: Cosine similarity for fast semantic matching
3. **Batch Processing**: Parallel embedding generation
4. **Caching**: Firestore indexes for common queries
5. **Cleanup**: Automatic deletion of old documents (30 days)

## Monitoring & Logging

```bash
# View Cloud Function logs
firebase functions:log

# View in Firebase Console
# Navigate to: Console > Functions > Logs
```

## Deployment Checklist

- [ ] Firebase project created
- [ ] Gemini API enabled
- [ ] Environment variables configured
- [ ] Cloud Functions built successfully
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Cloud Function deployed
- [ ] API tested with sample requests
- [ ] Frontend connected to backend

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check token validity
   - Verify Firebase authentication is configured

2. **Document not found**
   - Verify document ID
   - Check user authorization
   - Ensure document exists in Firestore

3. **Embedding API errors**
   - Check Gemini API key
   - Verify API is enabled in Google Cloud Console
   - Check rate limits

4. **Firestore quota exceeded**
   - Upgrade Firebase plan
   - Implement caching
   - Optimize query patterns

## Future Enhancements

1. Advanced analytics dashboard
2. Multi-language support
3. Custom embedding models
4. Advanced caching strategies
5. Webhook integrations
6. Batch processing for large documents
7. Real-time collaboration
8. Export functionality
