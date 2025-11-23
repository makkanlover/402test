/**
 * 商品API
 * GET /api/products - 商品一覧取得
 * POST /api/products - 商品作成
 */
import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/lib/products";
import { z } from "zod";

// 商品作成リクエストスキーマ
const CreateProductSchema = z.object({
  name: z.string().min(1, "商品名を入力してください").max(255),
  description: z.string().max(1000).optional(),
  price: z.number().positive("価格は正の数である必要があります"),
  type: z.enum(["article", "image", "music", "video"]),
  contentUrl: z.string().url().optional(),
  thumbnailUrl: z.string().optional(),
});

// 商品一覧を取得
export async function GET() {
  try {
    const products = await getAllProducts();

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        type: p.type,
        thumbnailUrl: p.thumbnailUrl,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("商品一覧取得エラー:", error);
    return NextResponse.json(
      { error: "商品一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 商品を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const result = CreateProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const product = await createProduct(result.data);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("商品作成エラー:", error);
    return NextResponse.json(
      { error: "商品の作成に失敗しました" },
      { status: 500 }
    );
  }
}
