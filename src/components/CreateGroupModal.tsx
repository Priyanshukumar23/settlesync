"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function CreateGroupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || "Failed to create group" });
      } else {
        setMessage({ type: 'success', text: "Group created successfully!" });
        setName("");
        setDescription("");
        router.refresh();
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
      <div className="p-6 rounded-xl w-full max-w-md relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Create New Group</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Group Name</label>
            <input 
              value={name} onChange={e => setName(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
              placeholder="e.g. Trip to Goa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Description (Optional)</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
              placeholder="e.g. Expenses for the weekend trip"
              rows={3}
            />
          </div>
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-[var(--primary)] text-white p-3 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
