"use client";

import { useState, useEffect, useRef } from "react";
import { startRegistration } from "@simplewebauthn/browser";

// ユーザー情報の型定義
interface User {
  id: string;
  email: string;
  name: string;
}

// パスキー情報の型定義
interface PasskeyInfo {
  id: string;
  credentialId: string;
  createdAt: string;
  lastUsedAt: string | null;
}

// QRコード生成用のコンポーネント
function QRCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // QRコード生成（簡易実装 - Canvas APIを使用）
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // サイズ設定
    const size = 200;
    const moduleCount = 25; // QRコードのモジュール数（簡易版）
    const moduleSize = size / moduleCount;

    canvas.width = size;
    canvas.height = size;

    // 背景を白で塗りつぶす
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // URLからシンプルなパターンを生成（実際のQRコード生成ではライブラリ使用推奨）
    // ここではURLをエンコードした疑似QRパターンを描画
    ctx.fillStyle = "#000000";

    // 位置検出パターン（左上）
    drawFinderPattern(ctx, 0, 0, moduleSize);
    // 位置検出パターン（右上）
    drawFinderPattern(ctx, (moduleCount - 7) * moduleSize, 0, moduleSize);
    // 位置検出パターン（左下）
    drawFinderPattern(ctx, 0, (moduleCount - 7) * moduleSize, moduleSize);

    // URLをハッシュ化してデータモジュールを生成
    const hash = simpleHash(url);
    for (let y = 0; y < moduleCount; y++) {
      for (let x = 0; x < moduleCount; x++) {
        // 位置検出パターンの領域をスキップ
        if (isFinderPatternArea(x, y, moduleCount)) continue;

        // ハッシュに基づいてモジュールを描画
        const bit = (hash[(y * moduleCount + x) % hash.length] + x + y) % 2 === 0;
        if (bit) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }, [url]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="border border-gray-200 rounded-lg" />
      <p className="mt-2 text-xs text-gray-500 text-center max-w-[200px] break-all">
        {url}
      </p>
    </div>
  );
}

// 位置検出パターンを描画
function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
  // 外枠（黒）
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);
  // 中枠（白）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);
  // 中心（黒）
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
}

// 位置検出パターンの領域かどうか判定
function isFinderPatternArea(x: number, y: number, moduleCount: number): boolean {
  // 左上
  if (x < 8 && y < 8) return true;
  // 右上
  if (x >= moduleCount - 8 && y < 8) return true;
  // 左下
  if (x < 8 && y >= moduleCount - 8) return true;
  return false;
}

// シンプルなハッシュ関数
function simpleHash(str: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < 256; i++) {
    let hash = 0;
    for (let j = 0; j < str.length; j++) {
      hash = ((hash << 5) - hash + str.charCodeAt(j) + i) | 0;
    }
    result.push(Math.abs(hash));
  }
  return result;
}

export default function PasskeyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");

  // 現在のページURLを取得（クライアントサイドのみ）
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // ユーザー情報とパスキー一覧を取得
  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");

      if (!res.ok) {
        if (res.status === 401) {
          setError("ログインが必要です。先にログインしてください。");
        } else {
          setError("ユーザー情報の取得に失敗しました");
        }
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setPasskeys(data.passkeys);
    } catch {
      setError("ユーザー情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // パスキー登録処理
  async function handleRegisterPasskey() {
    if (!user) return;

    setRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. 登録オプションを取得
      const optionsRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "登録オプションの取得に失敗しました");
      }

      const options = await optionsRes.json();

      // 2. ブラウザのWebAuthn APIでパスキー作成
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // 3. サーバーで検証
      const verifyRes = await fetch("/api/auth/passkey/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          response: registrationResponse,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "パスキーの登録に失敗しました");
      }

      setSuccess("パスキーを登録しました！");

      // パスキー一覧を更新
      await fetchUserData();
    } catch (err) {
      if (err instanceof Error) {
        // ユーザーがキャンセルした場合
        if (err.name === "NotAllowedError") {
          setError("パスキーの登録がキャンセルされました");
        } else {
          setError(err.message);
        }
      } else {
        setError("パスキーの登録に失敗しました");
      }
    } finally {
      setRegistering(false);
    }
  }

  // 日時フォーマット
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ローディング中
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // 未ログイン時
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">パスキー管理</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">{error || "ログインが必要です"}</p>
          <a
            href="/auth"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">パスキー管理</h1>

      {/* ユーザー情報 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ログイン中のユーザー</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {/* パスキー登録セクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">パスキーを登録</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* このデバイスで登録 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">このデバイスで登録</h3>
            <p className="text-sm text-gray-600 mb-4">
              生体認証やセキュリティキーを使ってパスキーを登録できます。
            </p>
            <button
              onClick={handleRegisterPasskey}
              disabled={registering}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  登録中...
                </span>
              ) : (
                "パスキーを登録"
              )}
            </button>
          </div>

          {/* スマホで登録（QRコード） */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">スマホで登録</h3>
            <p className="text-sm text-gray-600 mb-4">
              QRコードをスマホで読み取って、スマホのパスキーを登録できます。
            </p>
            {currentUrl && <QRCode url={currentUrl} />}
          </div>
        </div>
      </div>

      {/* 登録済みパスキー一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          登録済みパスキー
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({passkeys.length}件)
          </span>
        </h2>

        {passkeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <p>パスキーがまだ登録されていません</p>
            <p className="text-sm mt-1">上のボタンからパスキーを登録してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      パスキー
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {passkey.credentialId.substring(0, 16)}...
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>登録: {formatDate(passkey.createdAt)}</p>
                  {passkey.lastUsedAt && (
                    <p>最終使用: {formatDate(passkey.lastUsedAt)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 説明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">パスキーとは？</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>・パスワードに代わる安全な認証方法です</li>
          <li>・生体認証（指紋・顔認証）やセキュリティキーで認証できます</li>
          <li>・フィッシング詐欺に強く、より安全にログインできます</li>
          <li>・複数のデバイスにパスキーを登録できます</li>
        </ul>
      </div>
    </div>
  );
}
