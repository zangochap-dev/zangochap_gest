import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    let hashedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (!user.password) {
        skippedCount++;
        continue;
      }

      // Check if password looks like a bcrypt hash
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        skippedCount++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      hashedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Migration terminée. ${hashedCount} mots de passe hachés, ${skippedCount} ignorés.`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
