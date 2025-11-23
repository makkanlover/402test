"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";
type RegisterSuccessState = {
  success: true;
  userId: string;
  message: string;
} | null;

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  // 新規登録後のパスキー登録誘導用状態
  const [registerSuccess, setRegisterSuccess] = useState<RegisterSuccessState>(null);

  // ログイン処理
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ログインに失敗しました");
      }

      setSuccess("ログインしました！");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  // パスキーでログイン
  async function handlePasskeyLogin() {
    if (!email) {
      setError("メールアドレスを入力してください");
      return;
    }

    setPasskeyLoading(true);
    setError(null);

    try {
      // メールアドレスからユーザーIDを取得
      const lookupRes = await fetch("/api/auth/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!lookupRes.ok) {
        const data = await lookupRes.json();
        throw new Error(data.error || "ユーザーが見つかりません");
      }

      const { userId, hasPasskey } = await lookupRes.json();

      if (!hasPasskey) {
        throw new Error("このアカウントにはパスキーが登録されていません。通常のログインを使用するか、ログイン後にパスキーを登録してください。");
      }

      // 認証オプションを取得
      const optionsRes = await fetch("/api/auth/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || "認証オプションの取得に失敗しました");
      }

      const options = await optionsRes.json();

      // ブラウザでパスキー認証を実行
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 認証レスポンスを検証
      const verifyRes = await fetch("/api/auth/passkey/authenticate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          response: authResponse,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "認証に失敗しました");
      }

      setSuccess("パスキーでログインしました！");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      // WebAuthnエラーのハンドリング
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("パスキー認証がキャンセルされました");
        } else if (err.name === "SecurityError") {
          setError("セキュリティエラーが発生しました。ブラウザの設定を確認してください");
        } else {
          setError(err.message);
        }
      } else {
        setError("エラーが発生しました");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  // 登録処理
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ユーザー登録
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.error || "登録に失敗しました");
      }

      const registerData = await registerRes.json();

      // 登録後、ログイン
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!loginRes.ok) {
        throw new Error("ログインに失敗しました");
      }

      // パスキー登録誘導を表示
      setRegisterSuccess({
        success: true,
        userId: registerData.userId,
        message: "登録・ログインしました！",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  // パスキー登録ページへ遷移
  function handleNavigateToPasskey() {
    router.push("/passkey");
  }

  // トップページへ遷移
  function handleNavigateToHome() {
    router.push("/");
  }

  // 新規登録成功後のパスキー登録誘導UI
  if (registerSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          登録完了
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-medium">{registerSuccess.message}</p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-medium text-blue-900 mb-2">
              パスキーを登録しませんか？
            </h2>
            <p className="text-sm text-blue-700">
              パスキーを登録すると、次回から指紋認証やFace IDで
              簡単・安全にログインできます。
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleNavigateToPasskey}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              今すぐパスキーを登録
            </button>
            <button
              onClick={handleNavigateToHome}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
            >
              後で登録する
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          パスキーはいつでも設定ページから登録できます。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {mode === "login" ? "ログイン" : "新規登録"}
      </h1>

      {/* タブ切り替え */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ログイン
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          新規登録
        </button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      {/* 成功メッセージ */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* フォーム */}
      <form
        onSubmit={mode === "login" ? handleLogin : handleRegister}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        {mode === "register" && (
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              お名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
              placeholder="山田太郎"
            />
          </div>
        )}

        <div className="mb-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            placeholder="example@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading || passkeyLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              処理中...
            </span>
          ) : mode === "login" ? (
            "ログイン"
          ) : (
            "登録する"
          )}
        </button>

        {/* ログインモード時のパスキーログインボタン */}
        {mode === "login" && (
          <>
            {/* セパレーター */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">または</span>
              </div>
            </div>

            {/* パスキーログインボタン */}
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={loading || passkeyLoading}
              className="w-full py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {passkeyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  認証中...
                </span>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  パスキーでログイン
                </>
              )}
            </button>
          </>
        )}
      </form>

      {/* 説明 */}
      <p className="mt-6 text-center text-sm text-gray-500">
        {mode === "login" ? (
          <>
            パスキーを登録済みの場合は、メールアドレスを入力して
            <br />
            「パスキーでログイン」をクリックしてください。
          </>
        ) : (
          <>
            登録後、パスキーを設定して
            <br />
            より安全にログインできます。
          </>
        )}
      </p>
    </div>
  );
}
