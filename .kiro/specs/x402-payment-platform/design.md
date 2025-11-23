# x402 決済プラットフォーム 設計書

## Overview

本設計書は、x402プロトコルを活用したエンドユーザー向け決済プラットフォームのMVP実装を定義します。このシステムは、ブロックチェーン技術を意識させることなく、デジタル商品の購入を可能にする次世代決済システムです。

### 設計目標

1. **ユーザー体験の最適化**: エンドユーザーはウォレットを持たず、従来の決済方法（クレジットカード、PayPay等）で支払いを行う
2. **技術の抽象化**: x402プロトコルとブロックチェーン処理をバックエンドで完全に隠蔽
3. **拡張性の確保**: 将来的なERC-8004統合とマルチチェーン対応を見据えた設計
4. **セキュリティ**: パスキー認証による安全な本人確認とシステムウォレットの適切な管理

### 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes, Node.js
- **認証**: WebAuthn (Passkey)
- **データベース**: PostgreSQL
- **ブロックチェーン**: Avalanche Fuji Testnet (MVP), マルチチェーン対応設計
- **スマートコントラクト**: Solidity ^0.8.20, Hardhat v2
- **ブロックチェーンSDK**: ethers.js v6
- **決済処理**: モック実装（MVP）

## Architecture

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Product List │  │ Payment Flow │  │  My Page     │      │
│  │    Page      │  │     UI       │  │  (History)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┼─────────────────────────────────┐
│                    Backend API Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Product API │  │  Payment API │  │   Auth API   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │           Business Logic Layer                      │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │     │
│  │  │   Product    │  │   Payment    │  │  Auth    │ │     │
│  │  │   Service    │  │   Service    │  │ Service  │ │     │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │     │
│  └─────────────────────────┬──────────────────────────┘     │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                   Data & External Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │ Blockchain   │  │   Passkey    │      │
│  │   Database   │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            │                                 │
│                    ┌───────┴────────┐                        │
│                    │                │                        │
│            ┌───────▼──────┐  ┌─────▼──────┐                 │
│            │  Avalanche   │  │   Base     │                 │
│            │ Fuji Testnet │  │  (Future)  │                 │
│            └──────────────┘  └────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

### 決済フロー

```
[User] 商品選択
   │
   ▼
[Frontend] GET /api/products/:id
   │
   ▼
[Backend] 商品情報取得
   │
   ▼
[User] 購入ボタンクリック
   │
   ▼
[Frontend] POST /api/payments/initiate
   │
   ▼
[Backend] HTTP 402 Payment Required
   │       + 決済情報生成
   │
   ▼
[Frontend] 決済方法選択画面表示
   │
   ▼
[User] 決済方法選択（クレカ/PayPay等）
   │
   ▼
[Frontend] パスキー認証プロンプト
   │
   ▼
[User] パスキー認証
   │
   ▼
[Frontend] POST /api/payments/authenticate
   │
   ▼
[Backend] 認証検証 → authToken発行
   │
   ▼
[Frontend] POST /api/payments/process
   │
   ▼
[Backend] モック決済処理（1-3秒）
   │
   ▼
[Backend] POST /api/payments/execute
   │
   ▼
[Blockchain Service] トランザクション実行
   │                   - システムウォレットから送信
   │                   - ERC-20トークン転送
   │
   ▼
[Avalanche] トランザクション確認
   │
   ▼
[Backend] 決済完了処理
   │       - アクセス権付与
   │       - 履歴記録
   │
   ▼
[Frontend] 決済完了画面表示
   │       - トランザクションハッシュ
   │       - 商品アクセスリンク
```

## Components and Interfaces

### Frontend Components

#### 1. Product Components
- `ProductList`: 商品一覧表示コンポーネント
- `ProductCard`: 商品カード（サムネイル、価格、購入ボタン）
- `ProductDetail`: 商品詳細表示

#### 2. Payment Components
- `PaymentMethodSelector`: 決済方法選択UI
- `PasskeyAuthPrompt`: パスキー認証プロンプト
- `PaymentProcessing`: 決済処理中のローディング表示
- `PaymentComplete`: 決済完了画面
- `PaymentError`: エラー表示

