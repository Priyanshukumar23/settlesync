import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groupId = params.id;
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId } }
    });

    if (!requesterMembership || requesterMembership.role !== "OWNER" || requesterMembership.leftAt !== null) {
      return NextResponse.json({ error: "Only active group owners can add members" }, { status: 403 });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
    }

    const existingMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: userToAdd.id } }
    });

    if (existingMembership) {
      if (existingMembership.leftAt === null) {
        return NextResponse.json({ error: "User is already an active member of this group" }, { status: 400 });
      } else {
        const updated = await prisma.groupMember.update({
          where: { id: existingMembership.id },
          data: { leftAt: null, joinedAt: new Date(), role: "MEMBER" }
        });
        return NextResponse.json({ success: true, member: updated });
      }
    }

    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: userToAdd.id,
        role: "MEMBER"
      }
    });

    return NextResponse.json({ success: true, member: newMember });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
