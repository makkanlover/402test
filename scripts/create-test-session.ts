/**
 * テスト用セッション作成スクリプト
 * 段階的テストPhase 1で使用
 */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  // テストユーザーを取得
  const user = await prisma.user.findFirst({
    where: { email: "test@example.com" },
  });

  if (!user) {
    console.log("テストユーザーが見つかりません");
    process.exit(1);
  }

  // セッションを作成
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  console.log("テストセッション作成成功:");
  console.log(`  ユーザーID: ${user.id}`);
  console.log(`  セッショントークン: ${token}`);
  console.log(`  有効期限: ${expiresAt.toISOString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
