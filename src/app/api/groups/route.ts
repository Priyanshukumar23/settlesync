import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: session.userId,
            role: "OWNER"
          }
        }
      }
    });

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
