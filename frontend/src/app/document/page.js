"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DocumentIntelligence() {
  const { selectedModel, backendUrl } = useAuth();
  
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  
  const [qVal, setQVal] = useState("");
  const [answer, setAnswer] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e) => {
    setErrorMsg("");
    setSummary("");
    setExtractedText("");
    setAnswer("");
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilename(selected.name);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setErrorMsg("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", selectedModel);

    try {
      const response = await fetch(`${backendUrl}/api/doc/summarize`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setExtractedText(data.text);
        setSummary(data.summary);
      } else {
        setErrorMsg(data.detail || "Error extracting or summarizing document");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!qVal.trim() || !extractedText || qLoading) return;

    setErrorMsg("");
    setQLoading(true);
    setAnswer("");

    try {
      const response = await fetch(`${backendUrl}/api/doc/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: qVal,
          document_text: extractedText,
          model: selectedModel
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnswer(data.answer);
      } else {
        setErrorMsg(data.detail || "Error analyzing document content");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setQLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      
      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">📄 Document Intelligence</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload documents (PDF, TXT, or DOCX) to get summaries and run custom Q&A inquiries.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 h-fit space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">Upload File</h3>
          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-550 dark:hover:border-zinc-700 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-zinc-50 dark:bg-zinc-955/40">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <span className="text-2xl">📥</span>
              <p className="text-xs text-zinc-705 dark:text-zinc-350 mt-2 font-medium">
                {filename ? filename : "Drag & drop or click to upload"}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Accepts PDF, TXT, and DOCX files</p>
            </div>
            
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
            >
              {loading ? "Parsing Content..." : "Extract & Summarize"}
            </button>
          </form>
        </div>

        {/* Results columns */}
        <div className="lg:col-span-2 space-y-6">
          {summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Summary */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">📝 Summary</h3>
                <div className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap select-text border border-zinc-200 dark:border-zinc-850 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 max-h-[350px] overflow-y-auto">
                  {summary}
                </div>
              </div>

              {/* Q&A */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">❓ Ask Questions</h3>
                <form onSubmit={handleQuerySubmit} className="space-y-3 text-xs">
                  <input
                    type="text"
                    value={qVal}
                    onChange={(e) => setQVal(e.target.value)}
                    placeholder="Ask something about the text..."
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-805 dark:text-zinc-200 focus:outline-none focus:border-zinc-550 focus:dark:border-zinc-400"
                    required
                  />
                  <button
                    type="submit"
                    disabled={qLoading || !qVal.trim()}
                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {qLoading ? "Querying..." : "Search File"}
                  </button>
                </form>

                {answer && (
                  <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-lg p-4 text-xs text-zinc-800 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap select-text max-h-[220px] overflow-y-auto">
                    <p className="font-bold text-zinc-850 dark:text-zinc-400 mb-1">Answer:</p>
                    {answer}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-400 dark:text-zinc-500 shadow-sm">
              <span className="text-3xl block">📄</span>
              <p className="text-sm mt-3">Upload a PDF, TXT, or DOCX file on the left to review metrics.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
