/**
 * ユーザー検索API
 * POST /api/auth/lookup-user - メールアドレスからユーザーを検索
 * パスキー認証のために使用
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// リクエストスキーマ
const LookupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = LookupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // ユーザーを検索
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // パスキーが登録されているかチェック
    const passkeyCount = await prisma.passkey.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      userId: user.id,
      hasPasskey: passkeyCount > 0,
    });
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
