"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, AlertTriangle, FileText, Check } from "lucide-react";

export function ImportCsvModal({ isOpen, onClose, groupId }: any) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const handleResolutionChange = (rowNumber: number, field: string, value: string) => {
     setResolutions(prev => ({
       ...prev,
       [`${rowNumber}_${field}`]: value
     }));
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysisResult(null);
      setMessage(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setMessage(null);

    try {
      const text = await file.text();
      const res = await fetch(`/api/groups/${groupId}/import/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || "Analysis failed" });
      } else {
        setAnalysisResult(data);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: "Failed to read or analyze file" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/import/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validRows: analysisResult.validRows,
          anomalies: analysisResult.anomalies,
          resolutions,
          totalRows: analysisResult.totalRows
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || "Import execution failed" });
      } else {
        setMessage({ type: 'success', text: `Import complete! Expenses: ${data.importedExpenses}, Settlements: ${data.importedSettlements}, Skipped: ${data.skippedRows}` });
        router.refresh(); 
        setTimeout(() => {
          onClose();
          setAnalysisResult(null);
          setFile(null);
        }, 3000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: "An error occurred during execution." });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass p-6 rounded-xl w-full max-w-3xl relative bg-[var(--background)] border border-gray-200 dark:border-gray-800 shadow-2xl my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)] flex items-center">
          <Upload className="mr-2 text-[var(--primary)]" /> Import CSV
        </h2>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message.text}
          </div>
        )}

        {!analysisResult ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                <FileText size={48} className="text-gray-400 mb-4" />
                <span className="text-lg font-medium text-[var(--text-primary)] mb-1">
                  {file ? file.name : "Click to upload expenses_export.csv"}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">Only .csv files are supported</span>
              </label>
            </div>
            
            <button 
              onClick={handleAnalyze} 
              disabled={!file || isAnalyzing}
              className="w-full bg-[var(--primary)] text-white p-3 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing file..." : "Analyze File"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{analysisResult.totalRows}</p>
                <p className="text-sm text-[var(--text-secondary)]">Total Rows</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-[var(--success)]">{analysisResult.validRows.length}</p>
                <p className="text-sm text-[var(--text-secondary)]">Valid/Fixable</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analysisResult.anomalies.length}</p>
                <p className="text-sm text-[var(--text-secondary)]">Anomalies Detected</p>
              </div>
            </div>

            {analysisResult.anomalies.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-800 flex items-center">
                  <AlertTriangle size={18} className="text-amber-500 mr-2" />
                  <h3 className="font-bold text-[var(--text-primary)]">Detected Anomalies</h3>
                </div>
                <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                  {analysisResult.anomalies.map((a: any, idx: number) => (
                    <div key={idx} className="flex flex-col text-sm pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">Row {a.rowNumber}: <span className={a.severity === 'ERROR' ? 'text-[var(--error)]' : 'text-amber-500'}>[{a.severity}]</span></p>
                          <p className="text-[var(--text-secondary)] mt-0.5">{a.issue}</p>
                          {a.originalValue && (
                            <p className="text-xs text-gray-500 mt-1">
                              Original: {a.originalValue.title || 'N/A'} | {a.originalValue.amount || 'N/A'} {a.originalValue.currency || ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {a.suggestedFixes && Object.keys(a.suggestedFixes).length > 0 ? (
                        <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                          {Object.entries(a.suggestedFixes).map(([field, options]: [string, any]) => (
                             <div key={field} className="flex items-center gap-2">
                               <span className="text-xs font-medium text-[var(--text-secondary)] capitalize">{field} Fix:</span>
                               <select 
                                 className="text-xs p-1 rounded border border-gray-300 dark:border-gray-600 bg-[var(--background)] text-[var(--text-primary)]"
                                 value={resolutions[`${a.rowNumber}_${field}`] || ""}
                                 onChange={(e) => handleResolutionChange(a.rowNumber, field, e.target.value)}
                               >
                                 <option value="" disabled>Select resolution...</option>
                                 {options.map((opt: string) => (
                                   <option key={opt} value={opt}>{opt}</option>
                                 ))}
                                 <option value="Reject Row">Reject Row</option>
                               </select>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 pl-4 border-l-2 border-red-200 dark:border-red-900/50">
                          <span className="text-xs text-[var(--error)]">Row must be fixed manually or skipped.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setAnalysisResult(null)} className="flex-1 p-3 rounded-lg font-medium border border-gray-300 dark:border-gray-700 text-[var(--text-primary)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Upload Different File
              </button>
              <button 
                onClick={handleImport}
                disabled={isImporting || analysisResult.validRows.length === 0}
                className="flex-1 bg-[var(--primary)] text-white p-3 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isImporting ? "Importing..." : <><Check size={18} className="mr-2" /> Approve & Import Data</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
