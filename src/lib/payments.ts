/**
 * 決済サービス
 * x402プロトコルに基づくHTTP 402決済
 */
import { prisma } from "./db";
import { v4 as uuidv4 } from "uuid";
import { getBlockchainService, type TransactionResult } from "./blockchain";
import { grantProductAccess, getProductById } from "./products";
import type { PaymentInfo, PaymentStatus, PaymentMethod } from "@/types";

// 決済の有効期限（30分）
const PAYMENT_EXPIRY_MS = 30 * 60 * 1000;

// 決済先アドレス
const PAYEE_ADDRESS = process.env.PAYEE_ADDRESS || "0x6aa377e955956127137eeefa1dd1c6609d6bd603";

/**
 * 決済を開始（HTTP 402レスポンス用の情報を生成）
 */
export async function initiatePayment(
  userId: string,
  productId: string
): Promise<PaymentInfo> {
  // 商品を取得
  const product = await getProductById(productId);
  if (!product) {
    throw new Error("商品が見つかりません");
  }

  // 決済IDを生成
  const paymentId = `pay_${uuidv4().replace(/-/g, "")}`;

  // 決済レコードを作成
  await prisma.payment.create({
    data: {
      paymentId,
      userId,
      productId,
      amount: product.price,
      currency: product.currency,
      status: "pending",
    },
  });

  // 決済情報を返す
  return {
    paymentId,
    amount: product.price,
    currency: product.currency,
    productId: product.id,
    productName: product.name,
    expiresAt: new Date(Date.now() + PAYMENT_EXPIRY_MS),
  };
}

/**
 * 決済状態を取得
 */
export async function getPaymentStatus(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
    include: { product: true },
  });

  if (!payment) {
    throw new Error("決済が見つかりません");
  }

  return {
    paymentId: payment.paymentId,
    status: payment.status as PaymentStatus,
    amount: payment.amount,
    currency: payment.currency,
    productName: payment.product.name,
    transactionHash: payment.transactionHash,
    chainId: payment.chainId,
    confirmedAt: payment.confirmedAt,
  };
}

/**
 * モック決済処理（クレジットカード、PayPay等のシミュレーション）
 */
export async function processMockPayment(
  paymentId: string,
  method: PaymentMethod
): Promise<void> {
  // 決済を取得
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
  });

  if (!payment) {
    throw new Error("決済が見つかりません");
  }

  if (payment.status !== "pending") {
    throw new Error("この決済は既に処理されています");
  }

  // ステータスを処理中に更新
  await prisma.payment.update({
    where: { paymentId },
    data: {
      status: "processing",
      paymentMethod: method,
    },
  });

  // 1-3秒のシミュレーション遅延
  const delay = Math.random() * 2000 + 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * ブロックチェーン決済を実行
 */
export async function executeBlockchainPayment(
  paymentId: string
): Promise<TransactionResult> {
  // 決済を取得
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
    include: { product: true },
  });

  if (!payment) {
    throw new Error("決済が見つかりません");
  }

  if (payment.status !== "processing") {
    throw new Error("決済がまだ処理されていません");
  }

  try {
    // ブロックチェーンサービスを取得
    const blockchainService = getBlockchainService();

    // トランザクションを送信
    const result = await blockchainService.sendNativeToken(
      PAYEE_ADDRESS,
      payment.amount
    );

    // 決済レコードを更新
    await prisma.payment.update({
      where: { paymentId },
      data: {
        transactionHash: result.transactionHash,
        chainId: result.chainId,
        status: result.status === "confirmed" ? "completed" : "pending",
        confirmedAt: result.status === "confirmed" ? new Date() : null,
      },
    });

    // 決済が完了したらアクセス権を付与
    if (result.status === "confirmed") {
      await grantProductAccess(payment.userId, payment.productId, paymentId);
    }

    return result;
  } catch (error) {
    // エラー時は失敗として記録
    await prisma.payment.update({
      where: { paymentId },
      data: { status: "failed" },
    });
    throw error;
  }
}

/**
 * 決済を完了（トランザクション確認後）
 */
export async function completePayment(
  paymentId: string,
  txHash: string
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
  });

  if (!payment) {
    throw new Error("決済が見つかりません");
  }

  // ブロックチェーンでトランザクションを確認
  const blockchainService = getBlockchainService();
  const result = await blockchainService.getTransactionStatus(txHash);

  if (result.status === "confirmed") {
    // 決済を完了として記録
    await prisma.payment.update({
      where: { paymentId },
      data: {
        status: "completed",
        transactionHash: txHash,
        confirmedAt: new Date(),
      },
    });

    // アクセス権を付与
    await grantProductAccess(payment.userId, payment.productId, paymentId);
  } else if (result.status === "failed") {
    await prisma.payment.update({
      where: { paymentId },
      data: { status: "failed" },
    });
  }
}

/**
 * ユーザーの決済履歴を取得
 */
export async function getPaymentHistory(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 決済IDで決済を取得
 */
export async function getPaymentByPaymentId(paymentId: string) {
  return prisma.payment.findUnique({
    where: { paymentId },
    include: { product: true, user: true },
  });
}
