"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettlementsClient({ groupId, suggestions }: { groupId: string, suggestions: any[] }) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const handleRecordSettlement = async (suggestion: any, index: number) => {
    try {
      setLoadingIds(prev => [...prev, index]);
      
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerId: suggestion.payerId,
          payeeId: suggestion.payeeId,
          amount: suggestion.amount
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record settlement");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== index));
    }
  };

  return (
    <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Settlement Suggestions</h2>
      {suggestions.length === 0 ? (
        <p className="text-[var(--text-secondary)]">All settled up!</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 gap-3">
              <div>
                <span><strong>{s.payerName}</strong> should pay <strong>{s.payeeName}</strong></span>
                <span className="font-bold text-[var(--primary)] ml-2">₹{s.amount.toFixed(2)}</span>
              </div>
              <button
                onClick={() => handleRecordSettlement(s, idx)}
                disabled={loadingIds.includes(idx)}
                className="bg-[var(--primary)] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
              >
                {loadingIds.includes(idx) ? "Recording..." : "Record Settlement"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