#### 3. User Components
- `LoginForm`: ログインフォーム
- `RegisterForm`: ユーザー登録フォーム
- `PasskeyRegistration`: パスキー登録フロー
- `PurchaseHistory`: 購入履歴表示

### Backend Services

#### 1. ProductService
```typescript
interface ProductService {
  // 商品一覧取得
  getProducts(): Promise<Product[]>;
  
  // 商品詳細取得
  getProductById(id: string): Promise<Product | null>;
  
  // 商品作成（管理者用）
  createProduct(data: CreateProductDto): Promise<Product>;
  
  // アクセス権確認
  checkAccess(userId: string, productId: string): Promise<boolean>;
}
```

#### 2. PaymentService
```typescript
interface PaymentService {
  // 決済開始（402レスポンス生成）
  initiatePayment(productId: string, userId: string): Promise<PaymentInfo>;
  
  // 決済状態確認
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  
  // モック決済処理
  processMockPayment(paymentId: string, method: PaymentMethod): Promise<void>;
  
  // ブロックチェーン決済実行
  executeBlockchainPayment(paymentId: string): Promise<TransactionResult>;
  
  // 決済完了処理
  completePayment(paymentId: string, txHash: string): Promise<void>;
  
  // 決済履歴取得
  getPaymentHistory(userId: string): Promise<Payment[]>;
}
```

#### 3. AuthService
```typescript
interface AuthService {
  // ユーザー登録
  register(email: string, name: string): Promise<User>;
  
  // ログイン
  login(email: string): Promise<SessionToken>;
  
  // パスキー登録
  registerPasskey(userId: string, credential: PublicKeyCredential): Promise<void>;
  
  // パスキー認証
  authenticatePasskey(userId: string, credential: PublicKeyCredential): Promise<AuthToken>;
  
  // 認証トークン検証
  verifyAuthToken(token: string): Promise<User | null>;
}
```

#### 4. BlockchainService
```typescript
interface BlockchainService {
  // システムウォレット取得
  getSystemWallet(chainId: number): Wallet;
  
  // トランザクション実行
  sendTransaction(
    chainId: number,
    to: string,
    amount: bigint,
    tokenAddress: string
  ): Promise<TransactionReceipt>;
  
  // トランザクション確認
  waitForTransaction(txHash: string, chainId: number): Promise<TransactionReceipt>;
  
  // ガス代見積もり
  estimateGas(chainId: number, tx: TransactionRequest): Promise<bigint>;
  
  // チェーン設定取得
  getChainConfig(chainId: number): ChainConfig;
}
```

### API Endpoints

#### Product API
- `GET /api/products` - 商品一覧取得
- `GET /api/products/:id` - 商品詳細取得
- `POST /api/products` - 商品作成（管理者）

#### Payment API
- `POST /api/payments/initiate` - 決済開始
- `POST /api/payments/authenticate` - パスキー認証
- `POST /api/payments/process` - モック決済処理
- `POST /api/payments/execute` - ブロックチェーン決済実行
- `GET /api/payments/:id` - 決済状態確認
- `GET /api/payments/history` - 決済履歴取得

#### Auth API
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/passkey/register` - パスキー登録
- `POST /api/auth/passkey/authenticate` - パスキー認証

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Passkeys Table
```sql
CREATE TABLE passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  type VARCHAR(50) NOT NULL,
  content_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- pending, processing, completed, failed
  payment_method VARCHAR(50),
  chain_id INTEGER,
  transaction_hash TEXT,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Product Access Table
```sql
CREATE TABLE product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  payment_id UUID REFERENCES payments(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);
```

### TypeScript Types

```typescript
// User
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'article' | 'image' | 'music' | 'video';
  contentUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment
interface Payment {
  id: string;
  paymentId: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod?: string;
  chainId?: number;
  transactionHash?: string;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Info (402 Response)
interface PaymentInfo {
  paymentId: string;
  amount: number;
  currency: string;
  productId: string;
  productName: string;
  expiresAt: Date;
}

// Transaction Result
interface TransactionResult {
  transactionHash: string;
  chainId: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Chain Config
interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  paymentProcessorAddress: string;
  usdcAddress: string;
  explorerUrl: string;
}
```

