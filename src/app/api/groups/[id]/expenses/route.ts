import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ExchangeRateService } from "@/lib/ExchangeRateService";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groupId = params.id;
    const body = await req.json();
    const { title, description, amount, currency = "INR", paidById, splitMethod, participants } = body;

    if (!title || !amount || !paidById || !splitMethod || !participants || participants.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId } }
    });
    if (!requesterMembership || requesterMembership.leftAt !== null) {
      return NextResponse.json({ error: "Only active members can add expenses" }, { status: 403 });
    }

    const payerMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidById } }
    });
    if (!payerMembership || payerMembership.leftAt !== null) {
      return NextResponse.json({ error: "Payer must be an active member" }, { status: 400 });
    }

    const originalAmount = parseFloat(amount);
    const exchangeRate = ExchangeRateService.getRate(currency);
    const convertedAmount = ExchangeRateService.convertToINR(originalAmount, currency);

    let calculatedParticipants: any[] = [];

    if (splitMethod === "EQUAL") {
      const splitAmount = Number((convertedAmount / participants.length).toFixed(2));
      calculatedParticipants = participants.map((p: any) => ({
        userId: p.userId,
        amountOwed: splitAmount,
        share: null
      }));
      const sum = calculatedParticipants.reduce((acc, p) => acc + p.amountOwed, 0);
      if (sum !== convertedAmount) {
        calculatedParticipants[0].amountOwed += (convertedAmount - sum);
        calculatedParticipants[0].amountOwed = Number(calculatedParticipants[0].amountOwed.toFixed(2));
      }
    } else if (splitMethod === "EXACT") {
      let sumOriginal = 0;
      calculatedParticipants = participants.map((p: any) => {
        const valOriginal = parseFloat(p.share);
        sumOriginal += valOriginal;
        const valConverted = ExchangeRateService.convertToINR(valOriginal, currency);
        return { userId: p.userId, amountOwed: valConverted, share: valOriginal };
      });
      if (Math.abs(sumOriginal - originalAmount) > 0.01) {
        return NextResponse.json({ error: `Exact amounts sum to ${sumOriginal}, but total is ${originalAmount}` }, { status: 400 });
      }
      // Fix rounding error on converted
      const sumConverted = calculatedParticipants.reduce((acc, p) => acc + p.amountOwed, 0);
      if (Math.abs(sumConverted - convertedAmount) > 0.001) {
        calculatedParticipants[0].amountOwed += (convertedAmount - sumConverted);
        calculatedParticipants[0].amountOwed = Number(calculatedParticipants[0].amountOwed.toFixed(2));
      }
    } else if (splitMethod === "PERCENTAGE") {
      let sumPct = 0;
      let sumAmountConverted = 0;
      calculatedParticipants = participants.map((p: any) => {
        const pct = parseFloat(p.share);
        sumPct += pct;
        const valConverted = Number((convertedAmount * (pct / 100)).toFixed(2));
        sumAmountConverted += valConverted;
        return { userId: p.userId, amountOwed: valConverted, share: pct };
      });
      if (Math.abs(sumPct - 100) > 0.01) {
        return NextResponse.json({ error: `Percentages must sum to 100%, got ${sumPct}%` }, { status: 400 });
      }
      if (Math.abs(sumAmountConverted - convertedAmount) > 0.001) {
        calculatedParticipants[0].amountOwed += (convertedAmount - sumAmountConverted);
        calculatedParticipants[0].amountOwed = Number(calculatedParticipants[0].amountOwed.toFixed(2));
      }
    } else {
      return NextResponse.json({ error: "Invalid split method" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          title,
          description,
          originalAmount,
          originalCurrency: currency,
          exchangeRate,
          convertedAmount,
          paidById,
          splitMethod,
          participants: {
            create: calculatedParticipants
          }
        },
        include: { participants: true }
      });

      return expense;
    });

    return NextResponse.json({ success: true, expense: result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
