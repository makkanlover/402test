/**
 * 商品管理サービス
 */
import { prisma } from "./db";
import type { CreateProductInput } from "@/types";

/**
 * 全商品を取得
 */
export async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * IDで商品を取得
 */
export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

/**
 * 商品を作成
 */
export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description || null,
      price: input.price,
      type: input.type,
      contentUrl: input.contentUrl || null,
      thumbnailUrl: input.thumbnailUrl || null,
    },
  });
}

/**
 * 商品を更新
 */
export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  return prisma.product.update({
    where: { id },
    data: input,
  });
}

/**
 * 商品を削除
 */
export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

/**
 * ユーザーが商品へのアクセス権を持っているか確認
 */
export async function checkProductAccess(userId: string, productId: string): Promise<boolean> {
  const access = await prisma.productAccess.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });
  return !!access;
}

/**
 * ユーザーに商品へのアクセス権を付与
 */
export async function grantProductAccess(
  userId: string,
  productId: string,
  paymentId?: string
) {
  return prisma.productAccess.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {
      paymentId,
      grantedAt: new Date(),
    },
    create: {
      userId,
      productId,
      paymentId,
    },
  });
}

/**
 * ユーザーがアクセス可能な商品一覧を取得
 */
export async function getUserAccessibleProducts(userId: string) {
  const accesses = await prisma.productAccess.findMany({
    where: { userId },
    include: { product: true },
  });
  return accesses.map((a) => a.product);
}

/**
 * 初期商品データを投入（デモ用）
 */
export async function seedProducts() {
  const products = [
    {
      name: "プレミアム記事：AIの未来",
      description: "最新のAI技術動向を解説した記事です",
      price: 0.00001,
      type: "article" as const,
      contentUrl: "https://example.com/articles/ai-future",
      thumbnailUrl: "/images/ai-article.png",
    },
    {
      name: "デジタルアート：宇宙",
      description: "高解像度の宇宙をテーマにしたデジタルアート",
      price: 0.00001,
      type: "image" as const,
      contentUrl: "https://example.com/images/space.png",
      thumbnailUrl: "/images/space-thumb.png",
    },
    {
      name: "ローファイBGM",
      description: "作業用ローファイミュージック",
      price: 0.00001,
      type: "music" as const,
      contentUrl: "https://example.com/music/lofi.mp3",
      thumbnailUrl: "/images/lofi-thumb.png",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.name }, // 名前をキーとして使用（デモ用）
      update: product,
      create: product,
    });
  }

  console.log("商品データを投入しました");
}
