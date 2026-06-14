import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, memberId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    const targetUserId = resolvedParams.memberId;

    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId } }
    });

    if (!requesterMembership || requesterMembership.role !== "OWNER" || requesterMembership.leftAt !== null) {
      return NextResponse.json({ error: "Only active group owners can remove members" }, { status: 403 });
    }

    if (targetUserId === session.userId) {
      return NextResponse.json({ error: "Owners cannot remove themselves directly this way" }, { status: 400 });
    }

    const targetMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } }
    });

    if (!targetMembership || targetMembership.leftAt !== null) {
      return NextResponse.json({ error: "User is not an active member" }, { status: 404 });
    }

    await prisma.groupMember.update({
      where: { id: targetMembership.id },
      data: { leftAt: new Date() }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
