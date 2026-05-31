"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

// ── SVG Brand Icons ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M47.532 24.552c0-1.636-.132-3.2-.388-4.704H24.48v8.897h12.94c-.556 3.008-2.244 5.556-4.78 7.272v6.048h7.74c4.528-4.172 7.152-10.32 7.152-17.513z" fill="#4285F4"/>
    <path d="M24.48 48c6.48 0 11.916-2.148 15.888-5.832l-7.74-6.048c-2.148 1.44-4.896 2.292-8.148 2.292-6.264 0-11.568-4.236-13.464-9.924H3.012v6.24C6.972 42.9 15.204 48 24.48 48z" fill="#34A853"/>
    <path d="M11.016 28.488A14.43 14.43 0 0 1 10.2 24c0-1.572.276-3.096.816-4.488V13.272H3.012A23.95 23.95 0 0 0 .48 24c0 3.876.924 7.548 2.532 10.728l7.944-6.24h.06z" fill="#FBBC05"/>
    <path d="M24.48 9.576c3.528 0 6.684 1.212 9.168 3.6l6.876-6.876C36.396 2.388 30.96 0 24.48 0 15.204 0 6.972 5.1 3.012 13.272l8.004 6.24c1.896-5.688 7.2-9.936 13.464-9.936z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

// ── Divider ──────────────────────────────────────────────────────────────────
const Divider = ({ text }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{text}</span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);

// ── Social Button ─────────────────────────────────────────────────────────────
const SocialButton = ({ onClick, icon, label, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800
               bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60
               text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium
               transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
               active:scale-[0.98] shadow-sm"
  >
    {icon}
    <span>{label}</span>
  </button>
);

// ── Input Field ───────────────────────────────────────────────────────────────
const Field = ({ label, type = "text", value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850
                 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200
                 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20
                 transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-600"
    />
  </div>
);

// ── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  const { login, register, loginWithGoogle, loginWithGithub } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Email form state
  const [email, setEmail]           = useState("");
  const [name, setName]             = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Feedback
  const [errorMsg, setErrorMsg]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading]     = useState(false);

  const clearMessages = () => { setErrorMsg(""); setSuccessMsg(""); };

  const handleSocialLogin = async (providerFn) => {
    clearMessages();
    setLoading(true);
    const result = await providerFn();
    setLoading(false);
    if (!result.success) setErrorMsg(result.error);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) { setErrorMsg("Email and password are required."); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setErrorMsg(result.error);
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) { setErrorMsg("Email and password are required."); return; }
    if (password !== confirmPass) { setErrorMsg("Passwords do not match."); return; }
    if (password.length < 6) { setErrorMsg("Password must be at least 6 characters."); return; }
    setLoading(true);
    const result = await register(email, password, name);
    setLoading(false);
    if (result.success) {
      setSuccessMsg(result.message);
    } else {
      setErrorMsg(result.error);
    }
  };

  const switchTab = (toLogin) => {
    setIsLoginTab(toLogin);
    setShowEmailForm(false);
    clearMessages();
    setEmail(""); setPassword(""); setName(""); setConfirmPass("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center space-y-1 border-b border-slate-100 dark:border-slate-800">
            <div className="text-3xl mb-2">🤖</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              AgentFlow Workstation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Local AI assistant powered by Ollama
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {["Sign In", "Create Account"].map((label, i) => {
              const active = i === 0 ? isLoginTab : !isLoginTab;
              return (
                <button
                  key={label}
                  onClick={() => switchTab(i === 0)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    active
                      ? "border-b-2 border-indigo-500 text-indigo-650 dark:text-indigo-400"
                      : "text-slate-405 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="px-8 py-6 space-y-3">

            {/* Alerts */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 p-3 rounded-xl text-sm">
                {successMsg}
              </div>
            )}

            {/* Social Buttons — always visible */}
            <SocialButton
              onClick={() => handleSocialLogin(loginWithGoogle)}
              icon={<GoogleIcon />}
              label={`${isLoginTab ? "Continue" : "Sign up"} with Google`}
              disabled={loading}
            />
            <SocialButton
              onClick={() => handleSocialLogin(loginWithGithub)}
              icon={<GithubIcon />}
              label={`${isLoginTab ? "Continue" : "Sign up"} with GitHub`}
              disabled={loading}
            />

            {/* Toggle email form */}
            {!showEmailForm ? (
              <>
                <Divider text="or" />
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800
                             bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60
                             text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium
                             transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-sm"
                >
                  <EmailIcon />
                  <span>{isLoginTab ? "Sign in" : "Sign up"} with Email</span>
                </button>
              </>
            ) : (
              <>
                <Divider text="email & password" />

                {/* ── Sign In Form ── */}
                {isLoginTab ? (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <Field
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                    <Field
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700
                                 disabled:opacity-50 text-white font-semibold rounded-xl text-sm
                                 transition-all duration-150 cursor-pointer shadow-md mt-2"
                    >
                      {loading ? "Signing in…" : "Sign In"}
                    </button>
                  </form>
                ) : (
                  /* ── Register Form ── */
                  <form onSubmit={handleEmailRegister} className="space-y-4">
                    <Field
                      label="Display Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                    <Field
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                    />
                    <Field
                      label="Confirm Password"
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Re-type your password"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700
                                 disabled:opacity-50 text-white font-semibold rounded-xl text-sm
                                 transition-all duration-150 cursor-pointer shadow-md mt-2"
                    >
                      {loading ? "Creating account…" : "Create Account"}
                    </button>
                  </form>
                )}

                {/* Back to social options */}
                <button
                  type="button"
                  onClick={() => { setShowEmailForm(false); clearMessages(); }}
                  className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer mt-1"
                >
                  ← Back to other sign-in options
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Secure · Local · Private · Powered by Ollama
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
