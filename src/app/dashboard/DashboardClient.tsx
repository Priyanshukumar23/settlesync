"use client";
import { useState } from "react";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export function DashboardGroups({ groups }: { groups: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mt-12 glass p-8 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Your Groups</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors shadow-sm text-sm"
        >
          + Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-[var(--text-secondary)] py-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
          <p className="mb-4">You are not part of any groups yet.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--secondary)] transition-colors shadow-sm"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(g => (
            <Link key={g.groupId} href={`/groups/${g.groupId}`} className="block glass p-6 rounded-xl hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-[var(--primary)]">
              <h3 className="font-bold text-xl text-[var(--text-primary)] mb-2 truncate">{g.group.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2 min-h-[40px]">{g.group.description || "No description provided."}</p>
              <div className="flex justify-between items-center">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${g.role === 'OWNER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                  {g.role}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  Joined {formatDate(g.joinedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
