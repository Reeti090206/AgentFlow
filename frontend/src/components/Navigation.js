"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Navigation() {
  const { user, logout, selectedModel, updateModel, backendUrl } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [models, setModels] = useState([]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/settings/status`);
        if (res.ok) {
          const data = await res.json();
          setOllamaOnline(data.online);
          setModels(data.models || []);
        } else {
          setOllamaOnline(false);
        }
      } catch (err) {
        setOllamaOnline(false);
      }
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  const menuItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/chat", label: "Chat Agent", icon: "💬" },
    { href: "/document", label: "Documents", icon: "📄" },
    { href: "/data", label: "Data Analysis", icon: "📊" },
    { href: "/resume", label: "Resume Optimizer", icon: "📄" },
    { href: "/linkedin", label: "LinkedIn Generator", icon: "🔗" },
    { href: "/tools", label: "Tools & Utilities", icon: "🧰" },
    { href: "/memory", label: "User Memory Bank", icon: "🧠" },
    { href: "/settings", label: "System Settings", icon: "⚙️" }
  ];

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col justify-between h-screen text-[var(--sidebar-text)] transition-colors duration-150">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="p-6 border-b border-[var(--sidebar-border)]">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl">🤖</span>
            <h1 className="text-lg font-extrabold text-[var(--sidebar-active-text)] tracking-tight font-sans">
              AgentFlow
            </h1>
          </Link>
          <p className="text-[10px] text-[var(--sidebar-text-muted)] mt-1.5 font-semibold">
            Logged in: <span className="capitalize text-[var(--sidebar-active-text)]">{user}</span>
          </p>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-sm border border-[var(--sidebar-border)]"
                    : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-active-text)]"
                }`}
              >
                <span className="mr-3 text-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Connection & Actions */}
      <div className="p-4 border-t border-[var(--sidebar-border)] space-y-4">
        
        {/* Status card */}
        <div className="bg-[var(--sidebar-hover-bg)] p-3 rounded-lg border border-[var(--sidebar-border)]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--sidebar-text-muted)]">Ollama Status</span>
            <span className={`inline-block w-2 h-2 rounded-full ${ollamaOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          </div>
          <p className="text-[10px] text-[var(--sidebar-text-muted)] mt-1 font-semibold">
            {ollamaOnline ? "Connected & Ready" : "Offline / Unreachable"}
          </p>

          {ollamaOnline && models.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[var(--sidebar-border)]/50">
              <label className="text-[8px] text-[var(--sidebar-text-muted)] font-extrabold uppercase block mb-1">Active Model</label>
              <select
                value={selectedModel}
                onChange={(e) => updateModel(e.target.value)}
                className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] text-[var(--sidebar-active-text)] text-[11px] font-semibold rounded p-1.5 focus:outline-none cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m} value={m} className="bg-[var(--sidebar-bg)] text-[var(--sidebar-active-text)]">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Theme Toggle & Log Out */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleTheme}
            className="py-2.5 bg-[var(--sidebar-hover-bg)] hover:bg-[var(--sidebar-hover-bg)]/80 text-[var(--sidebar-active-text)] border border-[var(--sidebar-border)] rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer text-center"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          
          <button
            onClick={logout}
            className="py-2.5 bg-[var(--sidebar-hover-bg)] hover:bg-red-500/10 text-[var(--sidebar-active-text)] hover:text-red-650 dark:hover:text-red-400 border border-[var(--sidebar-border)] rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer text-center"
          >
            Sign Out
          </button>
        </div>

      </div>
    </aside>
  );
}
