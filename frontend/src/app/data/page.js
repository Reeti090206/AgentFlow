"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DataAnalysis() {
  const { selectedModel, backendUrl } = useAuth();

  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [report, setReport] = useState("");
  const [columns, setColumns] = useState([]);
  const [rowsCount, setRowsCount] = useState(0);
  const [colsCount, setColsCount] = useState(0);
  const [preview, setPreview] = useState([]);

  const [qVal, setQVal] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e) => {
    setErrorMsg("");
    setReport("");
    setPreview([]);
    setAnswer("");
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilename(selected.name);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setErrorMsg("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${backendUrl}/api/data/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setReport(data.report);
        setColumns(data.columns || []);
        setRowsCount(data.rows_count);
        setColsCount(data.columns_count);
        setPreview(data.preview || []);
      } else {
        setErrorMsg(data.detail || "Error analyzing CSV file");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!qVal.trim() || !report || qLoading) return;

    setErrorMsg("");
    setQLoading(true);
    setAnswer("");

    try {
      const response = await fetch(`${backendUrl}/api/data/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: qVal,
          dataset_report: report,
          model: selectedModel
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAnswer(data.answer);
      } else {
        setErrorMsg(data.detail || "Error querying data insights");
      }
    } catch (err) {
      setErrorMsg("Connection error: Could not reach port 8000.");
    } finally {
      setQLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">

      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-sans">📊 Data Analysis</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Upload any CSV dataset to compute standard descriptive metrics and query statistical trends.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-505 dark:text-red-400 p-3 rounded-lg text-xs max-w-xl">
          {errorMsg}
        </div>
      )}

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Upload Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-fit space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Upload Dataset</h3>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-350 dark:border-slate-850 hover:border-indigo-500 dark:hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50 dark:bg-slate-950/40">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <span className="text-2xl">📊</span>
              <p className="text-xs text-slate-700 dark:text-slate-350 mt-2 font-medium">
                {filename ? filename : "Drag & drop or click to upload"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Accepts CSV database files only</p>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-md shadow-indigo-650/10"
            >
              {loading ? "Analyzing Dataset..." : "Run CSV Profiler"}
            </button>
          </form>

          {/* Quick Metrics */}
          {preview.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-lg space-y-2 text-xs">
              <p className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Metadata Profile</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Rows:</span>
                <span className="text-slate-900 dark:text-white font-semibold">{rowsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Columns:</span>
                <span className="text-slate-900 dark:text-white font-semibold">{colsCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Data Preview & Insights */}
        <div className="lg:col-span-2 space-y-6">
          {preview.length > 0 ? (
            <div className="space-y-6">

              {/* Spreadsheet Grid Preview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">📋 Data Preview (First 5 Rows)</h3>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-850 text-left text-xs bg-slate-50 dark:bg-slate-950">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-605 dark:text-slate-400 font-semibold">
                      <tr>
                        {columns.map((col, idx) => (
                          <th key={idx} className="px-4 py-3 border-r border-slate-200 dark:border-slate-850 last:border-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                      {preview.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white dark:hover:bg-slate-900/50 bg-white dark:bg-slate-950 transition-colors">
                          {columns.map((col, cIdx) => (
                            <td key={cIdx} className="px-4 py-3 border-r border-slate-200 dark:border-slate-850 last:border-0 truncate max-w-[200px]">
                              {row[col] !== undefined && row[col] !== null ? String(row[col]) : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analytics & LLM QA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Stats Report */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">📈 Descriptive Statistics</h3>
                  <pre className="text-[10px] text-slate-700 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-lg max-h-[300px] overflow-y-auto whitespace-pre">
                    {report}
                  </pre>
                </div>

                {/* AI Insights Agent */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">💡 AI Insights Agent</h3>
                  <form onSubmit={handleQuerySubmit} className="space-y-3">
                    <input
                      type="text"
                      value={qVal}
                      onChange={(e) => setQVal(e.target.value)}
                      placeholder="e.g., Which column has missing values?"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={qLoading || !qVal.trim()}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {qLoading ? "Analyzing..." : "Ask Agent"}
                    </button>
                  </form>

                  {answer && (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-4 text-xs text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text max-h-[190px] overflow-y-auto">
                      <p className="font-bold text-indigo-650 dark:text-indigo-400 mb-1">Insights:</p>
                      {answer}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 dark:text-slate-500 shadow-sm">
              <span className="text-3xl block">📊</span>
              <p className="text-sm mt-3">Upload a CSV file to render visual database tables and compile insights.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
