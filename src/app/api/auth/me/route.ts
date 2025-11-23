/**
 * 現在のユーザー情報取得API
 * GET /api/auth/me - セッションCookieからユーザー情報とパスキー一覧を取得
 */
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // セッションCookieからトークンを取得
    const sessionToken = request.cookies.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    // セッションを検証してユーザーを取得
    const user = await validateSession(sessionToken);

    if (!user) {
      return NextResponse.json(
        { error: "セッションが無効です" },
        { status: 401 }
      );
    }

    // ユーザーのパスキー一覧を取得
    const passkeys = await prisma.passkey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        credentialId: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      passkeys: passkeys.map((pk) => ({
        id: pk.id,
        credentialId: pk.credentialId,
        createdAt: pk.createdAt.toISOString(),
        lastUsedAt: pk.lastUsedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("ユーザー情報取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
