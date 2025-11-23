/**
 * 共通型定義
 */

// ユーザー型
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// 商品型
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: "article" | "image" | "music" | "video";
  contentUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 商品作成時の入力型
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  type: "article" | "image" | "music" | "video";
  contentUrl?: string;
  thumbnailUrl?: string;
}

// 決済状態
export type PaymentStatus = "pending" | "processing" | "completed" | "failed";

// 決済方法
export type PaymentMethod = "credit_card" | "paypay" | "apple_pay" | "mock";

// 決済型
export interface Payment {
  id: string;
  paymentId: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  chainId: number | null;
  transactionHash: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 決済開始レスポンス（HTTP 402用）
export interface PaymentInfo {
  paymentId: string;
  amount: number;
  currency: string;
  productId: string;
  productName: string;
  expiresAt: Date;
}

// 決済実行リクエスト
export interface ProcessPaymentRequest {
  paymentId: string;
  paymentMethod: PaymentMethod;
}

// トランザクション結果
export interface TransactionResult {
  transactionHash: string;
  chainId: number;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
}

// APIエラーレスポンス
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// セッション型
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

// 認証トークン
export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: Date;
}