### Smart Contract Interfaces

#### PaymentProcessor.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPaymentProcessor {
    struct Payment {
        bytes32 paymentId;
        address payer;
        address payee;
        uint256 amount;
        address token;
        uint256 timestamp;
        string productId;
    }
    
    event PaymentRecorded(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        address token,
        string productId
    );
    
    function recordPayment(
        bytes32 paymentId,
        address payee,
        uint256 amount,
        address token,
        string memory productId
    ) external returns (bool);
    
    function getPayment(bytes32 paymentId) external view returns (Payment memory);
    
    function getUserPayments(address user) external view returns (Payment[] memory);
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Product registration round trip
*For any* valid product data (name, description, price, type), registering the product and then retrieving it by ID should return equivalent product information.
**Validates: Requirements 1.1**

### Property 2: Payment information completeness
*For any* product and user, when initiating a payment, the generated payment information should contain all required fields (paymentId, amount, currency, productId, productName, expiresAt).
**Validates: Requirements 2.2**

### Property 3: Payment state transition validity
*For any* payment, the status transitions should follow the valid sequence: pending → processing → completed (or failed), and never transition backwards or skip states.
**Validates: Requirements 2.3**

### Property 4: Passkey registration persistence
*For any* user and valid passkey credential, after registration, the passkey should be retrievable from the database and associated with the correct user.
**Validates: Requirements 2.5**

### Property 5: Passkey authentication correctness
*For any* registered passkey, authentication with the correct credential should succeed, and authentication with an incorrect or unregistered credential should fail.
**Validates: Requirements 2.6**

### Property 6: Auth token validity
*For any* successfully authenticated user, the issued auth token should be verifiable and return the correct user information.
**Validates: Requirements 2.7**

### Property 7: Mock payment processing time
*For any* mock payment request, the processing time should be between 1 and 3 seconds (inclusive).
**Validates: Requirements 2.10**

### Property 8: System wallet initialization
*For any* supported chain ID, the system should be able to initialize a wallet with a valid address and private key.
**Validates: Requirements 2.11**

### Property 9: Multi-chain configuration retrieval
*For any* supported chain ID, requesting the chain configuration should return a valid config with all required fields (chainId, name, rpcUrl, paymentProcessorAddress, usdcAddress, explorerUrl).
**Validates: Requirements 2.12**

### Property 10: Gas estimation positivity
*For any* valid transaction request on a supported chain, the estimated gas should be a positive value greater than zero.
**Validates: Requirements 2.14**

### Property 11: Transaction hash persistence
*For any* executed blockchain transaction, the transaction hash should be recorded in the database and retrievable via the payment ID.
**Validates: Requirements 2.15**

### Property 12: Transaction status determination
*For any* blockchain transaction, after confirmation, the status should be correctly determined as either 'confirmed' or 'failed' based on the transaction receipt.
**Validates: Requirements 2.17**

### Property 13: Chain switching via configuration
*For any* two different chain IDs in the configuration, switching between them should result in connections to different RPC URLs and different contract addresses.
**Validates: Requirements 2.19**

### Property 14: Chain-specific RPC URL mapping
*For any* chain ID in the configuration, the returned RPC URL should be unique to that chain and valid.
**Validates: Requirements 2.20**

### Property 15: Chain-specific contract address mapping
*For any* chain ID in the configuration, the returned contract addresses (PaymentProcessor, USDC) should be unique to that chain and valid Ethereum addresses.
**Validates: Requirements 2.21**

### Property 16: Access grant after payment
*For any* completed payment, the user should be granted access to the purchased product, and this access should be verifiable.
**Validates: Requirements 2.22**

### Property 17: Payment history persistence
*For any* completed payment, it should appear in the user's payment history and contain all relevant information (paymentId, productId, amount, status, transactionHash).
**Validates: Requirements 2.23**

