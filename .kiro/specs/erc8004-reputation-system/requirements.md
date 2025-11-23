# ERC-8004 Reputation Registry 拡張要件定義書

## プロジェクト概要

### 機能名
支払い証明連携レビューシステム（ERC-8004 Reputation Registry統合）

### 目的
x402決済プラットフォームにERC-8004のReputation Registryを統合し、支払い証明を必須とした信頼性の高いレビューシステムを構築する。これにより、Sybil攻撃に耐性のある評価システムを実現し、AIエージェント経済への橋渡しを行う。

### コアコンセプト
1. **支払いなしではレビュー不可**: x402決済完了を証明としたレビュー投稿
2. **オンチェーン評価記録**: 改ざん不可能な評価履歴の永続化
3. **Sybil攻撃耐性**: 実際に決済した人のみがレビュー可能
4. **段階的拡張**: 商品レビューから始め、将来的にエージェント評価へ拡張

### 対象ブロックチェーン
- **初期実装**: Avalanche Fuji Testnet（既存MVPと同一）
- **将来拡張**: マルチチェーン対応

---

## ターゲットユーザー

### 主要ユーザー

**レビュー投稿者（購入者）**
- x402決済で商品を購入したユーザー
- 購入体験を評価したい人
- 支払い証明を持っている人のみ

**レビュー閲覧者（潜在購入者）**
- 商品購入を検討しているユーザー
- 信頼できる評価を参考にしたい人
- 過去の購入者の声を確認したい人

**商品提供者（サービスプロバイダー）**
- 自身の商品の評価を確認したい人
- 評価を基にサービス改善したい人

### 将来的なユーザー（拡張フェーズ）
- AIエージェント（評価対象として）
- AIエージェント利用者（エージェント選定のため）
- 検証者（バリデーター）

---

## システムフロー

### レビュー投稿フロー
```
[ユーザー]
    ↓ 商品購入（x402決済完了）
[決済システム]
    ↓ 決済完了 + トランザクションハッシュ発行
[ユーザー]
    ↓ レビュー投稿リクエスト（txHash含む）
[バックエンド]
    ↓ 支払い証明検証（オンチェーン確認）
[検証成功]
    ↓ レビューデータ作成
[Reputation Registry（スマートコントラクト）]
    ↓ レビューをオンチェーンに記録
[完了]
    ↓ レビュー投稿成功
```

### レビュー閲覧フロー
```
[ユーザー]
    ↓ 商品詳細ページアクセス
[フロントエンド]
    ↓ GET /api/reviews/:productId
[バックエンド]
    ↓ Reputation Registryからレビュー取得
[オンチェーンデータ]
    ↓ レビュー一覧
[フロントエンド]
    ↓ 平均スコア、レビュー一覧表示
[ユーザー]
```

---

## 技術スタック（追加分）

### スマートコントラクト
- **ReputationRegistry.sol**: ERC-8004準拠の評価記録コントラクト
- **インターフェース**: IReputationRegistry（ERC-8004標準）

### バックエンド（追加）
- **評価サービス**: `src/lib/reputation.ts`
- **支払い証明検証**: 既存blockchain.tsを拡張
- **オフチェーンメタデータ**: IPFS（詳細フィードバック用）

### データベース（追加テーブル）
- **Review**: オフチェーンキャッシュ
- **ReviewTag**: タグマスタ

---

## 機能要件

### 優先度の定義
- **[Phase1]**: 最小実行可能機能（オフチェーンのみ）
- **[Phase2]**: オンチェーン統合
- **[Phase3]**: 高度な機能（将来拡張）

---

## Phase1: オフチェーンレビュー基盤

### 1. レビュー投稿機能

#### 1.1 支払い証明検証
- [Phase1] 決済完了済みか確認（DBベース）
- [Phase1] 同一商品への重複レビュー防止
- [Phase1] レビュー投稿可能期間の設定（決済後30日以内）

#### 1.2 レビューデータ
- [Phase1] 評価スコア（1-5の星評価）
- [Phase1] テキストコメント（500文字以内）
- [Phase1] タグ選択（複数選択可）
  - 「高品質」「コスパ良し」「期待以上」「期待以下」等
