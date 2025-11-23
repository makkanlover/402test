# x402 決済プラットフォーム ドキュメント

## 目次

### 1. [README](./README.md)
プロジェクト概要、クイックスタート、環境変数設定

### 2. [ARCHITECTURE](./ARCHITECTURE.md)
システム構成、技術スタック、ディレクトリ構成、データベーススキーマ、決済フロー図

### 3. [API](./API.md)
全APIエンドポイントの仕様（リクエスト/レスポンス形式）

### 4. [FILES](./FILES.md)
各ファイルの責務と主要な関数・クラスの説明

### 5. [DEVELOPMENT](./DEVELOPMENT.md)
開発ガイド、段階的テストプロトコル、機能追加手順、コーディング規約

---

## クイックリファレンス

### 起動コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番起動
npm start
```

### テストコマンド

```bash
# ブロックチェーン疎通テスト
npx tsx scripts/test-blockchain.ts

# E2Eテスト
npx tsx scripts/e2e-test.ts
```

### データベースコマンド

```bash
# スキーマ適用
npx prisma db push

# クライアント生成
npx prisma generate

# スタジオ（GUI）
npx prisma studio
```

### 主要エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/auth/register` | POST | ユーザー登録 |
| `/api/auth/passkey/register` | POST/PUT | パスキー登録 |
| `/api/auth/passkey/authenticate` | POST/PUT | パスキー認証 |
| `/api/products` | GET | 商品一覧 |
| `/api/payments/initiate` | POST | 決済開始（402） |
| `/api/payments/process` | POST | 決済実行 |
| `/api/payments/history` | GET | 購入履歴 |

### 設定ファイル

| ファイル | 用途 |
|---------|------|
| `.env` | 環境変数 |
| `prisma/schema.prisma` | DBスキーマ |
| `next.config.ts` | Next.js設定 |
| `tailwind.config.ts` | Tailwind設定 |
| `.claude/state/plan.json` | 開発進捗管理 |
