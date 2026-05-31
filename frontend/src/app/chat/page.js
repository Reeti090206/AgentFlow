"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ChatPage() {
  const { user, selectedModel, backendUrl } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const chatEndRef = useRef(null);

  // Load history from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem(`chat_history_${user}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveHistory = (newMsgs) => {
    setMessages(newMsgs);
    localStorage.setItem(`chat_history_${user}`, JSON.stringify(newMsgs));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    setErrorMsg("");
    const userMsg = inputVal.trim();
    setInputVal("");

    const updated = [...messages, { role: "user", text: userMsg }];
    saveHistory(updated);
    setLoading(true);

    const formattedHistory = messages.map(m => [m.role, m.text]);

    try {
      const response = await fetch(`${backendUrl}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg,
          username: user,
          chat_history: formattedHistory,
          model: selectedModel
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const finalMsgs = [
          ...updated,
          {
            role: "assistant",
            text: data.response,
            intent: data.intent,
            tool_executed: data.tool_executed,
            tool_output: data.tool_output
          }
        ];
        saveHistory(finalMsgs);
        
        const logs = JSON.parse(localStorage.getItem(`agent_logs_${user}`)) || [];
        logs.unshift({
          time: new Date().toLocaleTimeString(),
          action: `Chat mode query (Intent: ${data.intent.mode})`
        });
        localStorage.setItem(`agent_logs_${user}`, JSON.stringify(logs.slice(0, 10)));

      } else {
        setErrorMsg(data.detail || "Error generating agent response");
        saveHistory([...updated, { role: "assistant", text: "⚠️ Failed to get answer from local agent server." }]);
      }
    } catch (err) {
      setErrorMsg("Could not establish REST connection to backend on port 8000.");
      saveHistory([...updated, { role: "assistant", text: "⚠️ REST service connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    saveHistory([]);
    setErrorMsg("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] py-4 space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans">💬 Chat Agent</h2>
          <p className="text-xs text-zinc-555 dark:text-zinc-400">Memory-aware conversational console utilizing local Ollama.</p>
        </div>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300/80 dark:bg-zinc-805 dark:hover:bg-zinc-800 active:bg-zinc-300 dark:active:bg-zinc-750 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          Clear Workspace
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-2xl shadow-sm">
              💬
            </div>
            <div className="max-w-md">
              <h4 className="font-semibold text-zinc-800 dark:text-white">Start a new agent session</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed">
                Type standard text, write calculations (e.g. `2*(5+3)`), ask to read local files, or save settings (e.g. `remember my job is coder`).
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] rounded-xl p-4 border ${
                  isUser
                    ? "bg-zinc-200/50 dark:bg-zinc-900/60 border-zinc-250 dark:border-zinc-850 text-zinc-850 dark:text-zinc-200 self-end ml-auto"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 self-start shadow-sm"
                }`}
              >
                {/* Message Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-zinc-500/20">
                  {msg.text}
                </div>

                {/* Agent Debug Metadata */}
                {!isUser && (msg.intent || msg.tool_executed) && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    
                    {/* Tool Log */}
                    {msg.tool_executed && (
                      <details className="group">
                        <summary className="text-[10px] font-bold text-zinc-650 dark:text-zinc-400 uppercase tracking-wider cursor-pointer list-none flex items-center gap-1 select-none">
                          <span className="group-open:rotate-90 transition-transform">▶</span> 
                          🛠️ Tool Executed: {msg.intent?.tool_name}
                        </summary>
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded p-2 mt-2 text-xs space-y-2">
                          <p className="font-semibold text-zinc-600 dark:text-zinc-400">{msg.tool_executed}</p>
                          {msg.tool_output && (
                            <pre className="text-[10px] text-zinc-800 dark:text-zinc-350 font-mono bg-white dark:bg-zinc-900 p-2 border border-zinc-150 dark:border-zinc-800 rounded overflow-x-auto max-h-40">
                              {msg.tool_output}
                            </pre>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Intent Inspector */}
                    {msg.intent && (
                      <details className="group">
                        <summary className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-pointer list-none flex items-center gap-1 select-none">
                          <span className="group-open:rotate-90 transition-transform">▶</span> 
                          👁️ Intent Classification details
                        </summary>
                        <pre className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded p-2.5 mt-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre">
                          {JSON.stringify(msg.intent, null, 2)}
                        </pre>
                      </details>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
        
        {loading && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 max-w-[80%] self-start flex items-center space-x-3 text-zinc-500 dark:text-zinc-400 text-xs shadow-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-t border-r border-zinc-900 dark:border-zinc-100"></div>
            <span>Agent is thinking...</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-450 px-4 py-3 rounded-lg text-xs max-w-lg">
            {errorMsg}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input controls */}
      <form onSubmit={handleSend} className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Query local Ollama assistant..."
          disabled={loading}
          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 focus:border-zinc-500 focus:dark:border-zinc-400 rounded-xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="px-6 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
        >
          Send
        </button>
      </form>
      
    </div>
  );
}