- [Phase1] 投稿日時
- [Phase1] 購入者ID（匿名化オプションあり）

#### 1.3 レビュー投稿UI
- [Phase1] 購入履歴ページからのレビュー投稿導線
- [Phase1] 星評価入力
- [Phase1] コメント入力
- [Phase1] タグ選択UI
- [Phase1] 投稿確認画面

### 2. レビュー表示機能

#### 2.1 商品詳細ページ
- [Phase1] 平均評価スコア表示
- [Phase1] レビュー総数表示
- [Phase1] レビュー一覧（新着順、評価順でソート可）
- [Phase1] タグ別フィルター

#### 2.2 レビュー詳細
- [Phase1] 評価スコア（星表示）
- [Phase1] コメント本文
- [Phase1] 付与されたタグ
- [Phase1] 投稿日時
- [Phase1] 購入証明バッジ（「購入者レビュー」マーク）

### 3. バックエンドAPI

#### 3.1 レビューAPI
- [Phase1] `POST /api/reviews` - レビュー投稿
- [Phase1] `GET /api/reviews/:productId` - 商品のレビュー一覧取得
- [Phase1] `GET /api/reviews/stats/:productId` - 評価統計取得
- [Phase1] `GET /api/reviews/my` - 自分の投稿レビュー一覧

### 4. データベーススキーマ

#### 4.1 Reviewテーブル
```prisma
model Review {
  id            String   @id @default(cuid())
  userId        String
  productId     String
  paymentId     String   @unique  // 1決済につき1レビュー
  score         Int      // 1-5
  comment       String?
  isAnonymous   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // オンチェーン連携用（Phase2）
  txHash        String?  // オンチェーン記録時のtxHash
  onChainId     String?  // オンチェーンのレビューID

  user          User     @relation(fields: [userId], references: [id])
  product       Product  @relation(fields: [productId], references: [id])
  payment       Payment  @relation(fields: [paymentId], references: [id])
  tags          ReviewTag[]
}

model ReviewTag {
  id        String   @id @default(cuid())
  name      String   @unique
  reviews   Review[]
}
```

---

## Phase2: オンチェーン統合（ERC-8004 Reputation Registry）

### 1. スマートコントラクト

#### 1.1 ReputationRegistry.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ReputationRegistry - ERC-8004 準拠の評価レジストリ
/// @notice 支払い証明を必須とした商品/エージェント評価システム
contract ReputationRegistry {

    struct Review {
        uint256 id;
        address reviewer;       // レビュー投稿者
        bytes32 targetId;       // 評価対象（商品ID or エージェントID）
        uint8 score;            // 0-100 (ERC-8004準拠)
        string[] tags;          // タグ配列
        string feedbackURI;     // 詳細フィードバック（IPFS URI）
        bytes32 paymentProof;   // 支払い証明（決済txHash）
        uint256 timestamp;
    }

    // イベント
    event ReviewSubmitted(
        uint256 indexed reviewId,
        address indexed reviewer,
        bytes32 indexed targetId,
        uint8 score,
        bytes32 paymentProof
    );

    // レビュー投稿（支払い証明必須）
    function submitReview(
        bytes32 targetId,
        uint8 score,
        string[] memory tags,
        string memory feedbackURI,
        bytes32 paymentProof
    ) external returns (uint256 reviewId);

    // 平均スコア取得
    function getAverageScore(bytes32 targetId) external view returns (uint256);

    // レビュー一覧取得
    function getReviews(bytes32 targetId) external view returns (Review[] memory);

    // レビュー総数取得
    function getReviewCount(bytes32 targetId) external view returns (uint256);

    // 支払い証明の検証（PaymentProcessorと連携）
    function verifyPaymentProof(bytes32 paymentProof) external view returns (bool);
}
```

#### 1.2 インターフェース（IReputationRegistry.sol）
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationRegistry {
    function submitReview(
        bytes32 targetId,
        uint8 score,
        string[] memory tags,
        string memory feedbackURI,
        bytes32 paymentProof
    ) external returns (uint256 reviewId);

    function getAverageScore(bytes32 targetId) external view returns (uint256);
    function getReviews(bytes32 targetId) external view returns (Review[] memory);
    function getReviewCount(bytes32 targetId) external view returns (uint256);
}
```

