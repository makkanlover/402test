/**
 * ユーザー登録API
 * POST /api/auth/register
 */
import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { z } from "zod";

// リクエストスキーマ
const RegisterSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z.string().min(1, "名前を入力してください").max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, name } = result.data;

    // ユーザー登録
    const user = await registerUser(email, name);

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("ユーザー登録エラー:", error);
    const message = error instanceof Error ? error.message : "登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
