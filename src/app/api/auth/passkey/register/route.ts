/**
 * パスキー登録API
 * POST /api/auth/passkey/register - 登録オプション取得
 * PUT /api/auth/passkey/register - 登録レスポンス検証
 */
import { NextRequest, NextResponse } from "next/server";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "@/lib/auth";
import { z } from "zod";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

// オプション取得リクエストスキーマ
const OptionsSchema = z.object({
  userId: z.string().uuid("有効なユーザーIDを指定してください"),
});

// 登録レスポンススキーマ
const VerifySchema = z.object({
  userId: z.string().uuid("有効なユーザーIDを指定してください"),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.object({}).passthrough(),
    authenticatorAttachment: z.string().optional(),
  }),
});

// 登録オプションを取得
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

    // 登録オプションを生成
    const options = await generatePasskeyRegistrationOptions(userId);

    return NextResponse.json(options);
  } catch (error) {
    console.error("パスキー登録オプション取得エラー:", error);
    const message = error instanceof Error ? error.message : "エラーが発生しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// 登録レスポンスを検証
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

    // 登録を検証（型をキャスト）
    const verified = await verifyPasskeyRegistration(userId, response as RegistrationResponseJSON);

    return NextResponse.json({ success: verified });
  } catch (error) {
    console.error("パスキー登録検証エラー:", error);
    const message = error instanceof Error ? error.message : "検証に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
