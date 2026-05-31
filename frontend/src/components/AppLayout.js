"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import Login from "@/app/login/page";
import Navigation from "@/components/Navigation";

export default function AppLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">
        <div className="flex flex-col items-center space-y-4 font-sans">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-zinc-900 dark:border-zinc-100 border-r-2"></div>
          <p className="text-sm font-medium tracking-wide">Initializing secure local workstation...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-955 text-zinc-900 dark:text-zinc-100 font-sans">
      <Navigation />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
