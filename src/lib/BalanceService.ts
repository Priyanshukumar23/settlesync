import prisma from "@/lib/prisma";

export type SettlementSuggestion = {
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
};

export type MemberBalance = {
  userId: string;
  name: string;
  email: string;
  paidTotal: number;
  owedTotal: number;
  netBalance: number;
};

export type BalanceBreakdownEntry = {
  date: Date;
  description: string;
  amount: number;
  type: 'EXPENSE_PAID' | 'EXPENSE_OWED' | 'SETTLEMENT_PAID' | 'SETTLEMENT_RECEIVED';
  runningBalance: number;
};

export class BalanceService {
  /**
   * Calculates the net balance for all members in a group.
   */
  static async getGroupBalances(groupId: string): Promise<Record<string, MemberBalance>> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: true } },
        expenses: {
          include: { participants: true }
        },
        settlements: true
      }
    });

    if (!group) throw new Error("Group not found");

    const balances: Record<string, MemberBalance> = {};

    // Initialize all members (even past ones if they had balances, but we'll stick to group.members which includes all)
    for (const member of group.members) {
      balances[member.userId] = {
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        paidTotal: 0,
        owedTotal: 0,
        netBalance: 0
      };
    }

    // Process Expenses
    for (const expense of group.expenses) {
      if (balances[expense.paidById]) {
        balances[expense.paidById].paidTotal += expense.convertedAmount;
        balances[expense.paidById].netBalance += expense.convertedAmount;
      }

      for (const participant of expense.participants) {
        // Enforce membership dates: Only count if expense date is within [joinedAt, leftAt]
        const membership = group.members.find(m => m.userId === participant.userId);
        if (!membership) continue;

        const expenseTime = new Date(expense.date).toISOString().split('T')[0];
        const joinTime = new Date(membership.joinedAt).toISOString().split('T')[0];
        const leaveTime = membership.leftAt ? new Date(membership.leftAt).toISOString().split('T')[0] : "9999-12-31";

        const isAfterJoin = expenseTime >= joinTime;
        const isBeforeLeave = expenseTime <= leaveTime;

        if (isAfterJoin && isBeforeLeave) {
           if (balances[participant.userId]) {
             balances[participant.userId].owedTotal += participant.amountOwed;
             balances[participant.userId].netBalance -= participant.amountOwed;
           }
        }
      }
    }

    // Process Settlements
    for (const settlement of group.settlements) {
      if (balances[settlement.payerId]) {
        balances[settlement.payerId].netBalance += settlement.amount;
      }
      if (balances[settlement.payeeId]) {
        balances[settlement.payeeId].netBalance -= settlement.amount;
      }
    }

    // Fix floating point errors
    for (const userId in balances) {
      balances[userId].netBalance = Number(balances[userId].netBalance.toFixed(2));
      balances[userId].paidTotal = Number(balances[userId].paidTotal.toFixed(2));
      balances[userId].owedTotal = Number(balances[userId].owedTotal.toFixed(2));
    }

    return balances;
  }

  /**
   * Generates a detailed breakdown of every transaction affecting a user's balance
   */
  static async getBalanceBreakdown(groupId: string, userId: string): Promise<BalanceBreakdownEntry[]> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        expenses: { include: { participants: true } },
        settlements: true
      }
    });

    if (!group) return [];

    const breakdown: BalanceBreakdownEntry[] = [];
    
    for (const exp of group.expenses) {
      if (exp.paidById === userId) {
        breakdown.push({
          date: exp.date,
          description: `Paid for ${exp.title}`,
          amount: exp.convertedAmount,
          type: 'EXPENSE_PAID',
          runningBalance: 0
        });
      }
      const participation = exp.participants.find(p => p.userId === userId);
      const membership = group.members.find(m => m.userId === userId);
      
      if (participation && membership) {
        const expenseTime = new Date(exp.date).toISOString().split('T')[0];
        const joinTime = new Date(membership.joinedAt).toISOString().split('T')[0];
        const leaveTime = membership.leftAt ? new Date(membership.leftAt).toISOString().split('T')[0] : "9999-12-31";

        const isAfterJoin = expenseTime >= joinTime;
        const isBeforeLeave = expenseTime <= leaveTime;
        
        if (isAfterJoin && isBeforeLeave) {
          breakdown.push({
            date: exp.date,
            description: `Owed for ${exp.title}`,
            amount: participation.amountOwed,
            type: 'EXPENSE_OWED',
            runningBalance: 0
          });
        }
      }
    }

    for (const set of group.settlements) {
      if (set.payerId === userId) {
        breakdown.push({
          date: set.date,
          description: `Paid settlement ${set.notes ? `(${set.notes})` : ''}`,
          amount: set.amount,
          type: 'SETTLEMENT_PAID',
          runningBalance: 0
        });
      }
      if (set.payeeId === userId) {
        breakdown.push({
          date: set.date,
          description: `Received settlement ${set.notes ? `(${set.notes})` : ''}`,
          amount: set.amount,
          type: 'SETTLEMENT_RECEIVED',
          runningBalance: 0
        });
      }
    }

    // Sort chronologically and calculate running balance
    breakdown.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let running = 0;
    for (const entry of breakdown) {
      if (entry.type === 'EXPENSE_PAID' || entry.type === 'SETTLEMENT_PAID') {
        running += entry.amount;
      } else {
        running -= entry.amount;
      }
      entry.runningBalance = Number(running.toFixed(2));
    }

    return breakdown;
  }

  /**
   * Debt Simplification (Minimum Cash Flow Algorithm)
   */
  static getSettlementSuggestions(balances: Record<string, MemberBalance>): SettlementSuggestion[] {
    const debtors: { id: string, name: string, amount: number }[] = [];
    const creditors: { id: string, name: string, amount: number }[] = [];

    for (const userId in balances) {
      const b = balances[userId];
      if (b.netBalance < -0.01) {
        debtors.push({ id: b.userId, name: b.name, amount: Math.abs(b.netBalance) });
      } else if (b.netBalance > 0.01) {
        creditors.push({ id: b.userId, name: b.name, amount: b.netBalance });
      }
    }

    // Sort descending by amount to minimize transactions greedily
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const suggestions: SettlementSuggestion[] = [];
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const settledAmount = Math.min(debtor.amount, creditor.amount);
      
      suggestions.push({
        payerId: debtor.id,
        payerName: debtor.name,
        payeeId: creditor.id,
        payeeName: creditor.name,
        amount: Number(settledAmount.toFixed(2))
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return suggestions;
  }

  static async getUserTotalBalance(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId, leftAt: null },
      select: { groupId: true }
    });
    
    let totalNet = 0;
    let totalOwe = 0;
    let totalOwed = 0;

    for (const m of memberships) {
      const balances = await this.getGroupBalances(m.groupId);
      const myBal = balances[userId];
      if (myBal) {
        totalNet += myBal.netBalance;
        if (myBal.netBalance < -0.01) totalOwe += Math.abs(myBal.netBalance);
        if (myBal.netBalance > 0.01) totalOwed += myBal.netBalance;
      }
    }
    return { 
      net: Number(totalNet.toFixed(2)), 
      owe: Number(totalOwe.toFixed(2)), 
      owed: Number(totalOwed.toFixed(2)) 
    };
  }
}
