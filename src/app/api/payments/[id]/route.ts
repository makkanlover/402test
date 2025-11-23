/**
 * 決済状態確認API
 * GET /api/payments/:id - 決済状態を取得
 */
import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/payments";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // 決済状態を取得
    const status = await getPaymentStatus(id);

    return NextResponse.json(status);
  } catch (error) {
    console.error("決済状態取得エラー:", error);
    const message = error instanceof Error ? error.message : "決済状態の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
