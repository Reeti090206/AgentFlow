"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("qwen2.5:1.5b");
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");

  // ── Firebase auth state listener ──────────────────────────────────────────
  useEffect(() => {
    const savedModel = localStorage.getItem("agent_selected_model");
    const savedHost  = localStorage.getItem("agent_ollama_host");
    if (savedModel) setSelectedModel(savedModel);
    if (savedHost)  setOllamaHost(savedHost);

    // Dynamic model discovery for faster default selection
    const discoverDefaultModel = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/settings/status");
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            const qwenModel = data.models.find(m => m.toLowerCase().includes("qwen"));
            // Proactively switch from slow llama3 or unset values to fast qwen2.5:1.5b if available
            if (qwenModel && (!savedModel || savedModel === "llama3" || savedModel.toLowerCase().includes("llama3"))) {
              setSelectedModel(qwenModel);
              localStorage.setItem("agent_selected_model", qwenModel);
            } else if (!savedModel) {
              const lightweight = data.models.find(m => m.toLowerCase().includes("phi") || m.toLowerCase().includes("1.5b"));
              const finalDefault = lightweight || data.models[0];
              setSelectedModel(finalDefault);
              localStorage.setItem("agent_selected_model", finalDefault);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch models on startup for default setting:", err);
      }
    };
    discoverDefaultModel();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Build a normalised user object from the Firebase user
        setUser({
          uid:         firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email:       firebaseUser.email,
          photoURL:    firebaseUser.photoURL,
          provider:    firebaseUser.providerData[0]?.providerId || "firebase",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err) {
      return { success: false, error: _friendlyError(err) };
    }
  };

  // ── GitHub Sign-In ────────────────────────────────────────────────────────
  const loginWithGithub = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
      return { success: true };
    } catch (err) {
      return { success: false, error: _friendlyError(err) };
    }
  };

  // ── Firebase Email / Password Sign-In ────────────────────────────────────
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: _friendlyError(err) };
    }
  };

  // ── Firebase Email / Password Registration ────────────────────────────────
  const register = async (email, password, displayName) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      return { success: true, message: "Account created! You are now signed in." };
    } catch (err) {
      return { success: false, error: _friendlyError(err) };
    }
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ── Settings helpers ──────────────────────────────────────────────────────
  const updateModel = (modelName) => {
    setSelectedModel(modelName);
    localStorage.setItem("agent_selected_model", modelName);
  };

  const updateHost = async (hostUrl) => {
    setOllamaHost(hostUrl);
    localStorage.setItem("agent_ollama_host", hostUrl);
    try {
      await fetch(`${backendUrl}/api/settings/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: hostUrl }),
      });
    } catch (e) {
      console.error("Failed to sync host to backend:", e);
    }
  };

  // ── Friendly error messages ───────────────────────────────────────────────
  const _friendlyError = (err) => {
    const code = err?.code || "";
    const map = {
      "auth/user-not-found":        "No account found with this email.",
      "auth/wrong-password":        "Incorrect password. Please try again.",
      "auth/email-already-in-use":  "This email is already registered. Try signing in.",
      "auth/invalid-email":         "Please enter a valid email address.",
      "auth/weak-password":         "Password should be at least 6 characters.",
      "auth/popup-closed-by-user":  "Sign-in popup was closed. Please try again.",
      "auth/cancelled-popup-request": "Only one sign-in popup can open at a time.",
      "auth/account-exists-with-different-credential":
        "An account already exists with this email. Try a different sign-in method.",
      "auth/network-request-failed": "Network error. Check your internet connection.",
    };
    return map[code] || err?.message || "Authentication failed. Please try again.";
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    selectedModel,
    ollamaHost,
    backendUrl,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithGithub,
    updateModel,
    updateHost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
