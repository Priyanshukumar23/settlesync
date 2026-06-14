import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardGroups } from "./DashboardClient";
import prisma from "@/lib/prisma";
import { BalanceService } from "@/lib/BalanceService";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const userMemberships = await prisma.groupMember.findMany({
    where: { 
      userId: session.userId, 
      leftAt: null 
    },
    include: { group: true },
    orderBy: { joinedAt: 'desc' }
  });

  const totals = await BalanceService.getUserTotalBalance(session.userId);

  return (
    <main className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 glass p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--primary)] px-4">SettleSync Dashboard</h1>
          <div className="flex items-center gap-6 px-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
            <span className="text-[var(--text-secondary)] text-sm">Welcome, <strong className="text-[var(--text-primary)]">{session.email}</strong></span>
            <LogoutButton />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-2">Total Net Balance</h2>
            <p className={`text-4xl font-bold ${totals.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {totals.net < 0 ? '-' : ''}₹ {Math.abs(totals.net).toFixed(2)}
            </p>
          </div>
          <div className="glass p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-2">You Owe Total</h2>
            <p className="text-4xl font-bold text-[var(--error)]">₹ {totals.owe.toFixed(2)}</p>
          </div>
          <div className="glass p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium text-[var(--text-secondary)] mb-2">You are Owed Total</h2>
            <p className="text-4xl font-bold text-[var(--success)]">₹ {totals.owed.toFixed(2)}</p>
          </div>
        </div>

        <DashboardGroups groups={userMemberships} />
      </div>
    </main>
  );
}
