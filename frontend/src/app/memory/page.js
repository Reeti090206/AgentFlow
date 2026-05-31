"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function MemoryBank() {
  const { user, backendUrl } = useAuth();
  const [memories, setMemories] = useState({});
  const [mKey, setMKey] = useState("");
  const [mVal, setMVal] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/memory?username=${user}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || {});
      }
    } catch (e) {
      console.error("Failed to load memories:", e);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!mKey.trim() || !mVal.trim()) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user,
          key: mKey.trim(),
          value: mVal.trim()
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(data.message);
        setMKey("");
        setMVal("");
        fetchMemories();
        
        // Log action in dashboard activity
        const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
        logs.unshift({
          time: new Date().toLocaleTimeString(),
          action: `Saved memory key '${mKey.trim().toLowerCase()}'`
        });
        localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));
      } else {
        setErrorMsg(data.detail || "Error saving memory");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${backendUrl}/api/memory?username=${user}&key=${key}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(data.message);
        fetchMemories();
        
        // Log action in dashboard activity
        const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
        logs.unshift({
          time: new Date().toLocaleTimeString(),
          action: `Deleted memory key '${key}'`
        });
        localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));
      } else {
        setErrorMsg(data.detail || "Error deleting memory");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    }
  };

  return (
    <div className="space-y-6 py-6 font-sans">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-sans">🧠 User Memory Bank</h2>
        <p className="text-xs text-slate-505 dark:text-slate-400">Manage persistent preference settings that guide conversational context and tool actions.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-650 dark:text-green-400 p-3 rounded-lg text-xs max-w-xl">
          {successMsg}
        </div>
      )}

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Memory Grid Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-fit space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Active Memory Variables</h3>
          {Object.keys(memories).length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-850 text-left text-xs bg-white dark:bg-slate-950">
                <thead className="bg-slate-105 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="px-4 py-3">Memory Variable Key</th>
                    <th className="px-4 py-3">Saved User Preference</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                  {Object.entries(memories).map(([key, val]) => (
                    <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-semibold font-mono text-indigo-650 dark:text-indigo-400 select-text">
                        {key}
                      </td>
                      <td className="px-4 py-3 select-text whitespace-pre-wrap leading-relaxed max-w-sm truncate">
                        {val}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(key)}
                          className="px-2 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 dark:text-red-455 rounded text-[10px] cursor-pointer font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
              Your memory profile database is empty. Save variables on the right to enrich chat context.
            </p>
          )}
        </div>

        {/* Add Memory Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-fit space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Save Memory Preference</h3>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Memory Key
              </label>
              <input
                type="text"
                value={mKey}
                onChange={(e) => setMKey(e.target.value)}
                placeholder="e.g. programming_language, first_name"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Preference Value
              </label>
              <textarea
                value={mVal}
                onChange={(e) => setMVal(e.target.value)}
                placeholder="e.g. Python, John"
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-850 focus:border-indigo-500 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !mKey.trim() || !mVal.trim()}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-md shadow-indigo-650/10"
            >
              {loading ? "Saving memory..." : "Save Memory Variable"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
