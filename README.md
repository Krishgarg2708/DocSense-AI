<div align="center">

<h1>📘 DocuMind RAG Assistant</h1>

<p><strong>A document-centric AI assistant powered by Retrieval-Augmented Generation — grounded answers, zero hallucinations.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firestore-FF6F00?style=for-the-badge&logo=google-cloud&logoColor=white" />
</p>
<p>
  <img src="https://img.shields.io/badge/RAG-Architecture-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vector_Search-Enabled-informational?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" />
</p>

</div>

---

## Overview

DocuMind is a document-centric AI assistant built using **Retrieval-Augmented Generation (RAG)** that allows users to upload documents and ask questions **strictly grounded in the uploaded content**.

The system is designed to handle **large documents (100+ pages)** while preventing hallucinations by enforcing **context-only answers with explicit refusal** when information is not present.

This project focuses on **correctness, explainability, and real-world engineering** — not demo shortcuts.

---

## Why DocuMind?

Most "document Q&A" apps are **fake RAG systems** — they pass entire documents to the model, allow hallucinations, and silently use external knowledge.

**DocuMind avoids all of that by design.**

| Principle | Implementation |
|-----------|---------------|
| No hallucinations | Strict prompt guardrails with mandatory refusal |
| True retrieval | Embedding-based vector search, not keyword matching |
| Pipeline separation | Ingestion and query-time reasoning are fully decoupled |
| Correctness first | Explicit refusal when context is insufficient |

**Suitable for:** company policies, financial reports, research papers, legal and compliance documents.

---

## Features

- Upload documents in PDF, TXT, or DOCX format
- Ask natural language questions grounded strictly in document content
- Chunk-based retrieval designed for large files (100+ pages)
- Source-aware responses — always know where the answer came from
- Explicit refusal when information is not present in the document
- User authentication with per-user document isolation
- Backend-driven RAG pipeline with no frontend shortcuts

---

## System Architecture

```
User
├── Uploads Document
│   └── Firebase Storage
│       └── Cloud Function (Text Extraction)
│           └── Chunking + Embeddings
│               └── Firestore (Chunk Metadata)
│
└── Asks Question
    └── Embed Query
        └── Retrieve Top-K Chunks
            └── Gemini (Context-Only Answer)
                └── Answer + Source Reference
```

---

## Technology Stack

### Frontend
| Tech | Purpose |
|------|---------|
| Firebase Studio | Web UI — file upload and Q&A interface |

### Backend & Cloud
| Tech | Purpose |
|------|---------|
| Firebase Cloud Functions | Serverless backend logic |
| Firebase Storage | Document storage |
| Firestore | Chunk metadata and embeddings store |
| Firebase Authentication | User auth and document isolation |

### AI & ML
| Tech | Purpose |
|------|---------|
| Gemini API (Google AI Studio) | Context-only answer generation |
| Retrieval-Augmented Generation | Core pipeline architecture |
| Vector Similarity Search | Semantic chunk retrieval |

---

## RAG Workflow

### Document Ingestion
1. User uploads a file (PDF, TXT, or DOCX)
2. File is stored in Firebase Storage
3. A Cloud Function extracts raw text
4. Text is chunked with overlap for context continuity
5. Embeddings generated per chunk
6. Chunks stored in Firestore with metadata

### Question Answering
1. User submits a natural language question
2. Question is embedded using the same model
3. Top-K semantically relevant chunks are retrieved
4. Only retrieved chunks are passed to Gemini
5. Model answers **strictly from provided context**
6. If no relevant chunk found → explicit refusal returned

---

## Example Queries

### Valid Question
```
What happens if a reimbursement claim is submitted late?
```
→ Model answers from the relevant document chunk.

### Trap Question
```
What is the GST percentage reimbursed on fuel bills?
```

### Correct System Response
```
The uploaded document does not contain this information.
```
Any answer beyond this indicates a broken RAG pipeline.

---

## Safety & Guardrails

- Model is forbidden from using external knowledge
- No answer is generated without retrieved document chunks
- Explicit refusal on insufficient context — always
- User-level document isolation enforced via Firebase Authentication
- Safety logic is backend-enforced, not prompt-only

---

## Project Structure

```
DocuMind/
│
├── functions/            # Firebase Cloud Functions (ingestion + query pipeline)
│   ├── ingest.py         # Document upload, chunking, embedding
│   └── query.py          # Question embedding, retrieval, Gemini call
│
├── src/
│   ├── components/       # UI components (upload, Q&A interface)
│   ├── pages/            # Route-level pages
│   ├── services/         # Firebase service calls
│   ├── context/          # Auth and document context
│   └── utils/            # Chunking, embedding helpers
│
├── firestore.rules
├── package.json
└── README.md
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/DocuMind.git

# Navigate to the project
cd DocuMind

# Install dependencies
npm install
```

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
```

```bash
# Run the development server
npm run dev

# Deploy Cloud Functions
firebase deploy --only functions
```

---

## Contributing

Contributions are welcome. Fork the repository, open issues, and submit pull requests to help improve DocuMind.

---

## Author

<div align="center">

**Krish**
B.Tech Computer Science | Manav Rachna University

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/krish-garg-047649330/)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://portfolio-website-gxe6.vercel.app/)

*Built to make document intelligence honest, reliable, and production-ready.*

</div>

---

## License

This project is licensed under the [MIT License](LICENSE).
