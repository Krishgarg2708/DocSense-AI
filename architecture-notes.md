
# DocuMind Multimodal RAG Architecture

## 1. Supported Document Types
The system now supports an enterprise-grade range of document formats:
- **Plain Text**: .txt, .md
- **Rich Documents**: .pdf (via pdfjs-dist), .docx (via mammoth)
- **Tabular Data**: .xlsx, .xls, .csv (via xlsx/SheetJS)
- **Images (OCR)**: .png, .jpg, .jpeg, .webp (via Gemini 3 Pro Vision)

## 2. Text Extraction Strategy
- **Client-Side Parsing**: PDF, Word, and Excel files are parsed directly in the browser using specialized libraries. This reduces server costs and increases privacy.
- **AI-Powered OCR**: Image-based documents are sent to Gemini Vision. The model extracts text with high contextual awareness, preserving layout and logical flow.

## 3. Storage & Indexing
- **Local State Sim**: Chunks are stored in a reactive state array with vector embeddings. In a full production environment, these are synchronized with a Firestore Vector Database.
- **Semantic Chunking**: 1000-character windows with 200-character overlaps ensure cross-chunk context preservation.

## 4. Operational Guardrails
- **Strict RAG**: The system prompt forces the model to ignore internal training and rely exclusively on retrieved chunks.
- **Refusal Logic**: If the cosine similarity search returns no high-score matches, or if the model finds no answer in the top-K chunks, it issues a "not available" refusal.
