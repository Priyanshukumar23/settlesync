import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GroupClient } from "./GroupClient";
import { ExpensesClient } from "./ExpensesClient";
import { SettlementsClient } from "./SettlementsClient";
import { ReportsClient } from "./ReportsClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BalanceService } from "@/lib/BalanceService";
import { formatDate } from "@/lib/utils";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolvedParams = await params;

  const group = await prisma.group.findUnique({
    where: { id: resolvedParams.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: 'asc' }
      }
    }
  });

  if (!group) {
    return <div className="p-8">Group not found.</div>;
  }

  const currentUserMembership = group.members.find(m => m.userId === session.userId && m.leftAt === null);

  if (!currentUserMembership) {
    redirect("/dashboard?error=unauthorized");
  }

  const expenses = await prisma.expense.findMany({
    where: { groupId: resolvedParams.id },
    include: { paidBy: { select: { name: true } } },
    orderBy: { date: 'desc' }
  });

  const groupBalances = await BalanceService.getGroupBalances(resolvedParams.id);
  const myBal = groupBalances[session.userId] || { netBalance: 0, owedTotal: 0, paidTotal: 0 };
  const suggestions = BalanceService.getSettlementSuggestions(groupBalances);
  const breakdown = await BalanceService.getBalanceBreakdown(resolvedParams.id, session.userId);

  const settlements = await prisma.settlement.findMany({
    where: { groupId: resolvedParams.id },
    include: { payer: { select: { name: true } }, payee: { select: { name: true } } },
    orderBy: { date: 'desc' }
  });

  const reports = await prisma.importReport.findMany({
    where: { groupId: resolvedParams.id },
    include: { uploadedBy: { select: { name: true } }, issues: true },
    orderBy: { createdAt: 'desc' }
  });

  const isOwner = currentUserMembership.role === "OWNER";
  const activeMembers = group.members.filter(m => m.leftAt === null);
  const pastMembers = group.members.filter(m => m.leftAt !== null);

  return (
    <main className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <Link href="/dashboard" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium">
            <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
          </Link>
          <ThemeToggle />
        </header>

        <div className="glass p-8 rounded-2xl mb-8 border border-gray-200 dark:border-gray-800 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"></div>
          <div className="flex justify-between items-start mt-2">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">{group.name}</h1>
              <p className="text-[var(--text-secondary)] max-w-2xl text-lg">{group.description || "No description provided."}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${isOwner ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800'}`}>
              Your Role: {currentUserMembership.role}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Your Net Balance</h3>
                <p className={`text-3xl font-bold ${myBal.netBalance >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                  {myBal.netBalance < 0 ? '-' : ''}₹{Math.abs(myBal.netBalance).toFixed(2)}
                </p>
              </div>
              <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Group Expenses</h3>
                <p className="text-3xl font-bold text-[var(--primary)]">
                  ₹{expenses.reduce((sum, e) => sum + e.convertedAmount, 0).toFixed(2)}
                </p>
              </div>
            </div>

            <ExpensesClient 
              groupId={group.id}
              currentUserId={session.userId}
              members={activeMembers}
              expenses={expenses}
              isOwner={isOwner}
            />

            {/* Settlement Suggestions */}
            <SettlementsClient groupId={group.id} suggestions={suggestions} />

            {/* Recent Settlements */}
            <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
               <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Recent Settlements</h2>
               {settlements.length === 0 ? (
                 <p className="text-[var(--text-secondary)]">No settlements recorded.</p>
               ) : (
                 <div className="space-y-3">
                   {settlements.map((s) => (
                     <div key={s.id} className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-sm">
                       <span className="font-semibold">{s.payer.name}</span> paid <span className="font-semibold">{s.payee.name}</span> <strong className="text-[var(--success)]">₹{s.amount.toFixed(2)}</strong>
                       <span className="text-xs text-[var(--text-secondary)] block mt-1">{formatDate(s.date)} {s.notes ? `- ${s.notes}` : ''}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Balance Breakdown */}
            <div className="glass p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
               <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Your Ledger</h2>
               {breakdown.length === 0 ? (
                 <p className="text-[var(--text-secondary)]">No activity yet.</p>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead>
                       <tr className="text-[var(--text-secondary)] border-b border-gray-200 dark:border-gray-800">
                         <th className="pb-2">Date</th>
                         <th className="pb-2">Description</th>
                         <th className="pb-2 text-right">Amount</th>
                         <th className="pb-2 text-right">Balance</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                       {breakdown.map((b, idx) => (
                         <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                           <td className="py-3">{formatDate(b.date)}</td>
                           <td className="py-3">{b.description}</td>
                           <td className={`py-3 text-right font-medium ${(b.type === 'EXPENSE_PAID' || b.type === 'SETTLEMENT_RECEIVED') ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                             {(b.type === 'EXPENSE_PAID' || b.type === 'SETTLEMENT_RECEIVED') ? '+' : '-'}₹{b.amount.toFixed(2)}
                           </td>
                           <td className={`py-3 text-right font-bold ${b.runningBalance >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                             {b.runningBalance < 0 ? '-' : ''}₹{Math.abs(b.runningBalance).toFixed(2)}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>

            <ReportsClient reports={reports} />
          </div>

          <div className="lg:col-span-1">
            <GroupClient 
              groupId={group.id} 
              isOwner={isOwner} 
              activeMembers={activeMembers}
              pastMembers={pastMembers}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
