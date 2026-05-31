"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Dashboard() {
  const { user, selectedModel, backendUrl } = useAuth();
  const [memoryCount, setMemoryCount] = useState(0);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/memory?username=${user?.uid}`);
        if (res.ok) {
          const data = await res.json();
          setMemoryCount(Object.keys(data.memories || {}).length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchMemories();
    
    const logs = localStorage.getItem(`agent_logs_${user?.uid}`);
    if (logs) {
      setActivities(JSON.parse(logs));
    } else {
      const initial = [
        { time: new Date().toLocaleTimeString(), action: "LoggedIn to AI workstation" }
      ];
      setActivities(initial);
      localStorage.setItem(`agent_logs_${user?.uid}`, JSON.stringify(initial));
    }
  }, [user, backendUrl]);

  const quickActions = [
    { href: "/chat", label: "💬 Chat Agent Workspace", desc: "Interact with the memory-aware conversational AI assistant." },
    { href: "/document", label: "📄 Document Intelligence", desc: "Extract structures, create summaries, and query PDF/TXT files." },
    { href: "/data", label: "📊 Data Analysis", desc: "Upload CSV tables and generate statistical insights automatically." },
    { href: "/resume", label: "📄 Resume Optimizer", desc: "Optimize your resume against jobs and test ATS keyword matches." },
    { href: "/linkedin", label: "🔗 LinkedIn Generator", desc: "Compose viral post narratives from projects and milestones." },
    { href: "/memory", label: "🧠 Stored Preferences", desc: "Manage key-value memory profiles that guide the agent." }
  ];

  return (
    <div className="space-y-8 py-6">
      
      {/* Title */}
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans">
          Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Agent"}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Your local agent workspace is initialized. Review status indicators and access modules below.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
            Stored Preferences
          </span>
          <span className="text-3xl font-bold text-zinc-950 dark:text-white block mt-2">
            {memoryCount} items
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
            Active LLM Model
          </span>
          <span className="text-3xl font-bold text-zinc-950 dark:text-white block mt-2 capitalize">
            {selectedModel}
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
            Workstation Mode
          </span>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 block mt-2">
            Offline (Local)
          </span>
        </div>
      </div>

      {/* Feature Grid & Action Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-zinc-950 dark:text-white font-sans">Quick Launch Workflows</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="block bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-5 transition-all text-left group shadow-sm"
              >
                <h4 className="font-semibold text-zinc-900 dark:text-white group-hover:text-zinc-950 dark:group-hover:text-zinc-150 transition-colors">
                  {action.label}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  {action.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column: Action logs */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-zinc-950 dark:text-white font-sans">Recent Log Activities</h3>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 min-h-[300px] max-h-[380px] overflow-y-auto space-y-3 shadow-sm">
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div key={i} className="text-xs border-b border-zinc-100 dark:border-zinc-800 pb-2 flex justify-between gap-4">
                  <span className="text-zinc-500 dark:text-zinc-450 font-semibold">{act.time}</span>
                  <span className="text-zinc-700 dark:text-zinc-300 text-right">{act.action}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">No logs generated yet.</p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
