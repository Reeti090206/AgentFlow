"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LinkedInGenerator() {
  const { selectedModel, backendUrl, user } = useAuth();
  
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("professional + engaging");
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg("Please enter project details or accomplishments first.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/linkedin/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_prompt: content,
          tone: tone,
          model: selectedModel
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        
        const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
        logs.unshift({
          time: new Date().toLocaleTimeString(),
          action: `Generated LinkedIn Post (${tone.split(" ")[0]})`
        });
        localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));
      } else {
        setErrorMsg(data.detail || "Error generating LinkedIn post");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const getFullPost = () => {
    if (!result) return "";
    const hook = result.hook || "";
    const body = result.body || "";
    const impact = result.impact || "";
    const hashtags = result.hashtags?.join(" ") || "";
    return `${hook}\n\n${body}\n\n⚡ Impact:\n${impact}\n\n${hashtags}`;
  };

  const handleCopy = () => {
    const text = getFullPost();
    if (text) {
      navigator.clipboard.writeText(text);
      alert("LinkedIn post copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 py-6">
      
      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">🔗 LinkedIn Generator</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Convert achievements, resume snippets, or project milestones into viral professional narratives.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Inputs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">Create Post</h3>
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Project / Achievement Milestones
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="List what you accomplished, what tech stack was used, what problems you solved, and any key numbers..."
                rows={10}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-850 focus:border-zinc-500 rounded-lg p-3 text-xs text-zinc-805 dark:text-zinc-200 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Writing Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 focus:border-zinc-500 rounded-lg px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="professional + engaging">Professional + Engaging (Recommended)</option>
                <option value="storyteller / build in public">Storyteller (Build in public)</option>
                <option value="highly technical & authoritative">Highly Technical & Authoritative</option>
                <option value="excited & celebratory">Excited & Celebratory</option>
                <option value="casual & humorous">Casual & Humorous</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
            >
              {loading ? "Composing post copy..." : "Draft Post Copy"}
            </button>
          </form>
        </div>

        {/* Right: Output */}
        <div className="space-y-6">
          {result ? (
            <div className="space-y-4">
              
              {/* Output Preview */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">📱 Draft Preview</h3>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-955 font-semibold rounded text-[10px] cursor-pointer"
                  >
                    Copy Post
                  </button>
                </div>
                
                <textarea
                  readOnly
                  value={getFullPost()}
                  rows={14}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg p-4 font-sans text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed focus:outline-none select-text resize-none"
                />

                {/* Structure Breakdown */}
                <details className="group border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-955/50">
                  <summary className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer list-none flex items-center gap-1 select-none">
                    <span className="group-open:rotate-90 transition-transform">▶</span> 
                    🔍 Analytical Structure Breakdown
                  </summary>
                  <div className="p-3 border-t border-zinc-200 dark:border-zinc-850 space-y-2 text-xs leading-relaxed text-zinc-550 dark:text-zinc-400">
                    <p><strong>Hook:</strong> {result.hook}</p>
                    <p><strong>Story Narration:</strong> {result.body}</p>
                    <p><strong>Impact KPI:</strong> {result.impact}</p>
                    <p><strong>Hashtags:</strong> {result.hashtags?.join(" ")}</p>
                  </div>
                </details>

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-400 dark:text-zinc-500 h-full flex flex-col items-center justify-center shadow-sm">
              <span className="text-3xl block">🔗</span>
              <p className="text-sm mt-3">Outline project descriptions or accomplishments to write post drafts.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
