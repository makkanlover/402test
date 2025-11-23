# プロジェクト要件定義書

## プロジェクト概要

### プロジェクト名
x402 決済プラットフォーム（将来的にERC-8004統合予定）

### 目的
Hack2Build: AI Payments ハッカソンにおいて、x402プロトコルを活用した、エンドユーザーにブロックチェーンを意識させない次世代決済システムを構築する。

### コアコンセプト
1. **エンドユーザーはウォレット不要**：システム側のウォレットで代理決済
2. **技術を隠蔽したUX**：x402やブロックチェーンを意識させない
3. **汎用性の高いAPI**：誰でも簡単に統合できる決済API
4. **拡張性の確保**：将来的にERC-8004（AIエージェント）統合可能な設計

### 対象ブロックチェーン
- **MVP検証対象**：Avalanche Fuji Testnet
- **実装対応**：マルチチェーン対応（Avalanche、Base等）
- **将来拡張**：他のEVMチェーンにも対応可能な設計

---

## ターゲットユーザー

### 主要ユーザー
**エンドユーザー（一般消費者）**
- デジタル商品を購入したい人
- ブロックチェーンやウォレットの知識は不要
- クレジットカードやPayPayなど、慣れた決済方法を使いたい

### 将来的なユーザー（拡張フェーズ）
- AIエージェント開発者
- AIエージェント利用者
- サービスプロバイダー（API提供者）

---

## MVP決済フロー

### ユーザー体験
1. **商品選択**：エンドユーザーがデジタル商品（記事、画像素材等）を選択
2. **402レスポンス**：サーバーがHTTP 402で決済要求を返す
3. **決済方法選択**：ユーザーが画面から決済方法を選択（クレジットカード、PayPay等）※モック実装
4. **パスキー認証**：ユーザーがパスキーで本人確認
5. **ブロックチェーン決済**：システムウォレットから自動的にブロックチェーン上で支払い実行
6. **決済完了**：商品へのアクセス権が付与される

### 技術フロー
```
[エンドユーザー] 
    ↓ 商品購入リクエスト
[フロントエンド]
    ↓ HTTP 402 Payment Required
[バックエンドAPI]
    ↓ 決済情報生成
[パスキー認証]
    ↓ 認証成功
[決済サービス（モック）]
    ↓ 決済確認
[ブロックチェーン決済実行]
    ↓ トランザクション送信
[Avalanche Testnet]
    ↓ トランザクション確認
[商品アクセス権付与]
```

---

## 技術スタック

### ブロックチェーン層
- **スマートコントラクト**: Solidity
- **開発フレームワーク**: Hardhat / Foundry
- **ネットワーク**: 
  - MVP検証：Avalanche Fuji Testnet
  - 実装対応：マルチチェーン（設定ファイルで切り替え可能）
- **トークン規格**: ERC-20（決済トークン）
- **ウォレット管理**: システム側で秘密鍵管理（MVP：ベタ書きOK）

### バックエンド
- **サーバー**: Node.js / Express.js または Next.js API Routes
- **x402実装**: HTTP 402レスポンス処理
- **決済処理**: 
  - パスキー認証統合
  - 決済サービスモック（クレカ、PayPay等）
  - ブロックチェーントランザクション実行
- **データベース**: PostgreSQL または MongoDB
  - ユーザー情報
  - 決済履歴
  - 商品情報
- **認証**: WebAuthn（パスキー）

### フロントエンド
- **フレームワーク**: Next.js / React
- **UI**: Tailwind CSS / shadcn/ui
- **状態管理**: React Query / Zustand
- **認証UI**: パスキー認証フロー
- **決済UI**: 決済方法選択、決済状況表示
- **注意**: ウォレット接続UI不要（エンドユーザーはウォレット不要）

### インフラ
- **ホスティング**: Vercel / Railway
- **ブロックチェーンRPC**: Alchemy / Infura（Avalanche対応）
- **CI/CD**: GitHub Actions

---

## 機能要件

### 優先度の定義
- **[MVP]**: 最小実行可能製品として必須
- **[拡張]**: 将来的に実装予定
- **[検討]**: 必要に応じて実装

---

## MVP機能要件（優先度：高）

### 1. 商品管理

#### 1.1 商品マスタ
- [MVP] デジタル商品の登録機能
  - 商品名
  - 説明
  - 価格（USD）
  - 商品タイプ（記事、画像、音楽等）
  - アクセスURL/コンテンツ
