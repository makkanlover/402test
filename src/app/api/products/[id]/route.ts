/**
 * 商品詳細API
 * GET /api/products/:id - 商品詳細取得
 */
import { NextRequest, NextResponse } from "next/server";
import { getProductById, checkProductAccess } from "@/lib/products";
import { validateSession } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// 商品詳細を取得
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    // セッションからユーザーを取得
    const sessionToken = request.cookies.get("session")?.value;
    let hasAccess = false;

    if (sessionToken) {
      const user = await validateSession(sessionToken);
      if (user) {
        hasAccess = await checkProductAccess(user.id, product.id);
      }
    }

    // アクセス権がある場合はコンテンツURLも返す
    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      type: product.type,
      thumbnailUrl: product.thumbnailUrl,
      contentUrl: hasAccess ? product.contentUrl : null,
      hasAccess,
      createdAt: product.createdAt,
    });
  } catch (error) {
    console.error("商品詳細取得エラー:", error);
    return NextResponse.json(
      { error: "商品詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}
