"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function GroupClient({ groupId, isOwner, activeMembers, pastMembers }: any) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string}|null>(null);
  
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || "Failed to add member" });
      } else {
        setMessage({ type: 'success', text: "Member added successfully!" });
        setEmail("");
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member? Their historical data will be preserved.")) return;
    
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      alert("An error occurred");
    }
  };

  return (
    <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Members ({activeMembers.length})</h2>
      </div>

      {isOwner && (
        <form onSubmit={handleAddMember} className="mb-8 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)] flex items-center">
            <UserPlus size={16} className="mr-2 text-[var(--primary)]" /> Invite Member
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
            />
            <button 
              type="submit" 
              disabled={isLoading || !email}
              className="w-full sm:w-auto bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              Add Member
            </button>
          </div>
          {message && (
             <p className={`mt-3 text-xs font-medium p-2 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
               {message.text}
             </p>
          )}
        </form>
      )}

      <div className="space-y-3">
        {activeMembers.map((m: any) => (
          <div key={m.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{m.user.name}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Joined {formatDate(m.joinedAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${m.role === 'OWNER' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                {m.role}
              </span>
              {isOwner && m.role !== 'OWNER' && (
                <button 
                  onClick={() => handleRemoveMember(m.user.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove Member"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pastMembers.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">Past Members</h3>
          <div className="space-y-3 opacity-70">
            {pastMembers.map((m: any) => (
              <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)] line-through">{m.user.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Left {formatDate(m.leftAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
