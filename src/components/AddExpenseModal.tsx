"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function AddExpenseModal({ isOpen, onClose, groupId, currentUserId, members }: any) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitMethod, setSplitMethod] = useState("EQUAL");
  const [participants, setParticipants] = useState<any>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialParts: any = {};
      members.forEach((m: any) => {
        initialParts[m.user.id] = { included: true, share: "" };
      });
      setParticipants(initialParts);
      setPaidById(currentUserId);
    }
  }, [isOpen, members, currentUserId]);

  if (!isOpen) return null;

  const handleToggleParticipant = (userId: string) => {
    setParticipants({
      ...participants,
      [userId]: { ...participants[userId], included: !participants[userId].included }
    });
  };

  const handleShareChange = (userId: string, val: string) => {
    setParticipants({
      ...participants,
      [userId]: { ...participants[userId], share: val }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const activeParticipants = Object.keys(participants)
      .filter(id => participants[id].included)
      .map(id => ({ userId: id, share: participants[id].share }));

    if (activeParticipants.length === 0) {
      setMessage({ type: 'error', text: "Select at least one participant" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, amount, currency, paidById, splitMethod, participants: activeParticipants
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || "Failed to add expense" });
      } else {
        setMessage({ type: 'success', text: "Expense added!" });
        setTitle(""); setDescription(""); setAmount("");
        router.refresh();
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass p-6 rounded-xl w-full max-w-2xl relative bg-[var(--background)] border border-gray-200 dark:border-gray-800 shadow-2xl my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Add an Expense</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Description</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Dinner" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="flex gap-3">
              <div className="w-1/3">
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="w-2/3">
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Paid By</label>
              <select value={paidById} onChange={e => setPaidById(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]">
                {members.map((m: any) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Split Method</label>
              <select value={splitMethod} onChange={e => setSplitMethod(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]">
                <option value="EQUAL">Split Equally</option>
                <option value="EXACT">Exact Amounts</option>
                <option value="PERCENTAGE">Percentages</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">Split with:</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {members.map((m: any) => (
                <div key={m.user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={participants[m.user.id]?.included || false}
                      onChange={() => handleToggleParticipant(m.user.id)}
                      className="mr-3 h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded border-gray-300"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{m.user.name}</span>
                  </label>
                  
                  {participants[m.user.id]?.included && splitMethod !== "EQUAL" && (
                    <input 
                      type="number" step="0.01"
                      placeholder={splitMethod === 'PERCENTAGE' ? '%' : (currency === 'USD' ? '$' : '₹')}
                      value={participants[m.user.id]?.share || ""}
                      onChange={(e) => handleShareChange(m.user.id, e.target.value)}
                      required
                      className="w-24 p-1 text-sm text-right rounded border border-gray-300 dark:border-gray-600 bg-transparent text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-[var(--primary)] text-white p-3 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 mt-4">
            {isLoading ? "Saving..." : "Save Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
