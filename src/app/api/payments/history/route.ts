/**
 * 決済履歴API
 * GET /api/payments/history - ユーザーの決済履歴を取得
 */
import { NextRequest, NextResponse } from "next/server";
import { getPaymentHistory } from "@/lib/payments";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    // 決済履歴を取得
    const payments = await getPaymentHistory(user.id);

    return NextResponse.json({
      payments: payments.map((p) => ({
        paymentId: p.paymentId,
        productId: p.productId,
        productName: p.product.name,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        transactionHash: p.transactionHash,
        chainId: p.chainId,
        createdAt: p.createdAt,
        confirmedAt: p.confirmedAt,
      })),
    });
  } catch (error) {
    console.error("決済履歴取得エラー:", error);
    return NextResponse.json(
      { error: "決済履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