- [MVP] 商品一覧表示
- [MVP] 商品詳細表示

### 2. x402 決済システム

#### 2.1 HTTP 402実装
- [MVP] HTTP 402 Payment Requiredレスポンス
- [MVP] 決済情報の生成
  - 決済ID
  - 金額
  - 商品情報
  - タイムスタンプ
- [MVP] 決済状態管理（未払い/処理中/完了/失敗）

#### 2.2 パスキー認証
- [MVP] WebAuthn統合
- [MVP] パスキー登録フロー
- [MVP] パスキー認証フロー
- [MVP] ユーザー認証状態管理

#### 2.3 決済処理（モック）
- [MVP] 決済方法選択UI
  - クレジットカード（モック）
  - PayPay（モック）
  - その他電子マネー（モック）
- [MVP] モック決済処理
  - 常に成功を返す
  - 決済確認画面
  - 処理時間シミュレーション（1-3秒）

#### 2.4 ブロックチェーン決済
- [MVP] システムウォレット管理
  - 秘密鍵管理（MVP：環境変数でOK）
  - 複数チェーン対応の設計
  - 実装：Avalanche Fuji Testnet
- [MVP] トランザクション実行
  - ERC-20トークン送信
  - ガス代計算
  - トランザクションハッシュ記録
- [MVP] トランザクション確認
  - ブロック確認待ち
  - 成功/失敗判定
- [MVP] マルチチェーン対応設計
  - 設定ファイルでチェーン切り替え
  - チェーン別のRPC URL管理
  - チェーン別のコントラクトアドレス管理

#### 2.5 決済完了処理
- [MVP] 商品アクセス権付与
- [MVP] 決済履歴の記録
- [MVP] 決済完了通知

### 3. ユーザーインターフェース

#### 3.1 商品ページ
- [MVP] 商品一覧ページ
  - カード形式表示
  - 価格表示
  - 購入ボタン
- [MVP] 商品詳細ページ
  - 商品情報
  - 価格
  - 購入ボタン

#### 3.2 決済フロー画面
- [MVP] 決済方法選択画面
  - 決済方法一覧
  - 選択UI
- [MVP] パスキー認証画面
  - 認証プロンプト
  - エラーハンドリング
- [MVP] 決済処理中画面
  - ローディング表示
  - 進捗状況
- [MVP] 決済完了画面
  - 成功メッセージ
  - トランザクションハッシュ表示
  - 商品アクセスリンク

#### 3.3 マイページ
- [MVP] 購入履歴
  - 購入日時
  - 商品名
  - 金額
  - トランザクションハッシュ
  - ステータス
- [MVP] 購入済み商品へのアクセス

#### 3.4 認証画面
- [MVP] ユーザー登録（メールアドレス）
- [MVP] ログイン
- [MVP] パスキー登録

### 4. バックエンドAPI

#### 4.1 商品API
- [MVP] `GET /api/products` - 商品一覧取得
- [MVP] `GET /api/products/:id` - 商品詳細取得
- [MVP] `POST /api/products` - 商品登録（管理者用）

#### 4.2 決済API
- [MVP] `POST /api/payments/initiate` - 決済開始
  - 402レスポンス返却
  - 決済情報生成
- [MVP] `POST /api/payments/authenticate` - パスキー認証
- [MVP] `POST /api/payments/process` - 決済処理（モック）
- [MVP] `POST /api/payments/execute` - ブロックチェーン決済実行
- [MVP] `GET /api/payments/:id` - 決済状態確認
- [MVP] `GET /api/payments/history` - 決済履歴取得

#### 4.3 認証API
- [MVP] `POST /api/auth/register` - ユーザー登録
- [MVP] `POST /api/auth/login` - ログイン
- [MVP] `POST /api/auth/passkey/register` - パスキー登録
- [MVP] `POST /api/auth/passkey/authenticate` - パスキー認証

---

## 拡張機能要件（優先度：中）

### 1. ERC-8004 エージェントレジストリ統合

#### 1.1 アーキテクチャ設計
- [拡張] エージェント抽象化レイヤー
  - 決済ロジックとエージェントロジックの分離
  - プラグイン方式での統合
- [拡張] エージェントインターフェース定義

