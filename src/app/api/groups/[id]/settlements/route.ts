import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groupId = params.id;
    const body = await req.json();
    const { payerId, payeeId, amount } = body;

    if (!payerId || !payeeId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid settlement data" }, { status: 400 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const isMember = group.members.some(m => m.userId === session.userId && m.leftAt === null);
    if (!isMember) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Ensure payer and payee are members of the group
    const payerMember = group.members.find(m => m.userId === payerId);
    const payeeMember = group.members.find(m => m.userId === payeeId);

    if (!payerMember || !payeeMember) {
      return NextResponse.json({ error: "Payer or Payee is not a member of the group" }, { status: 400 });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        payeeId,
        amount,
        currency: "INR", // Internal processing is in INR
        date: new Date(),
        notes: "Recorded via Settlement Suggestions",
      }
    });

    return NextResponse.json({ success: true, settlement });
  } catch (error: any) {
    console.error("[Record Settlement Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
