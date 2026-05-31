"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { selectedModel, updateModel, ollamaHost, updateHost, backendUrl } = useAuth();
  const [hostInput, setHostInput] = useState(ollamaHost);
  const [models, setModels] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchModels = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/settings/models`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
      }
    } catch (e) {
      console.error("Failed to load settings models:", e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [backendUrl]);

  // Sync state if context loads late
  useEffect(() => {
    setHostInput(ollamaHost);
  }, [ollamaHost]);

  const handleHostSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!hostInput.trim()) return;

    try {
      await updateHost(hostInput.trim());
      setSuccessMsg("Ollama API host URL updated and synced successfully!");
      fetchModels();
    } catch (err) {
      setErrorMsg("Failed to synchronize host to Python backend API.");
    }
  };

  return (
    <div className="space-y-6 py-6 font-sans">

      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white font-sans">⚙️ System Settings</h2>
        <p className="text-xs text-slate-400">Configure local network endpoints and active model preferences for Ollama LLMs.</p>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs max-w-xl">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl space-y-6">

        {/* Connection Form */}
        <form onSubmit={handleHostSubmit} className="space-y-4 text-xs">
          <h3 className="text-lg font-bold text-white font-sans">Ollama Connection Settings</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Ollama Server Endpoint Host URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={hostInput}
                onChange={(e) => setHostInput(e.target.value)}
                placeholder="e.g. http://localhost:11434"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Update Host URL
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Default localhost port is usually 11434.</p>
          </div>
        </form>

        <hr className="border-slate-800" />

        {/* Model dropdown */}
        <div className="space-y-3 text-xs">
          <h3 className="text-lg font-bold text-white font-sans">Model Configuration</h3>
          {models.length > 0 ? (
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Active Reasoning Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => updateModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No models discovered. Make sure Ollama is serving locally to select active reasoning LLMs.
            </p>
          )}
        </div>

        <hr className="border-slate-800" />

        {/* Guides */}
        <div className="space-y-3 text-xs leading-relaxed text-slate-400">
          <h3 className="text-base font-bold text-white font-sans">Troubleshooting Connection Failures</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Ensure the Ollama application is running in the background.</li>
            <li>Test direct endpoint health in your browser at: <a href="http://localhost:11434" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">http://localhost:11434</a></li>
            <li>Verify you have pulled a base model by running in your local terminal: <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-400">ollama pull llama3</code></li>
          </ul>
        </div>

      </div>
    </div>
  );
}