#### 1.2 Identity Registry（アイデンティティ管理）
- [拡張] エージェントの登録機能（ERC-721 NFT発行）
- [拡張] エージェントメタデータの管理
- [拡張] メタデータのIPFS保存
- [拡張] エージェントの検索・一覧表示機能

#### 1.3 Reputation Registry（評判管理）
- [拡張] エージェント評価の投稿機能
- [拡張] 支払い証明の検証（x402連携）
- [拡張] 評価履歴の表示

#### 1.4 Validation Registry（検証管理）
- [拡張] 検証リクエストの作成
- [拡張] 検証モデルの選択機能
- [拡張] 検証結果の記録・表示

### 2. AIエージェント機能

#### 2.1 エージェントAPI
- [拡張] タスク実行エンドポイント
- [拡張] 能力クエリAPI
- [拡張] ステータス確認API

#### 2.2 エージェント間通信
- [拡張] A2A（Agent-to-Agent）プロトコル実装
- [拡張] タスク委託機能
- [拡張] 自動支払い処理

#### 2.3 AIによる決済最適化
- [拡張] ユーザーの要望に応じた決済方法選択
- [拡張] 最適なチェーン選択
- [拡張] ガス代最適化

### 3. 追加決済機能

#### 3.1 決済方法の拡充
- [拡張] 実際のクレジットカード決済統合
- [拡張] 実際のPayPay統合
- [拡張] その他決済サービス統合

#### 3.2 高度な決済フロー
- [拡張] サブスクリプション自動支払い
- [拡張] 従量課金決済
- [拡張] P2P送金
- [拡張] チップ・投げ銭機能

---

## 検討中機能（優先度：低）

- [検討] 店頭決済（QRコード）
- [検討] マルチトークン支払い対応
- [検討] NFT商品対応
- [検討] オークション機能
- [検討] エスクロー機能

---

## 非機能要件

### セキュリティ（MVP）
- [MVP] 入力検証の徹底
- [MVP] SQL/NoSQLインジェクション対策
- [MVP] XSS対策
- [MVP] CSRF対策
- [MVP] パスキー認証の実装
- [MVP] 秘密鍵の管理（環境変数、将来的にはKMS）
- [MVP] HTTPS通信の強制
- [拡張] スマートコントラクトの監査
- [拡張] レート制限の実装
- [拡張] Sybil攻撃対策

### パフォーマンス（MVP）
- [MVP] ページロード時間: 3秒以内
- [MVP] API レスポンス時間: 2秒以内（ブロックチェーン処理除く）
- [MVP] ブロックチェーントランザクション: 30秒以内
- [拡張] ガスコスト最適化
- [拡張] 並行処理の実装

### ユーザビリティ（MVP）
- [MVP] 直感的なUI/UX
  - ブロックチェーンを意識させない
  - 決済フローが明確
  - エラーメッセージがわかりやすい
- [MVP] レスポンシブデザイン（モバイル対応）
- [MVP] 日本語対応
- [拡張] 多言語対応（英語等）
- [拡張] アクセシビリティ対応（WCAG 2.1 AA準拠）

### メンテナンス性（MVP）
- [MVP] コードの可読性
- [MVP] 適切なコメント（日本語）
- [MVP] モジュール化
  - 決済ロジックの分離
  - チェーン対応の抽象化
  - 拡張可能な設計
- [MVP] 基本的なエラーハンドリング
- [拡張] テストカバレッジ: 80%以上
- [拡張] ドキュメント整備

### 拡張性（MVP）
- [MVP] マルチチェーン対応の設計
  - 設定ファイルでチェーン切り替え
  - チェーン固有のロジックを抽象化
- [MVP] ERC-8004統合を見据えた設計
  - 決済ロジックとエージェントロジックの分離
  - プラグイン方式での拡張
- [MVP] 決済方法の追加が容易な設計

---

## スマートコントラクト要件

### MVP: 決済用コントラクト

#### PaymentProcessor.sol（MVP）
```solidity
// シンプルな決済記録コントラクト
contract PaymentProcessor {
    // 決済記録
    struct Payment {
        bytes32 paymentId;
        address payer;
        address payee;
        uint256 amount;
        address token;
        uint256 timestamp;
        string productId;
    }
    
    // 決済記録の保存
    function recordPayment(
        bytes32 paymentId,
        address payee,
        uint256 amount,
        address token,
        string memory productId
    ) external returns (bool);
    
    // 決済状態の確認
    function getPayment(bytes32 paymentId) external view returns (Payment memory);
    
    // ユーザーの決済履歴
    function getUserPayments(address user) external view returns (Payment[] memory);
}
```

