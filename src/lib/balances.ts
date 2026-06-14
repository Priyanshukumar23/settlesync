import prisma from "@/lib/prisma";
import { getExchangeRate } from "./exchangeRates";

export type BalanceLedgerEntry = {
  type: "EXPENSE" | "SETTLEMENT";
  id: string;
  title?: string;
  date: Date;
  amountChange: number; // positive means they get money, negative means they owe money
  currency: string;
  originalAmount: number;
};

export type UserBalance = {
  userId: string;
  netBalance: number; // INR
  totalOwed: number; // INR
  totalToReceive: number; // INR
  ledger: BalanceLedgerEntry[];
};

export async function calculateGroupBalances(groupId: string): Promise<Record<string, UserBalance>> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: true,
      expenses: {
        include: { participants: true }
      },
      settlements: true
    }
  });

  if (!group) throw new Error("Group not found");

  const balances: Record<string, UserBalance> = {};
  for (const member of group.members) {
    balances[member.userId] = {
      userId: member.userId,
      netBalance: 0,
      totalOwed: 0,
      totalToReceive: 0,
      ledger: []
    };
  }

  // Process Expenses
  for (const expense of group.expenses) {
    const expenseDate = new Date(expense.date);

    // If a member paid for the expense
    if (balances[expense.paidById]) {
      const memberInfo = group.members.find(m => m.userId === expense.paidById);
      if (memberInfo && expenseDate >= memberInfo.joinedAt && (!memberInfo.leftAt || expenseDate <= memberInfo.leftAt)) {
         balances[expense.paidById].ledger.push({
           type: "EXPENSE",
           id: expense.id,
           title: `Paid: ${expense.title}`,
           date: expense.date,
           amountChange: expense.convertedAmount,
           currency: expense.originalCurrency,
           originalAmount: expense.originalAmount
         });
         balances[expense.paidById].netBalance += expense.convertedAmount;
         balances[expense.paidById].totalToReceive += expense.convertedAmount;
      }
    }

    // Process participants who owe money for this expense
    for (const participant of expense.participants) {
      if (balances[participant.userId]) {
        const memberInfo = group.members.find(m => m.userId === participant.userId);
        if (memberInfo && expenseDate >= memberInfo.joinedAt && (!memberInfo.leftAt || expenseDate <= memberInfo.leftAt)) {
          const ratio = participant.amountOwed / expense.originalAmount;
          const convertedOwed = expense.convertedAmount * ratio;

          balances[participant.userId].ledger.push({
            type: "EXPENSE",
            id: expense.id,
            title: `Owe: ${expense.title}`,
            date: expense.date,
            amountChange: -convertedOwed,
            currency: expense.originalCurrency,
            originalAmount: participant.amountOwed
          });
          balances[participant.userId].netBalance -= convertedOwed;
          balances[participant.userId].totalOwed += convertedOwed;
        }
      }
    }
  }

  // Process Settlements
  for (const settlement of group.settlements) {
    const rate = getExchangeRate(settlement.currency);
    const convertedSettlement = settlement.amount * rate;

    // Payer balance increases (they paid their debt)
    if (balances[settlement.payerId]) {
      balances[settlement.payerId].ledger.push({
        type: "SETTLEMENT",
        id: settlement.id,
        title: `Paid settlement`,
        date: settlement.date,
        amountChange: convertedSettlement,
        currency: settlement.currency,
        originalAmount: settlement.amount
      });
      balances[settlement.payerId].netBalance += convertedSettlement;
    }

    // Payee balance decreases (they received their money)
    if (balances[settlement.payeeId]) {
      balances[settlement.payeeId].ledger.push({
        type: "SETTLEMENT",
        id: settlement.id,
        title: `Received settlement`,
        date: settlement.date,
        amountChange: -convertedSettlement,
        currency: settlement.currency,
        originalAmount: settlement.amount
      });
      balances[settlement.payeeId].netBalance -= convertedSettlement;
    }
  }

  return balances;
}

export function calculateSuggestedSettlements(balances: Record<string, UserBalance>) {
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance.netBalance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance.netBalance) });
    } else if (balance.netBalance > 0.01) {
      creditors.push({ userId, amount: balance.netBalance });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(amount * 100) / 100;
    
    if (roundedAmount > 0) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: roundedAmount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}
