"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000");

  useEffect(() => {
    // Read cached login status on mount
    const savedUser = localStorage.getItem("agent_username");
    const savedModel = localStorage.getItem("agent_selected_model");
    const savedHost = localStorage.getItem("agent_ollama_host");

    if (savedUser) {
      setUser(savedUser);
    }
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    if (savedHost) {
      setOllamaHost(savedHost);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser(data.username);
        localStorage.setItem("agent_username", data.username);
        return { success: true };
      } else {
        return { success: false, error: data.detail || "Authentication failed" };
      }
    } catch (err) {
      return { success: false, error: "Cannot connect to local backend server (port 8000)." };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.detail || "Registration failed" };
      }
    } catch (err) {
      return { success: false, error: "Cannot connect to local backend server (port 8000)." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("agent_username");
  };

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
    updateModel,
    updateHost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
