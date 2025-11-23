"use client";

import { useEffect, useState } from "react";

// 決済履歴の型定義
interface PaymentHistory {
  paymentId: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: string;
  transactionHash: string | null;
  chainId: number | null;
  createdAt: string;
  confirmedAt: string | null;
}

// ステータスバッジコンポーネント
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "保留中",
    processing: "処理中",
    completed: "完了",
    failed: "失敗",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function HistoryPage() {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 決済履歴を取得
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/payments/history");

        if (res.status === 401) {
          // ログインが必要
          window.location.href = "/auth";
          return;
        }

        if (!res.ok) {
          throw new Error("履歴の取得に失敗しました");
        }

        const data = await res.json();
        setPayments(data.payments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // ローディング中
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // エラー時
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <a
          href="/auth"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
        >
          ログインする
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">購入履歴</h1>

      {payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">まだ購入履歴がありません</p>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            商品を見る
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  商品名
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  金額
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  日時
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  トランザクション
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr key={payment.paymentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <a
                      href={`/products/${payment.productId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {payment.productName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {payment.amount} {payment.currency}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    {payment.transactionHash ? (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${payment.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {payment.transactionHash.slice(0, 10)}...
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
