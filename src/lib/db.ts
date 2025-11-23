/**
 * Prismaデータベースクライアント
 * Prisma 6 + SQLite 設定
 */
import { PrismaClient } from "@prisma/client";

// グローバル変数でPrismaクライアントを保持（開発時のホットリロード対策）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// PrismaClientのインスタンスを作成
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// Prismaクライアントのインスタンスを取得または作成
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 開発環境ではグローバルに保持してホットリロード時の再接続を防ぐ
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
