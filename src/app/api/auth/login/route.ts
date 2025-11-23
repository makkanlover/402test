/**
 * ログインAPI
 * POST /api/auth/login
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createSession } from "@/lib/auth";
import { z } from "zod";

// リクエストスキーマ
const LoginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // ユーザー検索
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // セッション作成
    const sessionToken = await createSession(user.id);

    // レスポンスにセッショントークンをセット
    const response = NextResponse.json({
      sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Cookieにセッショントークンを設定
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24時間
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ログインエラー:", error);
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 }
    );
  }
}
