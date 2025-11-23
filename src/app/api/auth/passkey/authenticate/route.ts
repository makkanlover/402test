/**
 * パスキー認証API
 * POST /api/auth/passkey/authenticate - 認証オプション取得
 * PUT /api/auth/passkey/authenticate - 認証レスポンス検証
 */
import { NextRequest, NextResponse } from "next/server";
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  createSession,
} from "@/lib/auth";
import { z } from "zod";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";

// オプション取得リクエストスキーマ
const OptionsSchema = z.object({
  userId: z.string().uuid("有効なユーザーIDを指定してください"),
});

// 認証レスポンススキーマ
const VerifySchema = z.object({
  userId: z.string().uuid("有効なユーザーIDを指定してください"),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.string().optional(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.object({}).passthrough(),
    authenticatorAttachment: z.string().optional(),
  }),
});

// 認証オプションを取得
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = OptionsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId } = result.data;

    // 認証オプションを生成
    const options = await generatePasskeyAuthenticationOptions(userId);

    return NextResponse.json(options);
  } catch (error) {
    console.error("パスキー認証オプション取得エラー:", error);
    const message = error instanceof Error ? error.message : "エラーが発生しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// 認証レスポンスを検証
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = VerifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId, response } = result.data;

    // 認証を検証（型をキャスト）
    const verified = await verifyPasskeyAuthentication(userId, response as AuthenticationResponseJSON);

    if (!verified) {
      return NextResponse.json(
        { error: "認証に失敗しました" },
        { status: 401 }
      );
    }

    // セッション作成
    const sessionToken = await createSession(userId);

    // レスポンス
    const res = NextResponse.json({
      success: true,
      sessionToken,
    });

    // Cookieにセッショントークンを設定
    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("パスキー認証検証エラー:", error);
    const message = error instanceof Error ? error.message : "認証に失敗しました";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
