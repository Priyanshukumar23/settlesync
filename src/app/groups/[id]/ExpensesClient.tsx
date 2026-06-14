"use client";
import { useState } from "react";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { ImportCsvModal } from "@/components/ImportCsvModal";
import { formatDate } from "@/lib/utils";

export function ExpensesClient({ groupId, currentUserId, members, expenses, isOwner }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Recent Expenses</h2>
        <div className="flex gap-3">
          {isOwner && (
            <button 
              onClick={() => setIsImportOpen(true)}
              className="bg-[var(--background)] text-[var(--text-primary)] border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              Import CSV
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors shadow-sm"
          >
            + Add Expense
          </button>
        </div>
      </div>
      
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/20 text-[var(--text-secondary)] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp: any) => (
            <div key={exp.id} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[var(--text-primary)]">{exp.title}</h3>
                <span className="font-bold text-lg">
                  {exp.originalCurrency === 'USD' ? '$' : '₹'}{exp.originalAmount.toFixed(2)}
                  {exp.originalCurrency === 'USD' && <span className="text-xs text-[var(--text-secondary)] ml-2 font-normal">(₹{exp.convertedAmount.toFixed(2)})</span>}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
                <span>Paid by <strong className="text-[var(--text-primary)]">{exp.paidBy.name}</strong></span>
                <span>{formatDate(exp.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        groupId={groupId} 
        currentUserId={currentUserId}
        members={members}
      />

      <ImportCsvModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        groupId={groupId}
      />
    </div>
  );
}
