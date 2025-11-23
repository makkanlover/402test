"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";

// 商品詳細の型定義
interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: string;
  thumbnailUrl: string | null;
  contentUrl: string | null;
  hasAccess: boolean;
}

// 決済情報の型定義
interface PaymentInfo {
  paymentId: string;
  amount: number;
  currency: string;
  productName: string;
}

// 決済結果の型定義
interface PaymentResult {
  success: boolean;
  transactionHash: string;
  explorerUrl: string;
}

// ユーザー情報の型定義
interface UserInfo {
  id: string;
  email: string;
  name: string | null;
}

// 処理状態の型定義
type ProcessingState =
  | "idle"           // 初期状態
  | "initiating"     // 決済開始中
  | "authenticating" // パスキー認証中
  | "processing"     // 決済処理中
  | "completed";     // 完了

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hasPasskey, setHasPasskey] = useState(false);

  // 商品データとユーザー情報を取得
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error("商品が見つかりません");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }

    // ユーザー情報とパスキー登録状況を取得
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setHasPasskey(data.passkeys && data.passkeys.length > 0);
        }
      } catch {
        // ログインしていない場合は無視
      }
    }

    if (productId) {
      fetchProduct();
      fetchUserInfo();
    }
  }, [productId]);

  // 購入ボタンクリック時
  async function handlePurchase() {
    if (!product) return;

    setProcessingState("initiating");
    setError(null);

    try {
      // 1. 決済を開始（HTTP 402を受け取る）
      const initiateRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (initiateRes.status === 401) {
        // ログインが必要
        window.location.href = "/auth";
        return;
      }

      if (initiateRes.status === 400) {
        const data = await initiateRes.json();
        throw new Error(data.error || "購入済みです");
      }

      if (initiateRes.status !== 402) {
        throw new Error("決済の開始に失敗しました");
      }

      const paymentData: PaymentInfo = await initiateRes.json();
      setPaymentInfo(paymentData);

      // 2. パスキー認証を実行
      setProcessingState("authenticating");

      // ユーザー情報がない場合は再取得
      let currentUser = user;
      if (!currentUser) {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          window.location.href = "/auth";
          return;
        }
        const meData = await meRes.json();
        currentUser = meData.user;
        setUser(meData.user);
        setHasPasskey(meData.passkeys && meData.passkeys.length > 0);

        // パスキーが登録されていない場合
        if (!meData.passkeys || meData.passkeys.length === 0) {
          throw new Error("パスキーが登録されていません。パスキー設定ページで登録してください。");
        }
      }

      // パスキーが登録されていない場合のチェック
      if (!hasPasskey && user) {
        throw new Error("パスキーが登録されていません。パスキー設定ページで登録してください。");
      }

      // 認証オプションを取得
      const authOptionsRes = await fetch("/api/auth/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser!.id }),
      });

      if (!authOptionsRes.ok) {
        const errorData = await authOptionsRes.json();
        throw new Error(errorData.error || "認証オプションの取得に失敗しました");
      }

      const authOptions = await authOptionsRes.json();

      // パスキー認証を実行
      let authResponse;
      try {
        authResponse = await startAuthentication({ optionsJSON: authOptions });
      } catch (authError) {
        // ユーザーがキャンセルした場合
        if (authError instanceof Error && authError.name === "NotAllowedError") {
          throw new Error("認証がキャンセルされました。もう一度お試しください。");
        }
        throw new Error("パスキー認証に失敗しました。もう一度お試しください。");
      }

      // 認証レスポンスを検証
      const verifyRes = await fetch("/api/auth/passkey/authenticate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser!.id,
          response: authResponse,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || "認証の検証に失敗しました");
      }

      // 3. 認証成功後、決済処理を実行
      setProcessingState("processing");

      const processRes = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          paymentMethod: "mock",
        }),
      });

      if (!processRes.ok) {
        const data = await processRes.json();
        throw new Error(data.error || "決済処理に失敗しました");
      }

      const result: PaymentResult = await processRes.json();
      setPaymentResult(result);
      setProcessingState("completed");

      // 商品情報を再取得（アクセス権を更新）
      const updatedRes = await fetch(`/api/products/${productId}`);
      if (updatedRes.ok) {
        const updatedProduct = await updatedRes.json();
        setProduct(updatedProduct);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setProcessingState("idle");
    }
  }

  // 処理中かどうかを判定
  const isProcessing = processingState !== "idle" && processingState !== "completed";

  // 処理状態に応じたメッセージを取得
  function getProcessingMessage(): string {
    switch (processingState) {
      case "initiating":
        return "決済を開始中...";
      case "authenticating":
        return "パスキーで認証中...";
      case "processing":
        return "決済処理中...";
      default:
        return "";
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // エラー時
  if (error && !product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
        >
          商品一覧に戻る
        </a>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* パンくず */}
      <nav className="mb-6 text-sm">
        <a href="/" className="text-blue-600 hover:underline">
          商品一覧
        </a>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{product.name}</span>
      </nav>

      {/* 商品情報 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* サムネイル */}
        <div className="aspect-video bg-gray-200">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        <div className="p-6">
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded mb-3">
            {product.type}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600">価格</span>
              <span className="text-2xl font-bold text-blue-600">
                {product.price} {product.currency}
              </span>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                <p>{error}</p>
                {/* パスキー未登録の場合は設定ページへの誘導リンクを表示 */}
                {error.includes("パスキーが登録されていません") && (
                  <Link
                    href="/passkey"
                    className="inline-block mt-2 text-blue-600 hover:underline font-semibold"
                  >
                    パスキーを登録する
                  </Link>
                )}
              </div>
            )}

            {/* 決済成功時 */}
            {paymentResult && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700 font-semibold mb-2">
                  ✓ 購入が完了しました！
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  トランザクションハッシュ:
                </p>
                <a
                  href={paymentResult.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {paymentResult.transactionHash}
                </a>
              </div>
            )}

            {/* アクセス権がある場合 - コンテンツ表示 + 再購入ボタン */}
            {product.hasAccess && (
              <div className="space-y-4 mb-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-700 font-semibold">
                    購入済み - コンテンツにアクセスできます
                  </p>
                </div>
                {product.contentUrl && (
                  <a
                    href={product.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-semibold"
                  >
                    コンテンツを表示
                  </a>
                )}
              </div>
            )}

            {/* 購入ボタン - 購入済みでも再購入可能 */}
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className={`w-full py-3 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                product.hasAccess
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  {getProcessingMessage()}
                </span>
              ) : product.hasAccess ? (
                `もう一度購入する (${product.price} ${product.currency})`
              ) : (
                `${product.price} ${product.currency} で購入する`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 決済情報（デバッグ用） */}
      {paymentInfo && isProcessing && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
          <p className="font-semibold mb-2">{getProcessingMessage()}</p>
          <p>決済ID: {paymentInfo.paymentId}</p>
          <p>
            金額: {paymentInfo.amount} {paymentInfo.currency}
          </p>
          {processingState === "authenticating" && (
            <p className="mt-2 text-blue-600">
              ブラウザのパスキー認証ダイアログに従ってください
            </p>
          )}
        </div>
      )}
    </div>
  );
}
