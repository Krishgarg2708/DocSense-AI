# 📘 DocuMind RAG Assistant

DocuMind is a document-centric AI assistant built using **Retrieval-Augmented Generation (RAG)** that allows users to upload documents and ask questions **strictly grounded in the uploaded content**.

The system is designed to handle **large documents (100+ pages)** while preventing hallucinations by enforcing **context-only answers with explicit refusal** when information is not present.

This project focuses on **correctness, explainability, and real-world engineering**, not demo shortcuts.

---

## 🚀 Features

- 📄 Upload documents (PDF, TXT, DOCX)
- 🔍 Ask natural language questions about uploaded documents
- 🧠 Answers generated **only from document content**
- 🚫 Explicit refusal if information is missing
- 🧩 Chunk-based retrieval for large files
- 📌 Source-aware responses
- 🔐 User authentication and document isolation
- ⚙️ Backend-driven RAG pipeline (no frontend shortcuts)

---

## 🧠 Why DocuMind?

Most “document Q&A” apps are **fake RAG systems**:
- They pass entire documents to the model
- They allow hallucinations
- They silently use external knowledge

**DocuMind avoids all of that by design.**

### Key principles:
- Separation of ingestion and query-time reasoning
- Embedding-based retrieval (not keyword search)
- Strict prompt guardrails
- Mandatory refusal when context is insufficient

This makes DocuMind suitable for:
- Company policies
- Financial reports
- Research papers
- Legal or compliance documents

---

## 🏗️ System Architecture

User
├── Uploads Document
│ └── Firebase Storage
│ └── Cloud Function (Text Extraction)
│ └── Chunking + Embeddings
│ └── Firestore (Chunk Metadata)
│
└── Asks Question
└── Embed Query
└── Retrieve Top-K Chunks
└── Gemini (Context-Only Answer)
└── Answer + Source


---

## 🛠️ Tech Stack

### Frontend
- Firebase Studio
- Web UI (file upload + Q&A interface)

### Backend
- Firebase Cloud Functions
- Firebase Storage (document storage)
- Firestore (chunk metadata & embeddings)

### AI / ML
- Google AI Studio (Gemini)
- Retrieval-Augmented Generation (RAG)
- Vector similarity search

---

## 🔄 RAG Workflow

### 1️⃣ Document Ingestion
- User uploads a file
- File stored in Firebase Storage
- Cloud Function extracts raw text
- Text is chunked with overlap
- Embeddings generated per chunk
- Stored in Firestore with metadata

### 2️⃣ Question Answering
- User submits a question
- Question is embedded
- Top-K relevant chunks retrieved
- Only retrieved chunks passed to Gemini
- Model answers **strictly from context**
- If no relevant chunk → refusal

---

## 🧪 Example Queries

### Valid Question
What happens if a reimbursement claim is submitted late?
### Trap Question
What is the GST percentage reimbursed on fuel bills?
### Correct System Response
The uploaded document does not contain this information.

Any answer beyond this indicates a broken RAG pipeline.

---

## 🔐 Safety & Guardrails

- Model is forbidden from using external knowledge
- No answer without retrieved document chunks
- Explicit refusal on insufficient context
- User-level document isolation via Firebase Authentication
- Backend-enforced logic (not prompt-only safety)

---

## 📂 Project Structure

