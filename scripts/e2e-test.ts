/**
 * Phase 5: 全機能結合テスト（E2E）
 * シナリオ: 新規ユーザーが商品を購入してアクセス権を取得
 */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("=== Phase 5: 全機能結合テスト ===\n");
  console.log("シナリオ: 新規ユーザーが商品を購入してアクセス権を取得\n");

  // Step 1: 新規ユーザー登録
  console.log("Step 1: 新規ユーザー登録");
  const email = `e2e-${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: "E2Eテストユーザー" }),
  });
  const registerData = await registerRes.json();
  console.log(`  ✓ ユーザー作成: ${registerData.userId}`);

  // Step 2: セッション作成（本来はパスキー認証後だが、テストのため直接作成）
  console.log("\nStep 2: セッション作成");
  const token = uuidv4();
  await prisma.session.create({
    data: {
      userId: registerData.userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ セッショントークン: ${token.substring(0, 8)}...`);

  // Step 3: 商品一覧取得
  console.log("\nStep 3: 商品一覧取得");
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  const productsData = await productsRes.json();
  console.log(`  ✓ 商品数: ${productsData.products.length}`);
  const targetProduct = productsData.products[2]; // 3番目の商品（ローファイBGM）
  console.log(`  ✓ 購入対象: ${targetProduct.name} (${targetProduct.price} ${targetProduct.currency})`);

  // Step 4: 決済開始（HTTP 402）
  console.log("\nStep 4: 決済開始（HTTP 402 Payment Required）");
  const initiateRes = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${token}`,
    },
    body: JSON.stringify({ productId: targetProduct.id }),
  });
  console.log(`  ✓ HTTPステータス: ${initiateRes.status}`);
  const initiateData = await initiateRes.json();
  console.log(`  ✓ 決済ID: ${initiateData.paymentId}`);
  console.log(`  ✓ 金額: ${initiateData.amount} ${initiateData.currency}`);

  // Step 5: 決済処理（ブロックチェーン送金）
  console.log("\nStep 5: 決済処理（ブロックチェーン送金）");
  const processRes = await fetch(`${BASE_URL}/api/payments/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${token}`,
    },
    body: JSON.stringify({
      paymentId: initiateData.paymentId,
      paymentMethod: "mock",
    }),
  });
  const processData = await processRes.json();
  console.log(`  ✓ トランザクションハッシュ: ${processData.transactionHash}`);
  console.log(`  ✓ チェーンID: ${processData.chainId} (Avalanche Fuji)`);
  console.log(`  ✓ ステータス: ${processData.status}`);

  // Step 6: 購入履歴確認
  console.log("\nStep 6: 購入履歴確認");
  const historyRes = await fetch(`${BASE_URL}/api/payments/history`, {
    headers: { Cookie: `session=${token}` },
  });
  const historyData = await historyRes.json();
  console.log(`  ✓ 購入履歴数: ${historyData.payments.length}`);
  const latestPayment = historyData.payments[0];
  console.log(`  ✓ 最新の購入: ${latestPayment.productName}`);
  console.log(`  ✓ 決済状態: ${latestPayment.status}`);

  // Step 7: アクセス権確認
  console.log("\nStep 7: アクセス権確認");
  const access = await prisma.productAccess.findFirst({
    where: {
      userId: registerData.userId,
      productId: targetProduct.id,
    },
  });
  if (access) {
    console.log(`  ✓ アクセス権付与済み`);
    console.log(`  ✓ 付与日時: ${access.grantedAt}`);
  } else {
    console.log(`  ✗ アクセス権が見つかりません`);
  }

  // Step 8: 重複購入防止テスト
  console.log("\nStep 8: 重複購入防止テスト");
  const duplicateRes = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session=${token}`,
    },
    body: JSON.stringify({ productId: targetProduct.id }),
  });
  const duplicateData = await duplicateRes.json();
  if (duplicateData.error?.includes("購入済み")) {
    console.log(`  ✓ 重複購入を正しく防止: "${duplicateData.error}"`);
  } else {
    console.log(`  ✗ 重複購入防止に失敗`);
  }

  // サマリー
  console.log("\n=== テスト結果サマリー ===");
  console.log(`  ユーザーID: ${registerData.userId}`);
  console.log(`  購入商品: ${targetProduct.name}`);
  console.log(`  決済ID: ${initiateData.paymentId}`);
  console.log(`  トランザクション: ${processData.transactionHash}`);
  console.log(`  Explorer: https://testnet.snowtrace.io/tx/${processData.transactionHash}`);
  console.log("\n=== Phase 5 完了 ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