#### マルチチェーン対応設計
- 各チェーンに同じコントラクトをデプロイ
- チェーンIDとコントラクトアドレスのマッピングを設定ファイルで管理
- バックエンドで適切なチェーンを選択

### 拡張: ERC-8004 実装（将来）

#### IdentityRegistry.sol（拡張）
```solidity
// エージェントID発行（ERC-721）
function registerAgent(string memory metadataURI) external returns (uint256 agentId);
function updateMetadata(uint256 agentId, string memory metadataURI) external;
function getAgentMetadata(uint256 agentId) external view returns (string memory);
function ownerOf(uint256 agentId) external view returns (address);
```

#### ReputationRegistry.sol（拡張）
```solidity
// 評価システム
function submitReview(uint256 agentId, uint256 score, string[] memory tags, string memory feedbackURI, bytes memory paymentProof) external;
function getAverageScore(uint256 agentId) external view returns (uint256);
function getReviews(uint256 agentId) external view returns (Review[] memory);
```

#### ValidationRegistry.sol（拡張）
```solidity
// 検証システム
function requestValidation(uint256 agentId, bytes memory taskData, ValidationModel model) external payable returns (uint256 requestId);
function submitValidationResult(uint256 requestId, bool isValid, bytes memory proof) external;
function getValidationResult(uint256 requestId) external view returns (ValidationResult memory);
```

---

## API要件（MVP）

### 商品API

#### GET /api/products
商品一覧を取得
```json
// Response
{
  "products": [
    {
      "id": "prod_001",
      "name": "プレミアム記事：AIの未来",
      "description": "最新のAI技術動向を解説",
      "price": 5.00,
      "currency": "USD",
      "type": "article",
      "thumbnail": "https://..."
    }
  ]
}
```

#### GET /api/products/:id
商品詳細を取得
```json
// Response
{
  "id": "prod_001",
  "name": "プレミアム記事：AIの未来",
  "description": "最新のAI技術動向を解説",
  "price": 5.00,
  "currency": "USD",
  "type": "article",
  "thumbnail": "https://...",
  "content": "..." // 購入後のみ表示
}
```

#### POST /api/products（管理者用）
商品を登録
```json
// Request
{
  "name": "プレミアム記事：AIの未来",
  "description": "最新のAI技術動向を解説",
  "price": 5.00,
  "type": "article",
  "content": "..."
}
```

### 決済API

#### POST /api/payments/initiate
決済を開始（HTTP 402レスポンス）
```json
// Request
{
  "productId": "prod_001"
}

// Response (402 Payment Required)
{
  "paymentId": "pay_abc123",
  "amount": 5.00,
  "currency": "USD",
  "productId": "prod_001",
  "productName": "プレミアム記事：AIの未来",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

#### POST /api/payments/authenticate
パスキー認証
```json
// Request
{
  "paymentId": "pay_abc123",
  "passkeyCredential": {...} // WebAuthn credential
}

// Response
{
  "success": true,
  "authToken": "auth_xyz789"
}
```

#### POST /api/payments/process
決済処理（モック）
```json
// Request
{
  "paymentId": "pay_abc123",
  "authToken": "auth_xyz789",
  "paymentMethod": "credit_card" // or "paypay", "apple_pay", etc.
}

// Response
{
  "success": true,
  "message": "決済処理を開始しました"
}
```

#### POST /api/payments/execute
ブロックチェーン決済実行
```json
// Request
{
  "paymentId": "pay_abc123"
}

