import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('cookie')?.match(/(?:^|;\s*)token=([^;]+)/)?.[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = verifyToken(decodeURIComponent(token))

    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Parse existing history
    let history = JSON.parse(user.usageHistory || "[]");

    // 2. Add new image to the front
    history.unshift({ url: imageUrl, createdAt: new Date().toISOString() });

    // 3. Keep only last 2
    const updatedHistory = history.slice(0, 2);

    // 4. Update Database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        usageHistory: JSON.stringify(updatedHistory),
        credits: { decrement: 1 },
        imageCount: { increment: 1 }
      }
    });

    return NextResponse.json({ success: true, credits: updatedUser.credits });
  } catch (error) {
    console.error("History Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
