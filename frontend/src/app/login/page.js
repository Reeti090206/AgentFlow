"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Login form state
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  
  // Register form state
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  
  // Status feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!loginUser.trim() || !loginPass.trim()) {
      setErrorMsg("Username and password are required.");
      return;
    }
    
    setLoading(true);
    const result = await login(loginUser, loginPass);
    setLoading(false);
    
    if (!result.success) {
      setErrorMsg(result.error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!regUser.trim() || !regPass.trim()) {
      setErrorMsg("Username and password are required.");
      return;
    }
    
    if (regPass !== regConfirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    const result = await register(regUser, regPass);
    setLoading(false);
    
    if (result.success) {
      setSuccessMsg(result.message);
      // Clear inputs and switch tabs
      setRegUser("");
      setRegPass("");
      setRegConfirm("");
      setTimeout(() => {
        setIsLoginTab(true);
        setLoginUser(regUser);
      }, 1500);
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            🤖 AgentFlow Workstation
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            A secure local AI assistant powered by Ollama.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors cursor-pointer ${
              isLoginTab
                ? "border-b-2 border-indigo-500 text-indigo-650 dark:text-indigo-400"
                : "text-slate-405 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors cursor-pointer ${
              !isLoginTab
                ? "border-b-2 border-indigo-500 text-indigo-655 dark:text-indigo-400"
                : "text-slate-405 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-550 dark:text-red-400 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-650 dark:text-green-400 p-3 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {/* Forms */}
        {isLoginTab ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer shadow-md shadow-indigo-655/10 mt-6 animate-none"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">
                Choose Username
              </label>
              <input
                type="text"
                value={regUser}
                onChange={(e) => setRegUser(e.target.value)}
                placeholder="Pick a unique username"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">
                Choose Password
              </label>
              <input
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Re-type your password"
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-850 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer shadow-md shadow-indigo-655/10 mt-6 animate-none"
            >
              {loading ? "Registering account..." : "Register & Create"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
