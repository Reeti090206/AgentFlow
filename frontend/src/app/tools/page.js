"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ToolsPage() {
  const { backendUrl, selectedModel, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("calc"); // calc | reader | sum | mem
  
  // Tab states
  const [calcInput, setCalcInput] = useState("2 * (3 + 4)");
  const [calcResult, setCalcResult] = useState("");
  
  const [filePath, setFilePath] = useState("");
  const [fileContent, setFileContent] = useState("");
  
  const [sumInput, setSumInput] = useState("");
  const [sumResult, setSumResult] = useState("");
  
  const [memories, setMemories] = useState({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCalc = async (e) => {
    e.preventDefault();
    if (!calcInput.trim()) return;
    setErrorMsg("");
    setLoading(true);
    setCalcResult("");

    try {
      const response = await fetch(`${backendUrl}/api/tools/calculator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: calcInput }),
      });
      const data = await response.json();
      if (response.ok) {
        setCalcResult(data.result);
      } else {
        setErrorMsg(data.detail || "Error evaluating expression");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleReadFile = async (e) => {
    e.preventDefault();
    if (!filePath.trim()) return;
    setErrorMsg("");
    setLoading(true);
    setFileContent("");

    try {
      const response = await fetch(`${backendUrl}/api/tools/read_file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: filePath }),
      });
      const data = await response.json();
      if (response.ok) {
        setFileContent(data.content);
      } else {
        setErrorMsg(data.detail || "Error reading file");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeText = async (e) => {
    e.preventDefault();
    if (!sumInput.trim()) return;
    setErrorMsg("");
    setLoading(true);
    setSumResult("");

    try {
      const response = await fetch(`${backendUrl}/api/tools/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sumInput, model: selectedModel }),
      });
      const data = await response.json();
      if (response.ok) {
        setSumResult(data.summary);
      } else {
        setErrorMsg(data.detail || "Error summarizing text");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/memory?username=${user}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || {});
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeSubTab === "mem") {
      fetchMemories();
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6 py-6 font-sans">
      
      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">🧰 Tools & Utilities Sandbox</h2>
        <p className="text-xs text-zinc-505 dark:text-zinc-400">Directly execute individual python utility functions and verify output logs.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
        
        {/* Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-850 text-xs">
          <button
            onClick={() => setActiveSubTab("calc")}
            className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
              activeSubTab === "calc"
                ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-550 hover:text-zinc-655 dark:hover:text-zinc-350"
            }`}
          >
            Safe AST Calculator
          </button>
          <button
            onClick={() => setActiveSubTab("reader")}
            className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
              activeSubTab === "reader"
                ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-555 hover:text-zinc-655 dark:hover:text-zinc-350"
            }`}
          >
            File Reader
          </button>
          <button
            onClick={() => setActiveSubTab("sum")}
            className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
              activeSubTab === "sum"
                ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-555 hover:text-zinc-655 dark:hover:text-zinc-350"
            }`}
          >
            Text Summarizer
          </button>
          <button
            onClick={() => setActiveSubTab("mem")}
            className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
              activeSubTab === "mem"
                ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-555 hover:text-zinc-655 dark:hover:text-zinc-350"
            }`}
          >
            Active Memories
          </button>
        </div>

        {/* Tab content: Calc */}
        {activeSubTab === "calc" && (
          <form onSubmit={handleCalc} className="space-y-4 max-w-lg text-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Mathematical Expression
              </label>
              <input
                type="text"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                placeholder="e.g., 2.5 * (40 / 3) + 7^2"
                className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {loading ? "Calculating..." : "Evaluate"}
            </button>
            {calcResult && (
              <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 p-4 rounded-lg mt-2 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {calcResult}
              </div>
            )}
          </form>
        )}

        {/* Tab content: Reader */}
        {activeSubTab === "reader" && (
          <form onSubmit={handleReadFile} className="space-y-4 text-xs">
            <div className="max-w-lg">
              <label className="block text-xs font-semibold text-zinc-505 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Absolute Local File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g. C:/Users/name/Documents/test.txt"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-255 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-805 dark:text-zinc-205 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {loading ? "Reading File..." : "Open File"}
            </button>
            {fileContent && (
              <div className="space-y-2 mt-2">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">File Content</span>
                <pre className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg p-4 font-mono text-[10px] text-zinc-707 dark:text-zinc-300 leading-relaxed overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap select-text">
                  {fileContent}
                </pre>
              </div>
            )}
          </form>
        )}

        {/* Tab content: Summarizer */}
        {activeSubTab === "sum" && (
          <form onSubmit={handleSummarizeText} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-505 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Raw Text to Summarize
              </label>
              <textarea
                value={sumInput}
                onChange={(e) => setSumInput(e.target.value)}
                placeholder="Paste the block of text here..."
                rows={6}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-850 focus:border-zinc-500 rounded-lg p-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-955 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {loading ? "Summarizing..." : "Summarize Text"}
            </button>
            {sumResult && (
              <div className="space-y-2 mt-2">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Summary Output</span>
                <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-lg p-4 text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap select-text">
                  {sumResult}
                </div>
              </div>
            )}
          </form>
        )}

        {/* Tab content: Memories */}
        {activeSubTab === "mem" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white font-sans">Memory Profile Dump</h3>
            {Object.keys(memories).length > 0 ? (
              <pre className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg p-4 font-mono text-[10px] text-zinc-800 dark:text-indigo-400 overflow-x-auto whitespace-pre">
                {JSON.stringify(memories, null, 2)}
              </pre>
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 italic">No memories saved in user profile database.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
