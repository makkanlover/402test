# x402 決済プラットフォーム

HTTP 402 Payment Required プロトコルを活用したブロックチェーン決済プラットフォームのMVP実装。

## 概要

x402は、Web標準のHTTP 402ステータスコードを活用し、コンテンツへのアクセスに対して暗号資産による即時決済を実現するプロトコルです。本プラットフォームは、エンドユーザーがブロックチェーンの複雑さを意識することなく、シームレスにデジタルコンテンツを購入できる体験を提供します。

### 主な特徴

- **HTTP 402 Payment Required**: 決済が必要なコンテンツへのアクセス時に402レスポンスを返却
- **WebAuthn/Passkey認証**: パスワードレスで安全な認証
- **Avalanche決済**: Fuji Testnet上でのネイティブAVAX送金
- **即時アクセス付与**: 決済完了と同時にコンテンツへのアクセス権を付与

## クイックスタート

### 必要環境

- Node.js 20+
- npm 10+

### セットアップ

```bash
# 依存関係インストール
npm install

# Prismaクライアント生成 & DBスキーマ適用
npx prisma generate
npx prisma db push

# 開発サーバー起動
npm run dev
```

### 初期データ投入

```bash
curl -X POST http://localhost:3000/api/seed
```

### 動作確認

ブラウザで http://localhost:3000 にアクセス

## 環境変数

`.env` ファイルに以下を設定：

```env
# データベース
DATABASE_URL="file:./dev.db"

# ブロックチェーン
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
MERCHANT_WALLET_ADDRESS=0x...  # マーチャントウォレットアドレス
PAYEE_ADDRESS=0x...            # 決済先アドレス
private_key=...                # マーチャントウォレットの秘密鍵

# パスキー設定
PASSKEY_RP_NAME="x402 Payment Platform"
PASSKEY_RP_ID=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## テスト実行

### 段階的テスト

```bash
# Phase 2: ブロックチェーン疎通テスト
npx tsx scripts/test-blockchain.ts

# Phase 5: E2E結合テスト
npx tsx scripts/e2e-test.ts

# トランザクション確認
npx tsx scripts/verify-tx.ts <txHash>
```

### ビルド確認

```bash
npm run build
```
