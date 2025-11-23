/**
 * 決済処理API
 * POST /api/payments/process - モック決済処理 + ブロックチェーン決済実行
 */
import { NextRequest, NextResponse } from "next/server";
import { processMockPayment, executeBlockchainPayment } from "@/lib/payments";
import { validateSession } from "@/lib/auth";
import { z } from "zod";

// リクエストスキーマ
const ProcessPaymentSchema = z.object({
  paymentId: z.string().startsWith("pay_", "有効な決済IDを指定してください"),
  paymentMethod: z.enum(["credit_card", "paypay", "apple_pay", "mock"]),
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
    const result = ProcessPaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { paymentId, paymentMethod } = result.data;

    // モック決済処理（1-3秒のシミュレーション）
    await processMockPayment(paymentId, paymentMethod);

    // ブロックチェーン決済を実行
    const txResult = await executeBlockchainPayment(paymentId);

    return NextResponse.json({
      success: true,
      paymentId,
      transactionHash: txResult.transactionHash,
      chainId: txResult.chainId,
      status: txResult.status,
      explorerUrl: `https://testnet.snowtrace.io/tx/${txResult.transactionHash}`,
    });
  } catch (error) {
    console.error("決済処理エラー:", error);
    const message = error instanceof Error ? error.message : "決済処理に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