### 2. バックエンド連携

#### 2.1 オンチェーン記録サービス
- [Phase2] レビュー投稿時にオンチェーンへ記録
- [Phase2] 支払い証明（txHash）の検証
- [Phase2] オフチェーンDBとオンチェーンの同期
- [Phase2] IPFS への詳細フィードバック保存

#### 2.2 API拡張
- [Phase2] `POST /api/reviews` - オンチェーン記録オプション追加
- [Phase2] `GET /api/reviews/:productId/onchain` - オンチェーンレビュー取得

### 3. フロントエンド拡張

#### 3.1 オンチェーン証明表示
- [Phase2] 「オンチェーン記録済み」バッジ
- [Phase2] トランザクションハッシュへのリンク
- [Phase2] ブロックエクスプローラー連携

---

## Phase3: 高度な機能（将来拡張）

### 1. エージェント評価への拡張
- [Phase3] Identity Registry（ERC-721）との連携
- [Phase3] エージェントへのレビュー投稿
- [Phase3] エージェント評価ダッシュボード

### 2. 評価の重み付け
- [Phase3] 購入金額に応じた評価重み
- [Phase3] 過去のレビュー履歴による信頼度
- [Phase3] 長期利用者への重み付け

### 3. インセンティブシステム
- [Phase3] レビュー投稿報酬（トークン）
- [Phase3] 有用なレビューへの投票
- [Phase3] レビュアーランキング

### 4. Sybil攻撃対策強化
- [Phase3] 最低購入金額の設定
- [Phase3] 購入から一定期間経過後のレビュー許可
- [Phase3] 異常パターン検出

---

## API仕様

### レビューAPI

#### POST /api/reviews
レビューを投稿
```json
// Request
{
  "productId": "prod_001",
  "paymentId": "pay_abc123",
  "score": 4,
  "comment": "期待以上の内容でした。AIの最新動向がわかりやすく解説されています。",
  "tags": ["高品質", "コスパ良し"],
  "isAnonymous": false,
  "recordOnChain": false  // Phase2: オンチェーン記録オプション
}

// Response (201 Created)
{
  "id": "rev_xyz789",
  "productId": "prod_001",
  "score": 4,
  "comment": "期待以上の内容でした。AIの最新動向がわかりやすく解説されています。",
  "tags": ["高品質", "コスパ良し"],
  "isAnonymous": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "purchaseVerified": true,
  "onChain": {
    "recorded": false,
    "txHash": null
  }
}

// Error Response (403 Forbidden - 購入証明なし)
{
  "error": "PAYMENT_NOT_FOUND",
  "message": "この商品の購入記録が見つかりません"
}

// Error Response (409 Conflict - 重複レビュー)
{
  "error": "REVIEW_ALREADY_EXISTS",
  "message": "この商品へのレビューは既に投稿済みです"
}
```

