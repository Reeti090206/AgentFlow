"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ResumeOptimizer() {
  const { selectedModel, backendUrl, user } = useAuth();
  const router = useRouter();
  
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("skills"); // skills | bullets | improved
  const [result, setResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    
    setErrorMsg("");
    setUploading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append("file", selected);
    
    try {
      const response = await fetch(`${backendUrl}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setResumeText(data.text);
        
        const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
        logs.unshift({
          time: new Date().toLocaleTimeString(),
          action: `Uploaded resume file '${selected.name}'`
        });
        localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));
      } else {
        setErrorMsg(data.detail || "Error extracting text from file");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setUploading(false);
    }
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setErrorMsg("Please paste or upload your resume text first.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/api/resume/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDesc,
          model: selectedModel
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        
        const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
        logs.unshift({
          time: new Date().toLocaleTimeString(),
          action: `Optimized Resume (ATS Score: ${data.ats_score}%)`
        });
        localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));
      } else {
        setErrorMsg(data.detail || "Error optimizing resume");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscussInChat = () => {
    if (!result) return;
    
    const bulletPoints = result.bullet_rewriting?.map((b, i) => `Option ${i+1}:\n- Original: "${b.original}"\n- Suggested: "${b.improved}"`).join("\n\n") || "None";
    const missingSkillsList = result.missing_skills?.join(", ") || "None";
    const keywordsList = result.keyword_suggestions?.join(", ") || "None";
    
    const promptMsg = `I have optimized my resume against the job description. The ATS score is ${result.ats_score}%. Let's discuss modifications.`;
    const answerMsg = `I have analyzed your resume against the target position. Here are the key findings:\n\n` +
      `📊 **ATS Match Score**: **${result.ats_score}%**\n\n` +
      `🔴 **Missing Skills**: ${missingSkillsList}\n\n` +
      `🔑 **Suggested Keywords**: ${keywordsList}\n\n` +
      `💡 **Bullet Point Improvements**:\n\n${bulletPoints}\n\n` +
      `What section or suggestion would you like to review and refine first?`;
      
    const saved = localStorage.getItem(`chat_history_${user}`);
    const chatHistory = saved ? JSON.parse(saved) : [];
    
    const updated = [
      ...chatHistory,
      { role: "user", text: promptMsg },
      { role: "assistant", text: answerMsg }
    ];
    
    localStorage.setItem(`chat_history_${user}`, JSON.stringify(updated));
    
    const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
    logs.unshift({
      time: new Date().toLocaleTimeString(),
      action: `Transferred Resume results to Chat Agent`
    });
    localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));
    
    router.push("/chat");
  };

  const handleCopy = () => {
    if (result?.improved_resume) {
      navigator.clipboard.writeText(result.improved_resume);
      alert("Improved resume copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 py-6 font-sans">
      
      {/* Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">📄 Resume Optimizer</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Optimize your resume ATS compatibility scoring, detect skill gaps, and rewrite bullet points.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}

      {/* Grid Inputs & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Inputs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-sans">Resume Inputs</h3>
          
          {/* File Upload Helper */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Upload Resume File (PDF/TXT)
            </label>
            <input
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-xs text-zinc-500 dark:text-zinc-450 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-slate-200 hover:file:bg-zinc-305 dark:hover:file:bg-zinc-700 file:cursor-pointer"
            />
            {uploading && <span className="text-[10px] text-zinc-650 dark:text-zinc-400 animate-pulse block">Extracting text content...</span>}
          </div>

          <form onSubmit={handleOptimize} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Or Paste Resume Content
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the current text details of your resume or upload a file above..."
                rows={10}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-850 focus:border-zinc-500 rounded-lg p-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Paste Target Job Description (Optional but recommended)
              </label>
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste the job post description to analyze keyword matches..."
                rows={4}
                className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-850 focus:border-zinc-500 rounded-lg p-3 text-xs text-zinc-805 dark:text-zinc-200 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-55 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
            >
              {loading ? "Analyzing matching metrics..." : "Run Optimization Engine"}
            </button>
          </form>
        </div>

        {/* Right Side: Results */}
        <div className="space-y-6">
          {result ? (
            <div className="space-y-6">
              
              {/* ATS Score Header */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{result.ats_score}%</span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">ATS Score Match</span>
                </div>
                
                <button
                  onClick={handleDiscussInChat}
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-lg text-xs cursor-pointer shadow-sm transition-all"
                >
                  💬 Discuss Suggestions in Chat
                </button>
              </div>

              {/* Result Tabs */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
                
                {/* Tab selectors */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-850 text-xs">
                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
                      activeTab === "skills"
                        ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-550 hover:text-zinc-600 dark:hover:text-slate-350"
                    }`}
                  >
                    Skills & Keywords
                  </button>
                  <button
                    onClick={() => setActiveTab("bullets")}
                    className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
                      activeTab === "bullets"
                        ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-550 hover:text-zinc-600 dark:hover:text-slate-355"
                    }`}
                  >
                    Bullet Rewrites
                  </button>
                  <button
                    onClick={() => setActiveTab("improved")}
                    className={`flex-1 pb-3 font-semibold transition-colors cursor-pointer ${
                      activeTab === "improved"
                        ? "border-b-2 border-zinc-900 dark:border-b-2 dark:border-zinc-50 text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-550 hover:text-zinc-600 dark:hover:text-slate-355"
                    }`}
                  >
                    Optimized Resume
                  </button>
                </div>

                {/* Tab content: Skills */}
                {activeTab === "skills" && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-white mb-2">🔴 Missing Core Skills</h4>
                      {result.missing_skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {result.missing_skills.map((sk, i) => (
                            <span key={i} className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 px-2.5 py-1 rounded text-xs">
                              {sk}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-400 dark:text-zinc-550 italic">No missing skills detected.</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-white mb-2">🔑 Recommended Keywords</h4>
                      {result.keyword_suggestions?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {result.keyword_suggestions.map((kw, i) => (
                            <span key={i} className="bg-zinc-100 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-400 px-2.5 py-1 rounded text-xs font-mono">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-400 dark:text-zinc-550 italic">No keywords suggested.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab content: Bullets */}
                {activeTab === "bullets" && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto text-xs">
                    {result.bullet_rewriting?.length > 0 ? (
                      result.bullet_rewriting.map((bl, i) => (
                        <div key={i} className="border-b border-zinc-100 dark:border-zinc-850 pb-3 last:border-0 space-y-2">
                          <div className="bg-zinc-50 dark:bg-zinc-955 p-3 border border-zinc-200 dark:border-zinc-850 rounded-lg">
                            <span className="text-[9px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wide block mb-1">Original</span>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{bl.original}</p>
                          </div>
                          <div className="bg-emerald-50/50 dark:bg-zinc-955 p-3 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wide block mb-1">Optimized</span>
                            <p className="text-emerald-950 dark:text-zinc-200 leading-relaxed font-semibold">{bl.improved}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 dark:text-zinc-550 italic">No specific bullet point rewrites suggested.</p>
                    )}
                  </div>
                )}

                {/* Tab content: Improved resume */}
                {activeTab === "improved" && (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Markdown Output</span>
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded text-[10px] cursor-pointer"
                      >
                        Copy Resume
                      </button>
                    </div>
                    <pre className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-855 rounded-lg p-4 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 leading-relaxed overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap select-text">
                      {result.improved_resume}
                    </pre>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-400 dark:text-zinc-500 h-full flex flex-col items-center justify-center shadow-sm">
              <span className="text-3xl block">📄</span>
              <p className="text-sm mt-3">Upload or paste your resume details to compute optimizer metrics.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
