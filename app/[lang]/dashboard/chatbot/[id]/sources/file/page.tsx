// app/[lang]/dashboard/chatbots/[id]/files/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface FileSource {
  id: string;
  name?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  status?: "pending" | "indexed" | "error";
  createdAt?: number;
  openaiFileId?: string; // 👈 optional, if you store it in list response
}

export default function FileSourcesPage() {
  const params = useParams();
  const chatbotId = params?.id as string;

  const [files, setFiles] = useState<FileSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);
  const [askingFileId, setAskingFileId] = useState<string | null>(null);

  // --- PDF.js Configuration ---
  const PDF_JS_VERSION = "4.0.379";
  const PDF_JS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}`;

  // ------------------------------------------------
  // Load PDF.js from CDN at runtime
  // ------------------------------------------------
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== "undefined" && window.pdfjsLib) return;
      if (typeof document === "undefined") return;

      try {
        await loadScript(`${PDF_JS_CDN}/pdf.min.mjs`);

        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            `${PDF_JS_CDN}/pdf.worker.min.mjs`;
          console.log("✅ PDF.js loaded");
        } else {
          console.error("❌ pdfjsLib not found on window");
        }
      } catch (error) {
        console.error("❌ Error loading PDF.js:", error);
      }
    };

    loadPdfJs();
  }, []);

  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.type = "module";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => {
        console.error("Failed to load script:", src, e);
        reject(new Error(`Script load error for ${src}`));
      };
      document.body.appendChild(s);
    });
  }

  // ------------------------
  // LOAD FILE SOURCES
  // ------------------------
  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/chatbot/files/list/${chatbotId}`);
      if (!res.ok) throw new Error(`API call failed with status: ${res.status}`);
      const data = await res.json();
      setFiles(data.list || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId) loadFiles();
  }, [chatbotId]);

  // ------------------------
  // EXTRACT PDF TEXT
  // ------------------------
  const extractPdfText = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js library is not loaded.");
    }

    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return text.trim();
  };

  // ------------------------
  // UPLOAD HANDLER (PDF + extracted text via multipart/form-data)
  // ------------------------
  const uploadFile = async () => {
    if (!file) return toast.error("Select a PDF first");
    if (!file.name.toLowerCase().endsWith(".pdf"))
      return toast.error("Only PDF files allowed");

    setUploading(true);

    try {
      toast.loading("Extracting PDF text...", { id: "extract" });

      const extractedText = await extractPdfText(file);
      toast.dismiss("extract");

      if (!extractedText || extractedText.length < 50) {
        throw new Error("No readable text found or text too short.");
      }

      toast.loading("Uploading files...", { id: "upload" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("text", extractedText);
      formData.append("chatbotId", chatbotId);
      formData.append("filename", file.name);
      formData.append("size", file.size.toString());

      const res = await apiFetch(`/chatbot/files/uploadText`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed. Server returned an error.");
      }

      toast.success("✅ PDF uploaded & stored", { id: "upload" });
      setFile(null);
      loadFiles();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Upload failed due to an unknown error.");
    } finally {
      setUploading(false);
    }
  };

  // ------------------------
  // PROCESS FILE HANDLER
  // ------------------------
  const handleProcessFile = async (fileId: string) => {
    setProcessingFileId(fileId);
    toast.loading("Starting indexing process...", { id: "process" });

    try {
      const res = await apiFetch(`/chatbot/files/process/${fileId}`, {
        method: "POST"
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Processing failed. Server returned an error.");
      }

      toast.success(`✅ File successfully indexed (${data.vectors} vectors)`, {
        id: "process"
      });
      loadFiles();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Processing failed.", { id: "process" });
    } finally {
      setProcessingFileId(null);
    }
  };

  // ------------------------
  // ASK GPT ABOUT FILE (NEW)
  // ------------------------
  const handleAskGPT = async (fileId: string) => {
    const question = window.prompt("Ask ChatGPT about this PDF:");
    if (!question || !question.trim()) return;

    setAskingFileId(fileId);
    toast.loading("Asking ChatGPT...", { id: "ask-gpt" });

    try {
      const res = await apiFetch(`/chatbot/files/askGPT/${fileId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ask GPT failed");
      }

      console.log("🤖 GPT ANSWER:", data.answer);
      toast.dismiss("ask-gpt");

      // For now, simple alert; later you can build a nice UI/modal
      alert(`ChatGPT answer:\n\n${data.answer}`);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "ChatGPT request failed", { id: "ask-gpt" });
    } finally {
      setAskingFileId(null);
    }
  };

  const displayName = (f: FileSource) =>
    f.name || f.filename || f.originalName || "—";

  // ------------------------
  // UI
  // ------------------------
  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📁 PDF Knowledge Base</h1>

      {/* UPLOAD */}
      <div className="bg-white p-5 rounded-xl border mb-6 space-y-4">
        <h2 className="font-semibold text-lg">Upload PDF</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={uploadFile}
          disabled={uploading || !file}
          className="bg-indigo-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Extracting & Uploading..." : "Upload PDF"}
        </button>

        <p className="text-sm text-gray-500">
          Raw PDF and extracted text are stored in R2, then can be indexed locally and sent to ChatGPT.
        </p>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 font-semibold">Indexed PDFs</div>

        {loading && (
          <div className="p-6 text-gray-400 text-center">Loading...</div>
        )}

        {!loading && files.length === 0 && (
          <div className="p-10 text-center text-gray-400">No PDFs yet.</div>
        )}

        {!loading && files.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">File</th>
                <th className="p-3 text-center">Size</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const isProcessing = processingFileId === f.id;
                const isAsking = askingFileId === f.id;

                return (
                  <tr key={f.id} className="border-t">
                    <td className="p-3">{displayName(f)}</td>
                    <td className="p-3 text-center">
                      {f.size ? `${(f.size / 1024).toFixed(1)} KB` : "-"}
                    </td>
                    <td className="p-3 text-center">
                      <Badge status={f.status} />
                    </td>
                    <td className="p-3 flex gap-2 justify-center">
                      {/* PROCESS LOCALLY */}
                      <button
                        onClick={() => handleProcessFile(f.id)}
                        disabled={isProcessing}
                        className={`px-3 py-1 text-xs rounded font-semibold ${
                          isProcessing
                            ? "bg-gray-300 text-gray-600"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {isProcessing ? "Processing..." : "Process"}
                      </button>

                      {/* ASK GPT */}
                      <button
                        onClick={() => handleAskGPT(f.id)}
                        disabled={isAsking}
                        className={`px-3 py-1 text-xs rounded font-semibold ${
                          isAsking
                            ? "bg-blue-300 text-blue-700"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {isAsking ? "Asking..." : "Ask ChatGPT"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ------------------------
// BADGE
// ------------------------
function Badge({ status }: { status?: string }) {
  if (status === "indexed")
    return <span className="text-green-600 font-semibold">Indexed</span>;
  if (status === "error")
    return <span className="text-red-500 font-semibold">Failed</span>;
  return <span className="text-orange-500">Pending</span>;
}