### Property 18: Product access control
*For any* product, a user with granted access should be able to access the product content, and a user without access should be denied.
**Validates: Requirements 3.11**

### Property 19: User registration uniqueness
*For any* email address, registering a user should succeed on the first attempt, and attempting to register the same email again should fail with an appropriate error.
**Validates: Requirements 3.12**

### Property 20: Login authentication
*For any* registered user, login with the correct email should succeed and return a valid session token, while login with an unregistered email should fail.
**Validates: Requirements 3.13**

### Property 21: Product list API response
*For any* request to GET /api/products, the response should be an array of products, where each product contains all required fields.
**Validates: Requirements 4.1**

### Property 22: Product detail API response
*For any* existing product ID, GET /api/products/:id should return the product with all details, and for a non-existent ID, it should return a 404 error.
**Validates: Requirements 4.2**

### Property 23: Product creation API response
*For any* valid product data, POST /api/products should create the product and return the created product with a generated ID.
**Validates: Requirements 4.3**

### Property 24: Payment authentication API correctness
*For any* payment with valid passkey credentials, POST /api/payments/authenticate should succeed and return an auth token, while invalid credentials should fail.
**Validates: Requirements 4.5**

### Property 25: Payment status API response
*For any* existing payment ID, GET /api/payments/:id should return the current payment status, and for a non-existent ID, it should return a 404 error.
**Validates: Requirements 4.8**

### Property 26: Payment history API response
*For any* user, GET /api/payments/history should return only that user's payments, ordered by creation date (most recent first).
**Validates: Requirements 4.9**

### Property 27: User registration API response
*For any* valid user data (email, name), POST /api/auth/register should create the user and return the user object with a generated ID.
**Validates: Requirements 4.10**

### Property 28: Login API response
*For any* registered user email, POST /api/auth/login should return a valid session token.
**Validates: Requirements 4.11**

### Property 29: Passkey registration API response
*For any* valid user ID and passkey credential, POST /api/auth/passkey/register should succeed and return a success confirmation.
**Validates: Requirements 4.12**

### Property 30: Passkey authentication API response
*For any* registered passkey, POST /api/auth/passkey/authenticate should return a valid auth token.
**Validates: Requirements 4.13**

### Property 31: Input validation rejection
*For any* API endpoint, malicious input patterns (SQL injection strings, XSS scripts, excessively long strings) should be rejected with appropriate error messages.
**Validates: Requirements S.1, S.2, S.3**

## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)
- 不正な入力データ
- 必須フィールドの欠落
- データ型の不一致
- 値の範囲外

```typescript
interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  fields?: {
    [key: string]: string;
  };
}
```

#### 2. Authentication Errors (401 Unauthorized)
- 認証トークンの欠落
- 無効な認証トークン
- 期限切れのトークン
- パスキー認証の失敗

```typescript
interface AuthenticationError {
  code: 'AUTHENTICATION_ERROR';
  message: string;
  reason: 'missing_token' | 'invalid_token' | 'expired_token' | 'passkey_failed';
}
```

#### 3. Authorization Errors (403 Forbidden)
- アクセス権限なし
- 商品へのアクセス拒否

```typescript
interface AuthorizationError {
  code: 'AUTHORIZATION_ERROR';
  message: string;
  resource: string;
}
```

#### 4. Not Found Errors (404 Not Found)
- 商品が見つからない
- 決済情報が見つからない
- ユーザーが見つからない

```typescript
interface NotFoundError {
  code: 'NOT_FOUND';
  message: string;
  resource: string;
  id: string;
}
```

#### 5. Payment Errors (402 Payment Required)
- 決済が必要
- 決済情報の提供

```typescript
interface PaymentRequiredError {
  code: 'PAYMENT_REQUIRED';
  message: string;
  paymentInfo: PaymentInfo;
}
```

#### 6. Blockchain Errors (500 Internal Server Error)
- トランザクション送信失敗
- ガス代不足
- ネットワーク接続エラー
- コントラクト実行エラー

