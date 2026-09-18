import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const sentCount = await prisma.message.count({
    where: { senderId: session.user.id },
  });

  return NextResponse.json({ messages, sentCount });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, content } = await req.json();

  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "Only text messages allowed." }, { status: 400 });
  }

  // Strip HTML/rich media to keep communication strictly plain-text
  const plainTextContent = content.replace(/<[^>]*>?/gm, "").trim();

  // Enforce total 2,000 sent messages limit per user
  const totalSent = await prisma.message.count({
    where: { senderId: session.user.id },
  });

  if (totalSent >= 2000) {
    return NextResponse.json(
      { error: "Limit reached: Maximum 2,000 messages allowed." },
      { status: 403 }
    );
  }

  const newMessage = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: plainTextContent,
    },
  });

  return NextResponse.json({ message: newMessage, currentSentCount: totalSent + 1 }, { status: 201 });
}