#### GET /api/reviews/:productId
商品のレビュー一覧を取得
```json
// Query Parameters
// - sort: "newest" | "oldest" | "highest" | "lowest" (default: "newest")
// - tag: タグでフィルター（複数可）
// - limit: 取得件数 (default: 10, max: 50)
// - offset: オフセット (default: 0)

// Response
{
  "reviews": [
    {
      "id": "rev_xyz789",
      "score": 4,
      "comment": "期待以上の内容でした。",
      "tags": ["高品質", "コスパ良し"],
      "reviewer": {
        "id": "user_001",
        "name": "山田太郎",
        "isAnonymous": false
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "purchaseVerified": true,
      "onChain": {
        "recorded": true,
        "txHash": "0x..."
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/reviews/stats/:productId
商品の評価統計を取得
```json
// Response
{
  "productId": "prod_001",
  "averageScore": 4.2,
  "totalReviews": 25,
  "scoreDistribution": {
    "5": 10,
    "4": 8,
    "3": 5,
    "2": 1,
    "1": 1
  },
  "topTags": [
    { "name": "高品質", "count": 15 },
    { "name": "コスパ良し", "count": 12 },
    { "name": "期待以上", "count": 8 }
  ]
}
```

#### GET /api/reviews/my
自分の投稿レビュー一覧を取得
```json
// Response
{
  "reviews": [
    {
      "id": "rev_xyz789",
      "product": {
        "id": "prod_001",
        "name": "プレミアム記事：AIの未来",
        "thumbnail": "https://..."
      },
      "score": 4,
      "comment": "期待以上の内容でした。",
      "tags": ["高品質", "コスパ良し"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 非機能要件

### セキュリティ
- [Phase1] 支払い証明の厳格な検証
- [Phase1] レビュー内容のサニタイズ（XSS対策）
- [Phase1] レート制限（1ユーザー1日10件まで）
- [Phase2] オンチェーン記録の改ざん不可能性
- [Phase3] Sybil攻撃検出アルゴリズム

### パフォーマンス
- [Phase1] レビュー一覧取得: 500ms以内
- [Phase1] 評価統計取得: 200ms以内
- [Phase2] オンチェーン記録: 30秒以内（トランザクション確認含む）

### ユーザビリティ
- [Phase1] 直感的な星評価UI
- [Phase1] タグ選択のワンタップ操作
- [Phase1] レビュー投稿完了のフィードバック
- [Phase2] オンチェーン記録状態の可視化

### データ整合性
- [Phase1] オフチェーンDBでのACID保証
- [Phase2] オフチェーン⇔オンチェーンの整合性チェック
- [Phase2] 障害時のリカバリ機構

---

## 実装計画

### Phase1: オフチェーン基盤（1週間目安）
- [ ] データベーススキーマ追加（Review, ReviewTag）
- [ ] レビューサービス実装（`src/lib/reputation.ts`）
- [ ] レビューAPI実装
- [ ] レビュー投稿UI
- [ ] レビュー表示UI（商品詳細ページ）
- [ ] 購入履歴からのレビュー導線

### Phase2: オンチェーン統合（2週間目安）
- [ ] ReputationRegistry.sol実装
- [ ] コントラクトテスト
- [ ] テストネットデプロイ
- [ ] バックエンドからのコントラクト連携
- [ ] IPFS連携（詳細フィードバック）
- [ ] オンチェーン記録UI

### Phase3: 高度な機能（将来）
- [ ] エージェント評価への拡張
- [ ] インセンティブシステム
- [ ] Sybil攻撃対策強化

---

## リスク管理

### 技術的リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| オンチェーン記録のガスコスト | 中 | バッチ処理、オフチェーン優先オプション |
| IPFS可用性 | 低 | 複数ゲートウェイ、フォールバック |
| 支払い証明の偽装 | 高 | オンチェーン検証、PaymentProcessorとの連携 |

### 運用リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| スパムレビュー | 中 | レート制限、支払い証明必須 |
| 不適切なコンテンツ | 中 | モデレーション機能（将来） |
| データ整合性 | 高 | 定期的な整合性チェック、監視 |

---

## 成功基準

### Phase1 成功基準
- [ ] 購入者のみがレビュー投稿できる
- [ ] 商品詳細ページで平均評価が表示される
- [ ] レビュー一覧が正常に表示される
- [ ] 重複レビューが防止される

### Phase2 成功基準
- [ ] レビューがオンチェーンに記録される
- [ ] オンチェーン記録のトランザクションが確認できる
- [ ] 支払い証明がオンチェーンで検証される

### 将来の成功基準
- [ ] エージェント評価システムへの拡張
- [ ] Sybil攻撃耐性の実証
- [ ] エコシステム全体での評価活用

---

## 参考資料

- ERC-8004標準: `research/ERC-8004.md`
- x402プロトコル仕様: `research/x402.md`
- 既存MVP要件: `.kiro/specs/x402-payment-platform/requirements.md`

---

## 用語集

- **Reputation Registry**: ERC-8004で定義された評価記録レジストリ
- **支払い証明（Payment Proof）**: x402決済のトランザクションハッシュ
- **Sybil攻撃**: 偽のアイデンティティを大量作成して評価を操作する攻撃
- **オンチェーン**: ブロックチェーン上に記録されたデータ
- **オフチェーン**: ブロックチェーン外（通常のDB等）に記録されたデータ