// Response
{
  "success": true,
  "transactionHash": "0x...",
  "chainId": 43113, // Avalanche Fuji
  "status": "pending"
}
```

#### GET /api/payments/:id
決済状態確認
```json
// Response
{
  "paymentId": "pay_abc123",
  "status": "completed", // pending, processing, completed, failed
  "transactionHash": "0x...",
  "chainId": 43113,
  "confirmedAt": "2024-01-01T12:05:00Z"
}
```

#### GET /api/payments/history
決済履歴取得
```json
// Response
{
  "payments": [
    {
      "paymentId": "pay_abc123",
      "productId": "prod_001",
      "productName": "プレミアム記事：AIの未来",
      "amount": 5.00,
      "currency": "USD",
      "status": "completed",
      "transactionHash": "0x...",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### 認証API

#### POST /api/auth/register
ユーザー登録
```json
// Request
{
  "email": "user@example.com",
  "name": "山田太郎"
}

// Response
{
  "userId": "user_001",
  "email": "user@example.com",
  "name": "山田太郎"
}
```

#### POST /api/auth/login
ログイン
```json
// Request
{
  "email": "user@example.com"
}

// Response
{
  "sessionToken": "session_xyz",
  "userId": "user_001"
}
```

#### POST /api/auth/passkey/register
パスキー登録
```json
// Request
{
  "userId": "user_001",
  "credential": {...} // WebAuthn registration credential
}

// Response
{
  "success": true,
  "credentialId": "cred_001"
}
```

#### POST /api/auth/passkey/authenticate
パスキー認証
```json
// Request
{
  "userId": "user_001",
  "credential": {...} // WebAuthn authentication credential
}

// Response
{
  "success": true,
  "authToken": "auth_xyz789"
}
```

---

## 拡張API要件（将来）

### エージェントAPI（拡張）

#### POST /api/agents
エージェントを登録

#### GET /api/agents
エージェント一覧を取得

#### GET /api/agents/:id
エージェント詳細を取得

### 評価API（拡張）

#### POST /api/reviews
評価を投稿

#### GET /api/reviews/:agentId
エージェントの評価を取得

---

## テスト要件

### MVP テスト
- [MVP] 手動テスト
  - 商品一覧表示
  - 商品購入フロー（エンドツーエンド）
  - パスキー認証
  - 決済処理（モック）
  - ブロックチェーン決済
  - 決済履歴表示
- [MVP] 基本的なユニットテスト
  - 決済ロジック
  - パスキー認証ロジック
  - ブロックチェーン接続
- [MVP] スマートコントラクトのテスト
  - Hardhat/Foundryでのテスト
  - 基本的な機能確認

### 拡張テスト
- [拡張] 包括的なユニットテスト（カバレッジ80%以上）
- [拡張] 統合テスト
- [拡張] E2Eテスト（Playwright/Cypress）
- [拡張] セキュリティテスト
- [拡張] パフォーマンステスト

---

## デプロイメント要件

### MVP デプロイ
- [MVP] Avalanche Fuji テストネット
  - スマートコントラクトデプロイ
  - テストトークン（USDC等）の取得
  - コントラクトアドレスの設定
- [MVP] フロントエンド・バックエンド
  - Vercel / Railwayへのデプロイ
  - 環境変数の設定
  - データベースのセットアップ
- [MVP] 動作確認
  - エンドツーエンドの決済フロー確認
  - トランザクション確認

### 拡張デプロイ
- [拡張] 複数チェーンへのデプロイ
  - Base テストネット
  - その他EVMチェーン
- [拡張] メインネットデプロイ
  - Avalanche C-Chain
  - Base メインネット
  - コントラクト検証（Snowtrace/Basescan）

---

## ドキュメント要件

### MVP ドキュメント
- [MVP] README.md
  - プロジェクト概要
  - セットアップ手順
  - 実行方法
  - デモ手順
- [MVP] アーキテクチャ図
  - システム構成図
  - 決済フロー図
- [MVP] API仕様（簡易版）
  - 主要エンドポイント
  - リクエスト/レスポンス例
- [MVP] デモ用スクリプト
  - デモシナリオ
  - 操作手順

### 拡張ドキュメント
- [拡張] 包括的なAPI仕様書（OpenAPI/Swagger）
- [拡張] スマートコントラクト仕様書
- [拡張] ユーザーガイド
- [拡張] 開発者ドキュメント

---

## 実装計画（MVP）

### フェーズ1: 基盤構築
- [ ] プロジェクト環境構築
  - Next.js プロジェクト作成
  - Hardhat/Foundry セットアップ
  - データベースセットアップ
- [ ] スマートコントラクト実装
  - PaymentProcessor.sol 実装
  - テストネットデプロイ
  - 基本的なテスト
- [ ] マルチチェーン対応の設計
  - 設定ファイル構造
  - チェーン抽象化レイヤー

### フェーズ2: 認証・決済基盤
- [ ] パスキー認証実装
  - WebAuthn統合
  - 登録フロー
  - 認証フロー
- [ ] 決済モック実装
  - 決済方法選択UI
  - モック処理ロジック
- [ ] ブロックチェーン決済実装
  - システムウォレット管理
  - トランザクション実行
  - 確認処理

### フェーズ3: 商品・決済フロー
- [ ] 商品管理機能
  - 商品マスタ
  - 商品一覧・詳細画面
- [ ] x402決済フロー実装
  - HTTP 402レスポンス
  - 決済状態管理
  - 決済完了処理
- [ ] 決済UI実装
  - 決済方法選択画面
  - パスキー認証画面
  - 決済処理中・完了画面

### フェーズ4: 統合・テスト
- [ ] エンドツーエンドテスト
  - 商品購入フロー確認
  - ブロックチェーン決済確認
- [ ] UI/UX改善
  - エラーハンドリング
  - ローディング表示
  - レスポンシブ対応
- [ ] デプロイ
  - テストネットデプロイ
  - 本番環境デプロイ

### フェーズ5: デモ準備
- [ ] デモシナリオ作成
- [ ] デモ用データ準備
- [ ] ドキュメント作成
- [ ] プレゼンテーション準備

---

## リスク管理

### 技術的リスク（MVP）
| リスク | 影響度 | 対策 |
|--------|--------|------|
| パスキー認証の実装難易度 | 中 | WebAuthnライブラリ活用、シンプルな実装 |
| ブロックチェーン接続の不安定性 | 中 | リトライ処理、エラーハンドリング充実 |
| テストネットの不具合 | 低 | 複数のRPCエンドポイント準備 |
| x402実装の複雑さ | 中 | シンプルな実装から開始、段階的に拡張 |

### スコープリスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| 機能過多による遅延 | 高 | MVP機能に絞り込み済み、ERC-8004は後回し |
| 拡張性の考慮不足 | 中 | 設計段階で拡張性を確保 |

### デモリスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| デモ環境の不具合 | 高 | 事前テスト徹底、バックアッププラン準備 |
| ネットワーク遅延 | 中 | ローカル環境でのデモも準備 |

---

## 成功基準

### MVP成功基準
- [MVP] エンドツーエンドの決済フローが動作する
  - 商品選択 → 決済 → パスキー認証 → ブロックチェーン決済 → 完了
- [MVP] パスキー認証が正常に機能する
- [MVP] ブロックチェーン決済が正常に実行される（Avalanche Fuji）
- [MVP] エンドユーザーがブロックチェーンを意識しない体験
- [MVP] マルチチェーン対応の設計が実装されている
- [MVP] デモが成功する

### ハッカソン評価基準
- [ ] **イノベーション**: 
  - x402プロトコルの実用的な実装
  - エンドユーザーにブロックチェーンを意識させないUX
  - 将来のAIエージェント統合を見据えた設計
- [ ] **技術的卓越性**: 
  - パスキー認証の実装
  - マルチチェーン対応の設計
  - 拡張可能なアーキテクチャ
- [ ] **ユーザーエクスペリエンス**: 
  - 直感的で使いやすいUI
  - スムーズな決済フロー
  - わかりやすいエラーメッセージ
- [ ] **実世界へのインパクト**: 
  - 実用的な決済プラットフォーム
  - 汎用性の高いAPI設計
  - 将来的なAIエージェント統合の可能性

### 拡張成功基準（将来）
- [拡張] ERC-8004統合完了
- [拡張] AIエージェントによる自動決済
- [拡張] 複数チェーンでの実運用
- [拡張] 実際の決済サービス統合

---

## 付録

### 参考資料
- x402プロトコル仕様: `research/x402.md`
- ERC-8004標準: `research/ERC-8004.md`
- ハッカソンルール: `research/hack-rules.md`

### 用語集
- **x402**: HTTP 402 Payment Requiredを活用した決済プロトコル
- **ERC-8004**: AIエージェントのアイデンティティ、評判、検証を管理する標準
- **パスキー**: WebAuthnを使用したパスワードレス認証
- **システムウォレット**: エンドユーザーの代わりに決済を実行するサービス側のウォレット
- **MVP**: Minimum Viable Product（最小実行可能製品）

### 設計原則
1. **シンプルさ優先**: MVPは最小限の機能に絞る
2. **拡張性の確保**: 将来の機能追加を見据えた設計
3. **ユーザー体験重視**: 技術を隠蔽し、直感的なUIを提供
4. **汎用性**: 誰でも使えるAPIを目指す
5. **段階的開発**: 動くものを作ってから拡張する
