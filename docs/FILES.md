# ファイル責務一覧

## サービス層 (`src/lib/`)

### db.ts
**責務:** Prismaデータベースクライアントの初期化と管理

```typescript
export const prisma: PrismaClient
```

- グローバルシングルトンとしてPrismaClientを管理
- 開発時のホットリロード対策（グローバル変数で保持）
- ログレベルの環境別設定

---

### auth.ts
**責務:** WebAuthn/Passkey認証とセッション管理

```typescript
// ユーザー管理
registerUser(email, name) → User
getUserByEmail(email) → User | null
getUserById(id) → User | null

// パスキー登録
generatePasskeyRegistrationOptions(userId) → PublicKeyCredentialCreationOptions
verifyPasskeyRegistration(userId, response) → boolean

// パスキー認証
generatePasskeyAuthenticationOptions(userId) → PublicKeyCredentialRequestOptions
verifyPasskeyAuthentication(userId, response) → boolean

// セッション
createSession(userId) → token
validateSession(token) → User | null
deleteSession(token) → void
```

- SimpleWebAuthnライブラリを使用
- チャレンジはインメモリMapで管理（本番はRedis等推奨）
- セッション有効期限: 24時間

---

### products.ts
**責務:** 商品の取得・管理とアクセス権制御

```typescript
// 商品取得
getAllProducts() → Product[]
getProductById(id) → Product | null

// アクセス権
checkProductAccess(userId, productId) → boolean
grantProductAccess(userId, productId, paymentId) → void
getUserProducts(userId) → ProductAccess[]

// シード
seedProducts() → number
```

---

### payments.ts
**責務:** x402決済フロー全体の管理

```typescript
// 決済開始
initiatePayment(userId, productId) → PaymentInfo  // HTTP 402用

// 決済処理
processMockPayment(paymentId, method) → void      // フロント決済シミュレーション
executeBlockchainPayment(paymentId) → TxResult    // 実際のBC送金

// 状態管理
getPaymentStatus(paymentId) → PaymentStatus
completePayment(paymentId, txHash) → void
getPaymentHistory(userId) → Payment[]
```

決済フロー:
1. `initiatePayment` → 決済ID生成、statusを`pending`に
2. `processMockPayment` → フロント決済処理、statusを`processing`に
3. `executeBlockchainPayment` → BC送金、statusを`completed`に、アクセス権付与

---

### blockchain.ts
**責務:** Avalanche Fuji Testnetとの通信

```typescript
class BlockchainService {
  // 送金
  sendNativeToken(to, amount) → TransactionResult

  // トランザクション確認
  getTransactionStatus(txHash) → TransactionResult

  // ウォレット情報
  getWalletAddress() → string
  getBalance(address?) → string
}

getBlockchainService() → BlockchainService  // シングルトン取得
```

- ethers.js v6を使用
- 環境変数から秘密鍵とRPC URLを取得
- トランザクション確認待ち（1 confirmation）

---

## 設定 (`src/config/`)

### chains.ts
**責務:** ブロックチェーンネットワーク設定

```typescript
type ChainConfig = {
  chainId: number
  name: string
  rpcUrl: string
  nativeCurrency: { name, symbol, decimals }
  blockExplorer: string
}

SUPPORTED_CHAINS: Record<number, ChainConfig>
DEFAULT_CHAIN: ChainConfig  // Avalanche Fuji
```

---

## 型定義 (`src/types/`)

### index.ts
**責務:** 共通型定義

```typescript
// 決済関連
type PaymentStatus = "pending" | "processing" | "completed" | "failed"
type PaymentMethod = "credit_card" | "paypay" | "apple_pay" | "mock"
type PaymentInfo = { paymentId, amount, currency, productId, productName, expiresAt }

// 商品関連
type ProductType = "article" | "image" | "music" | "video"
```

---

## API層 (`src/app/api/`)

### auth/register/route.ts
- `POST`: ユーザー新規登録

### auth/login/route.ts
- `POST`: メールアドレスでユーザー検索

### auth/passkey/register/route.ts
- `POST`: パスキー登録オプション生成
- `PUT`: パスキー登録レスポンス検証

### auth/passkey/authenticate/route.ts
- `POST`: パスキー認証オプション生成
- `PUT`: パスキー認証レスポンス検証 + セッション作成

### products/route.ts
- `GET`: 商品一覧取得

### products/[id]/route.ts
- `GET`: 商品詳細取得

### payments/initiate/route.ts
- `POST`: 決済開始（HTTP 402返却）

### payments/process/route.ts
- `POST`: 決済処理（BC送金実行）

### payments/[id]/route.ts
- `GET`: 決済状態取得

### payments/history/route.ts
- `GET`: ユーザーの購入履歴取得

### seed/route.ts
- `POST`: 開発用初期データ投入

---

## フロントエンド (`src/app/`)

### page.tsx
- トップページ
- 商品一覧表示
- APIから商品取得してカード形式で表示

### products/[id]/page.tsx
- 商品詳細ページ
- 購入ボタン（決済フロー開始）
- 購入済み判定

### auth/page.tsx
- 認証ページ
- ログイン/新規登録フォーム
- パスキー登録/認証UI

### history/page.tsx
- 購入履歴ページ
- 過去の購入一覧
- トランザクションエクスプローラーへのリンク

### layout.tsx
- ルートレイアウト
- ヘッダーナビゲーション
- Tailwind CSS適用

---

## データベース (`prisma/`)

### schema.prisma
- `User`: ユーザー情報
- `Passkey`: WebAuthn認証情報
- `Session`: ログインセッション
- `Product`: 商品情報
- `Payment`: 決済履歴
- `ProductAccess`: 商品アクセス権

### dev.db
- SQLiteデータベースファイル

---

## テストスクリプト (`scripts/`)

### create-test-session.ts
- テスト用セッション作成

### test-blockchain.ts
- Phase 2: ブロックチェーン疎通テスト

### verify-tx.ts
- トランザクション確認スクリプト

### e2e-test.ts
- Phase 5: 全機能結合テスト