```typescript
interface BlockchainError {
  code: 'BLOCKCHAIN_ERROR';
  message: string;
  reason: 'tx_failed' | 'insufficient_gas' | 'network_error' | 'contract_error';
  chainId?: number;
  txHash?: string;
}
```

#### 7. Database Errors (500 Internal Server Error)
- データベース接続エラー
- クエリ実行エラー
- 制約違反

```typescript
interface DatabaseError {
  code: 'DATABASE_ERROR';
  message: string;
  reason: 'connection_error' | 'query_error' | 'constraint_violation';
}
```

### Error Handling Strategy

#### Frontend Error Handling
1. **ユーザーフレンドリーなメッセージ**: 技術的な詳細を隠し、わかりやすい日本語メッセージを表示
2. **リトライ機能**: ネットワークエラーやタイムアウトの場合、自動または手動でリトライ
3. **エラーログ**: エラー情報をコンソールに記録（開発環境のみ）
4. **フォールバック**: エラー時の代替UI表示

#### Backend Error Handling
1. **エラーロギング**: 全てのエラーをログに記録（本番環境では外部ログサービスへ）
2. **エラーレスポンスの統一**: 一貫したエラーレスポンス形式
3. **スタックトレースの隠蔽**: 本番環境ではスタックトレースを返さない
4. **リトライロジック**: ブロックチェーン接続やデータベース接続のリトライ

#### Blockchain Error Handling
1. **トランザクション失敗時の処理**:
   - 決済ステータスを'failed'に更新
   - ユーザーに通知
   - エラー詳細をログに記録
2. **ガス代不足時の処理**:
   - システムウォレットの残高確認
   - 管理者に通知
   - ユーザーに一時的なエラーメッセージ
3. **ネットワークエラー時の処理**:
   - 複数のRPCエンドポイントでリトライ
   - タイムアウト設定（30秒）
   - フォールバックチェーンへの切り替え（将来）

## Testing Strategy

### Unit Testing

#### Testing Framework
- **Framework**: Vitest
- **Assertion Library**: Vitest built-in assertions
- **Mocking**: Vitest mocking utilities

#### Unit Test Coverage
1. **Service Layer Tests**
   - ProductService: 商品CRUD操作
   - PaymentService: 決済ロジック
   - AuthService: 認証・認可ロジック
   - BlockchainService: ブロックチェーン接続とトランザクション

2. **API Route Tests**
   - 各エンドポイントのリクエスト/レスポンス検証
   - エラーハンドリング
   - 認証・認可チェック

3. **Utility Function Tests**
   - バリデーション関数
   - データ変換関数
   - 暗号化・復号化関数

### Property-Based Testing

#### Testing Framework
- **Framework**: fast-check
- **Integration**: Vitest + fast-check
- **Configuration**: Minimum 100 iterations per property test

#### Property Test Implementation
- Each correctness property defined in this document MUST be implemented as a property-based test
- Each property test MUST be tagged with a comment in the following format:
  ```typescript
  // **Feature: x402-payment-platform, Property 1: Product registration round trip**
  ```
- Property tests should use smart generators that constrain the input space intelligently
- Property tests should avoid mocking when possible to test real behavior

#### Property Test Examples

