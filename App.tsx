
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from './services/geminiService';
import { chunkText, searchChunks } from './utils/ragEngine';
import { DocumentMetadata, TextChunk, ChatMessage } from './types';
import { RAG_CONFIG } from './constants';
import mammoth from 'mammoth';
import * as PDFJS from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { 
  FileUp, 
  Send, 
  Loader2, 
  BookOpen, 
  Database,
  Search,
  AlertCircle,
  FileText,
  Clock,
  Image as ImageIcon,
  MessageSquareText
} from 'lucide-react';

// Configure PDFJS Worker
PDFJS.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.mjs`;

const gemini = new GeminiService();

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [allChunks, setAllChunks] = useState<TextChunk[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAnswering]);

  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText;
  };

  const extractDocxText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const extractSheetText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      fullText += `Sheet: ${sheetName}\n` + XLSX.utils.sheet_to_txt(sheet) + '\n\n';
    });
    return fullText;
  };

  const extractImageText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const text = await gemini.extractTextFromImage(base64, file.type);
          resolve(text);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);
    setProcessingStatus('Parsing file...');

    try {
      let text = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'docx') {
        text = await extractDocxText(file);
      } else if (ext === 'pdf') {
        text = await extractPdfText(file);
      } else if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        text = await extractSheetText(file);
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
        setProcessingStatus('AI OCR in progress...');
        text = await extractImageText(file);
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error("No readable text found.");
      }

      setProcessingStatus('Indexing content...');
      const docId = crypto.randomUUID();
      const newDoc: DocumentMetadata = {
        id: docId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        userId: 'demo-user'
      };

      const chunks = chunkText(text, docId);
      const processedChunks: TextChunk[] = [];

      const BATCH_SIZE = 5;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (chunk) => {
          const embedding = await gemini.getEmbedding(chunk.text);
          return { ...chunk, embedding };
        });
        
        const results = await Promise.all(batchPromises);
        processedChunks.push(...results);
        setProcessingProgress(Math.round(((i + batch.length) / chunks.length) * 100));
      }

      setDocuments(prev => [...prev, newDoc]);
      setAllChunks(prev => [...prev, ...processedChunks]);

    } catch (err: any) {
      setError(err.message || "Failed to process document.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
      if (event.target) event.target.value = '';
    }
  };

  const handleSummarize = async () => {
    if (allChunks.length === 0 || isAnswering) return;

    setIsAnswering(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: "Please summarize this document for me.",
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // For summary, we take a balanced set of chunks (first few are usually most descriptive for an intro)
      const contextChunks = allChunks.slice(0, Math.min(allChunks.length, 10));
      const summary = await gemini.summarizeDocument(contextChunks);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summary,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError("Failed to generate summary.");
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnswering || allChunks.length === 0) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAnswering(true);
    setError(null);

    try {
      const queryVector = await gemini.getEmbedding(userMessage.content);
      const topResults = searchChunks(queryVector, allChunks);
      const retrievedChunks = topResults.map(r => r.chunk);

      if (retrievedChunks.length === 0) {
        throw new Error("No relevant segments found.");
      }

      const { answer } = await gemini.askQuestion(userMessage.content, retrievedChunks);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        sources: retrievedChunks.map(c => `Chunk #${c.index + 1}`),
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve answer.");
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900">
      {/* SIDEBAR - SIMPLIFIED */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-800">DocuMind</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase px-1">Documents</h3>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 px-1 italic">No documents yet</p>
            ) : (
              <div className="space-y-1">
                {documents.map(doc => (
                  <div key={doc.id} className="p-2 rounded hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-default group">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600 truncate">{doc.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={handleSummarize}
            disabled={allChunks.length === 0 || isAnswering}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            <MessageSquareText className="w-4 h-4" />
            Summarize Doc
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* HEADER */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3">
             <span className={`w-2 h-2 rounded-full ${allChunks.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
             <span className="text-xs font-bold text-slate-500">
               {allChunks.length > 0 ? 'Engine Ready' : 'Awaiting Document'}
             </span>
          </div>

          <div className="flex items-center gap-4">
            {isProcessing && (
              <span className="text-xs font-medium text-indigo-600 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                {processingStatus}
              </span>
            )}
            <label className={`flex items-center gap-2 px-4 py-1.5 rounded bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer hover:bg-indigo-700 active:scale-95 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <FileUp className="w-4 h-4" />
              Upload
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.docx,.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg" disabled={isProcessing} />
            </label>
          </div>
        </header>

        {/* MESSAGES - CLEANER UI */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4 opacity-60">
              <div className="p-3 bg-slate-50 rounded-full">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Welcome to DocuMind</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Upload a document to start asking questions based strictly on its content.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-lg px-4 py-3 border shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-50 border-indigo-100 text-slate-800' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.sources.map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isAnswering && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm animate-pulse">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="max-w-3xl mx-auto flex justify-center p-2">
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER & INPUT */}
        <footer className="px-4 pb-4 pt-2 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={allChunks.length === 0 ? "Upload a file to begin..." : "Ask a question..."}
                disabled={allChunks.length === 0 || isAnswering}
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isAnswering || allChunks.length === 0}
                className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            <div className="mt-4 flex items-center justify-center border-t border-slate-100 pt-3">
               <p className="text-[11px] font-bold text-slate-500 tracking-wider">
                 FOR ANY QUERY CONTACT <span className="text-indigo-600">+91 8375075158</span>
               </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
