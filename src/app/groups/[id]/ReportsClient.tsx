"use client";
import { useState } from "react";
import { FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ReportsClient({ reports }: any) {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  if (!reports || reports.length === 0) return null;

  return (
    <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm mt-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center">
        <FileText className="mr-2 text-[var(--primary)]" /> Import History
      </h2>

      <div className="space-y-4">
        {reports.map((report: any) => (
          <div key={report.id} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <div 
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
            >
              <div>
                <p className="font-bold text-[var(--text-primary)]">Import via CSV</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {formatDate(report.createdAt)} • by {report.uploadedBy.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${report.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                  {report.status}
                </span>
                {expandedReportId === report.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </div>

            {expandedReportId === report.id && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{report.issues.length}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Anomalies Detected</p>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 uppercase tracking-wider">Anomaly Resolutions</h4>
                
                {report.issues.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] italic">No anomalies found in this import.</p>
                ) : (
                  <div className="space-y-3">
                    {report.issues.map((issue: any) => (
                      <div key={issue.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-[var(--text-primary)]">Row {issue.rowNumber}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${issue.severity === 'ERROR' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-2"><span className="font-medium text-[var(--text-primary)]">Issue:</span> {issue.issue}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs"><span className="text-gray-500">Action Taken:</span> <span className="font-medium text-[var(--text-primary)]">{issue.actionTaken || 'None'}</span></p>
                          <p className="text-xs"><span className="text-gray-500">Final Result:</span> <span className="font-medium text-[var(--text-primary)]">{issue.finalResult}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