```typescript
import { test } from 'vitest';
import * as fc from 'fast-check';

// **Feature: x402-payment-platform, Property 1: Product registration round trip**
test('Product registration round trip', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        description: fc.string({ maxLength: 1000 }),
        price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        type: fc.constantFrom('article', 'image', 'music', 'video'),
      }),
      async (productData) => {
        const created = await productService.createProduct(productData);
        const retrieved = await productService.getProductById(created.id);
        
        expect(retrieved).toBeDefined();
        expect(retrieved!.name).toBe(productData.name);
        expect(retrieved!.description).toBe(productData.description);
        expect(retrieved!.price).toBe(productData.price);
        expect(retrieved!.type).toBe(productData.type);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

#### Test Scenarios
1. **End-to-End Payment Flow**
   - 商品選択 → 決済開始 → パスキー認証 → モック決済 → ブロックチェーン決済 → 完了
2. **User Registration and Authentication**
   - ユーザー登録 → パスキー登録 → ログイン → パスキー認証
3. **Product Access Control**
   - 商品購入 → アクセス権確認 → コンテンツアクセス

#### Testing Environment
- **Database**: PostgreSQL test instance (Docker)
- **Blockchain**: Avalanche Fuji Testnet or local Hardhat network
- **Mock Services**: Payment method mocks

### Smart Contract Testing

#### Testing Framework
- **Framework**: Hardhat with Chai
- **Network**: Hardhat local network
- **Coverage**: hardhat-coverage

#### Test Cases
1. **PaymentProcessor Contract**
   - 決済記録の保存
   - 決済情報の取得
   - ユーザー決済履歴の取得
   - イベント発行の確認
   - アクセス制御（ownerのみ実行可能な関数）

2. **Edge Cases**
   - ゼロ金額の決済
   - 無効なアドレス
   - 重複する決済ID

### Manual Testing

#### Test Scenarios
1. **UI/UX Testing**
   - 商品一覧の表示
   - 決済フローの操作性
   - エラーメッセージの表示
   - レスポンシブデザイン

2. **Browser Compatibility**
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **Passkey Testing**
   - パスキー登録（各ブラウザ）
   - パスキー認証（各ブラウザ）
   - 複数デバイスでの動作

## Security Considerations

### Authentication and Authorization

#### Passkey Security
- WebAuthn標準に準拠した実装
- チャレンジ-レスポンス方式による認証
- 公開鍵暗号を使用した署名検証
- リプレイ攻撃対策（カウンター検証）

#### Session Management
- セッショントークンの安全な生成（crypto.randomBytes）
- トークンの有効期限設定（24時間）
- HTTPOnly, Secure, SameSite属性の設定
- トークンの定期的なローテーション

### Input Validation

#### Validation Strategy
1. **型チェック**: TypeScriptの型システムを活用
2. **スキーマ検証**: Zodを使用したランタイム検証
3. **サニタイゼーション**: XSS対策のための入力サニタイズ
4. **長さ制限**: 全ての文字列入力に最大長を設定
5. **ホワイトリスト**: 許可された値のみを受け入れる

#### Validation Examples
```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000),
  price: z.number().positive().max(1000000),
  type: z.enum(['article', 'image', 'music', 'video']),
});

const PaymentMethodSchema = z.enum(['credit_card', 'paypay', 'apple_pay']);
```

### Blockchain Security

#### Private Key Management
- 環境変数での秘密鍵管理（MVP）
- 秘密鍵のハードコード禁止
- 将来的にはKMS（Key Management Service）への移行
- アクセスログの記録

#### Transaction Security
- ガス代の上限設定
- トランザクションの署名検証
- ノンス管理による二重送信防止
- トランザクション確認の待機

#### Smart Contract Security
- OpenZeppelin契約の使用
- アクセス制御の実装（Ownable）
- リエントランシー攻撃対策（ReentrancyGuard）
- 整数オーバーフロー対策（Solidity 0.8+）

### API Security

#### Rate Limiting
- IPアドレスベースのレート制限
- ユーザーベースのレート制限
- エンドポイント別の制限設定

#### CORS Configuration
- 許可されたオリジンのホワイトリスト
- 認証情報を含むリクエストの制限
- プリフライトリクエストの適切な処理

#### HTTPS Enforcement
- 全ての通信をHTTPSで暗号化
- HSTS（HTTP Strict Transport Security）の有効化
- 証明書の定期的な更新

### Database Security

#### SQL Injection Prevention
- パラメータ化クエリの使用
- ORMの活用（Prisma/Drizzle）
- 入力検証の徹底

#### Data Encryption
- パスワードのハッシュ化（bcrypt）
- 機密データの暗号化（AES-256）
- データベース接続の暗号化（SSL/TLS）

#### Access Control
- 最小権限の原則
- データベースユーザーの分離
- 監査ログの記録

## Deployment Strategy

### Environment Configuration

#### Development Environment
- ローカル開発サーバー（Next.js dev server）
- ローカルPostgreSQLデータベース（Docker）
- Hardhatローカルネットワーク
- テスト用の秘密鍵とウォレット

#### Staging Environment
- Vercel Preview Deployment
- Supabase PostgreSQL（staging）
- Avalanche Fuji Testnet
- テスト用のシステムウォレット

#### Production Environment
- Vercel Production Deployment
- Supabase PostgreSQL（production）
- Avalanche Fuji Testnet（MVP）
- 本番用のシステムウォレット

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Blockchain
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
SYSTEM_WALLET_PRIVATE_KEY=0x...
PAYMENT_PROCESSOR_ADDRESS=0x...
USDC_ADDRESS=0x...

# Authentication
SESSION_SECRET=...
PASSKEY_RP_ID=localhost
PASSKEY_RP_NAME=x402 Payment Platform

# API Keys
ALCHEMY_API_KEY=...

# Environment
NODE_ENV=development|staging|production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Deployment Steps

#### 1. Smart Contract Deployment
```bash
# Compile contracts
npx hardhat compile

