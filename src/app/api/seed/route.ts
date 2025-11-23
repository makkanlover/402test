/**
 * シードAPI（デモデータ投入）
 * POST /api/seed - 初期商品データを投入
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // 既存の商品を確認
    const existingCount = await prisma.product.count();
    if (existingCount > 0) {
      return NextResponse.json({
        message: "商品データは既に存在します",
        count: existingCount,
      });
    }

    // デモ商品データを投入
    const products = await prisma.product.createMany({
      data: [
        {
          name: "プレミアム記事：AIの未来",
          description: "最新のAI技術動向を解説した記事です。ChatGPT、Claude、Geminiなどの生成AIの進化と、社会への影響を詳しく分析しています。",
          price: 0.00001,
          currency: "AVAX",
          type: "article",
          contentUrl: "https://example.com/articles/ai-future",
          thumbnailUrl: "https://picsum.photos/seed/ai/400/300",
        },
        {
          name: "デジタルアート：宇宙",
          description: "高解像度の宇宙をテーマにしたデジタルアート。壁紙やプリントに最適です。",
          price: 0.00001,
          currency: "AVAX",
          type: "image",
          contentUrl: "https://example.com/images/space.png",
          thumbnailUrl: "https://picsum.photos/seed/space/400/300",
        },
        {
          name: "ローファイBGM",
          description: "作業用ローファイミュージック。集中力を高めるリラックスした音楽です。",
          price: 0.00001,
          currency: "AVAX",
          type: "music",
          contentUrl: "https://example.com/music/lofi.mp3",
          thumbnailUrl: "https://picsum.photos/seed/music/400/300",
        },
      ],
    });

    return NextResponse.json({
      message: "商品データを投入しました",
      count: products.count,
    });
  } catch (error) {
    console.error("シードエラー:", error);
    return NextResponse.json(
      { error: "データ投入に失敗しました" },
      { status: 500 }
    );
  }
}
