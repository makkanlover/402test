/**
 * 決済開始API
 * POST /api/payments/initiate - HTTP 402レスポンスを返す
 */
import { NextRequest, NextResponse } from "next/server";
import { initiatePayment } from "@/lib/payments";
import { validateSession } from "@/lib/auth";
// checkProductAccessは複数回購入を許可する設計のため、現在は未使用
// import { checkProductAccess } from "@/lib/products";
import { z } from "zod";

// リクエストスキーマ
const InitiatePaymentSchema = z.object({
  productId: z.string().uuid("有効な商品IDを指定してください"),
});

export async function POST(request: NextRequest) {
  try {
    // セッション検証
    const sessionToken = request.cookies.get("session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json(
        { error: "セッションが無効です" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // バリデーション
    const result = InitiatePaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId } = result.data;

    // 既にアクセス権があるか確認（情報として取得するが、再購入は許可する）
    // 複数回購入可能な設計とするため、hasAccessによるブロックは行わない
    // const hasAccess = await checkProductAccess(user.id, productId);

    // 決済を開始
    const paymentInfo = await initiatePayment(user.id, productId);

    // HTTP 402 Payment Required レスポンスを返す
    return NextResponse.json(paymentInfo, {
      status: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-Payment-Id": paymentInfo.paymentId,
      },
    });
  } catch (error) {
    console.error("決済開始エラー:", error);
    const message = error instanceof Error ? error.message : "決済の開始に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