# Deploy to Fuji testnet
npx hardhat run scripts/deploy.ts --network fuji

# Verify contract
npx hardhat verify --network fuji <CONTRACT_ADDRESS>
```

#### 2. Database Migration
```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 3. Frontend/Backend Deployment
```bash
# Build application
npm run build

# Deploy to Vercel
vercel --prod
```

### Monitoring and Logging

#### Application Monitoring
- エラーログの収集（Sentry）
- パフォーマンスモニタリング（Vercel Analytics）
- アップタイムモニタリング（UptimeRobot）

#### Blockchain Monitoring
- トランザクション監視（Snowtrace）
- ウォレット残高監視
- ガス代の追跡

#### Database Monitoring
- クエリパフォーマンス
- 接続プール状態
- ストレージ使用量

## Future Enhancements

### ERC-8004 Integration

#### Architecture Changes
- エージェント抽象化レイヤーの追加
- プラグイン方式でのエージェント統合
- Identity Registry, Reputation Registry, Validation Registryの実装

#### New Components
- AgentService: エージェント管理
- ReputationService: 評価管理
- ValidationService: 検証管理

#### API Extensions
- `POST /api/agents` - エージェント登録
- `GET /api/agents/:id` - エージェント詳細
- `POST /api/reviews` - 評価投稿
- `GET /api/reviews/:agentId` - 評価取得

### Multi-Chain Expansion

#### Supported Chains
- Base Mainnet/Testnet
- Ethereum Mainnet/Sepolia
- Polygon PoS/Mumbai
- Arbitrum One/Goerli

#### Chain Abstraction
- 統一されたインターフェース
- チェーン別の最適化
- クロスチェーンブリッジ統合

### Real Payment Integration

#### Payment Providers
- Stripe（クレジットカード）
- PayPay API
- Apple Pay
- Google Pay

#### Payment Flow Changes
- 実際の決済処理
- Webhook処理
- 返金処理

### Advanced Features

#### Subscription Payments
- 定期支払いの自動化
- サブスクリプション管理
- 自動更新とキャンセル

#### P2P Payments
- ユーザー間送金
- エスクロー機能
- 紛争解決メカニズム

#### Analytics Dashboard
- 売上分析
- ユーザー行動分析
- トランザクション統計

## Appendix

### Technology References

#### WebAuthn Resources
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [SimpleWebAuthn Library](https://simplewebauthn.dev/)

#### Blockchain Resources
- [Avalanche Documentation](https://docs.avax.network/)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [Hardhat Documentation](https://hardhat.org/docs)

#### Framework Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)

### Glossary

- **x402**: HTTP 402 Payment Requiredを活用した決済プロトコル
- **ERC-8004**: AIエージェントのアイデンティティ、評判、検証を管理する標準
- **Passkey**: WebAuthnを使用したパスワードレス認証
- **System Wallet**: エンドユーザーの代わりに決済を実行するサービス側のウォレット
- **MVP**: Minimum Viable Product（最小実行可能製品）
- **Property-Based Testing**: ランダムな入力に対して普遍的な性質を検証するテスト手法
