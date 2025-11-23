# ERC-8004 Reputation Registry 設計書

## Overview

本設計書は、x402決済プラットフォームにERC-8004 Reputation Registryを統合し、支払い証明を必須とした信頼性の高いレビューシステムの実装を定義します。

### 設計目標

1. **Sybil攻撃耐性**: x402決済の支払い証明を必須とし、偽レビューを防止
2. **段階的オンチェーン化**: Phase1はオフチェーン、Phase2でオンチェーン統合
3. **既存システムとの統合**: x402決済プラットフォームの既存アーキテクチャを活用
4. **将来拡張性**: AIエージェント評価システムへの拡張を見据えた設計

### 技術スタック（追加分）

- **スマートコントラクト**: Solidity ^0.8.20, ReputationRegistry.sol
- **オフチェーンストレージ**: IPFS（詳細フィードバック用）
- **データベース**: 既存SQLite + Prismaに追加テーブル
- **バリデーション**: Zod（レビューデータ検証）

---

## Architecture

### システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Product Page │  │ Review Form  │  │  My Reviews  │          │
│  │ + Reviews    │  │    Modal     │  │    Page      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┼─────────────────────────────────────┐
│                    Backend API Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Review API   │  │ Stats API    │  │ Existing APIs│          │
│  │  (新規)      │  │  (新規)      │  │ (Payment等)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐         │
│  │           Business Logic Layer                      │         │
│  │  ┌──────────────┐  ┌──────────────┐               │         │
│  │  │  Reputation  │  │   Payment    │               │         │
│  │  │   Service    │  │   Service    │               │         │
│  │  │   (新規)     │  │   (既存)     │               │         │
│  │  └──────────────┘  └──────────────┘               │         │
│  └─────────────────────────┬──────────────────────────┘         │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                   Data & External Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SQLite     │  │ Reputation   │  │    IPFS      │          │
│  │ + Review TBL │  │  Registry    │  │  (Phase2)    │          │
│  │   (既存拡張)  │  │ (Phase2)    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                     │
│                    ┌───────┴────────┐                            │
│                    │                │                            │
│            ┌───────▼──────┐  ┌─────▼──────┐                     │
│            │  Avalanche   │  │   Base     │                     │
│            │ Fuji Testnet │  │  (Future)  │                     │
│            └──────────────┘  └────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### レビュー投稿フロー

```
[User] 購入完了後、レビュー投稿ボタンクリック
   │
   ▼
[Frontend] レビューフォーム表示
   │        - 星評価選択
   │        - コメント入力
   │        - タグ選択
   │
   ▼
[User] レビュー内容入力 → 送信
   │
   ▼
[Frontend] POST /api/reviews
   │        - productId
   │        - paymentId
   │        - score, comment, tags
   │
   ▼
[Backend] ReputationService.submitReview()
   │
   ├─► [検証1] 支払い証明確認
   │   └─► PaymentServiceで決済完了を確認
   │
   ├─► [検証2] 重複チェック
   │   └─► 同一paymentIdでのレビュー存在確認
   │
   ├─► [検証3] 投稿期限チェック
   │   └─► 決済後30日以内か確認
   │
   ▼
[Phase1] Reviewテーブルに保存
   │
   ▼ (Phase2のみ)
[Phase2] ReputationRegistry.submitReview()
   │      - オンチェーン記録
   │      - IPFS保存（詳細フィードバック）
   │
   ▼
[Frontend] 完了画面表示
```

### レビュー取得フロー

```
[User] 商品詳細ページアクセス
   │
   ▼
[Frontend] GET /api/reviews/stats/:productId
   │        GET /api/reviews/:productId
   │
   ▼
[Backend] ReputationService.getReviewStats()
   │        ReputationService.getReviews()
   │
   ▼
[Phase1] SQLiteから取得
   │
   ▼ (Phase2ではオンチェーンデータと照合)
[Phase2] ReputationRegistry.getReviews()
   │
   ▼
[Frontend] 平均スコア + レビュー一覧表示
```

---

## Components and Interfaces

### Frontend Components

#### 1. Review Components
- `ReviewForm`: レビュー投稿フォーム（モーダル）
- `StarRating`: 星評価入力/表示コンポーネント
- `TagSelector`: タグ選択コンポーネント
- `ReviewList`: レビュー一覧表示
- `ReviewCard`: 個別レビュー表示
- `ReviewStats`: 評価統計表示（平均スコア、分布）

#### 2. Integration Points
- `ProductDetail`: 既存コンポーネントにレビュー表示を追加
- `PurchaseHistory`: 購入履歴からレビュー投稿導線を追加
- `MyReviews`: 自分の投稿レビュー一覧ページ

### Backend Services

#### 1. ReputationService
```typescript
interface ReputationService {
  // レビュー投稿
  submitReview(data: SubmitReviewDto): Promise<Review>;

  // 商品のレビュー一覧取得
  getReviews(productId: string, options?: ReviewQueryOptions): Promise<ReviewListResponse>;

  // 商品の評価統計取得
  getReviewStats(productId: string): Promise<ReviewStats>;

  // 自分のレビュー一覧取得
  getMyReviews(userId: string): Promise<Review[]>;

  // レビュー投稿可否チェック
  canSubmitReview(userId: string, paymentId: string): Promise<ReviewEligibility>;

  // 支払い証明検証
  verifyPaymentProof(paymentId: string, userId: string): Promise<boolean>;
}

interface SubmitReviewDto {
  productId: string;
  paymentId: string;
  score: number;        // 1-5
  comment?: string;
  tags: string[];
  isAnonymous: boolean;
  recordOnChain?: boolean;  // Phase2
}

interface ReviewQueryOptions {
  sort: 'newest' | 'oldest' | 'highest' | 'lowest';
  tags?: string[];
  limit: number;
  offset: number;
}

interface ReviewStats {
  productId: string;
  averageScore: number;
  totalReviews: number;
  scoreDistribution: Record<number, number>;  // {1: 5, 2: 3, 3: 10, ...}
  topTags: Array<{ name: string; count: number }>;
}

interface ReviewEligibility {
  canSubmit: boolean;
  reason?: 'already_reviewed' | 'payment_not_found' | 'expired' | 'payment_not_completed';
  expiresAt?: Date;
}
```

#### 2. BlockchainService Extensions (Phase2)
```typescript
interface ReputationBlockchainService {
  // オンチェーンレビュー投稿
  submitReviewOnChain(
    targetId: string,
    score: number,
    tags: string[],
    feedbackURI: string,
    paymentProof: string
  ): Promise<TransactionResult>;

  // オンチェーンレビュー取得
  getReviewsOnChain(targetId: string): Promise<OnChainReview[]>;

  // オンチェーン平均スコア取得
  getAverageScoreOnChain(targetId: string): Promise<number>;
}
```

### API Endpoints

#### Review API
- `POST /api/reviews` - レビュー投稿
- `GET /api/reviews/:productId` - 商品のレビュー一覧取得
- `GET /api/reviews/stats/:productId` - 評価統計取得
- `GET /api/reviews/my` - 自分のレビュー一覧取得
- `GET /api/reviews/eligibility/:paymentId` - レビュー投稿可否確認

---

## Data Models

### Database Schema (Prisma)

#### Review Table
```prisma
model Review {
  id            String   @id @default(cuid())
  userId        String
  productId     String
  paymentId     String   @unique
  score         Int      // 1-5
  comment       String?
  isAnonymous   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // オンチェーン連携用（Phase2）
  txHash        String?
  onChainId     String?
  feedbackURI   String?  // IPFS URI

  user          User     @relation(fields: [userId], references: [id])
  product       Product  @relation(fields: [productId], references: [id])
  payment       Payment  @relation(fields: [paymentId], references: [id])
  tags          ReviewTagRelation[]
}

model ReviewTag {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  reviews   ReviewTagRelation[]
}

model ReviewTagRelation {
  reviewId  String
  tagId     String
  review    Review    @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  tag       ReviewTag @relation(fields: [tagId], references: [id])

  @@id([reviewId, tagId])
}
```

### TypeScript Types

```typescript
// レビュー
interface Review {
  id: string;
  userId: string;
  productId: string;
  paymentId: string;
  score: number;
  comment?: string;
  tags: string[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Phase2
  txHash?: string;
  onChainId?: string;
  feedbackURI?: string;
}

// レビュー一覧レスポンス
interface ReviewListResponse {
  reviews: ReviewWithReviewer[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// レビュー（投稿者情報付き）
interface ReviewWithReviewer {
  id: string;
  score: number;
  comment?: string;
  tags: string[];
  reviewer: {
    id: string;
    name: string;
    isAnonymous: boolean;
  };
  createdAt: Date;
  purchaseVerified: boolean;
  onChain?: {
    recorded: boolean;
    txHash?: string;
  };
}

// 評価統計
interface ReviewStats {
  productId: string;
  averageScore: number;
  totalReviews: number;
  scoreDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  topTags: Array<{
    name: string;
    count: number;
  }>;
}
```

### Smart Contract Interface (Phase2)

#### ReputationRegistry.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationRegistry {
    struct Review {
        uint256 id;
        address reviewer;
        bytes32 targetId;
        uint8 score;           // 0-100 (ERC-8004準拠)
        string[] tags;
        string feedbackURI;
        bytes32 paymentProof;
        uint256 timestamp;
    }

    event ReviewSubmitted(
        uint256 indexed reviewId,
        address indexed reviewer,
        bytes32 indexed targetId,
        uint8 score,
        bytes32 paymentProof
    );

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

    function getReviewById(uint256 reviewId) external view returns (Review memory);

    function hasReviewed(address reviewer, bytes32 paymentProof) external view returns (bool);
}
```

---

## Correctness Properties

### Property 1: Payment proof required for review
*For any* review submission attempt, if the payment is not completed or does not exist, the submission should be rejected with an appropriate error.
**Validates: Requirements Phase1.1.1**

### Property 2: Duplicate review prevention
*For any* paymentId, only one review should be allowed. Attempting to submit a second review for the same payment should fail.
**Validates: Requirements Phase1.1.1**

### Property 3: Review expiration enforcement
*For any* review submission attempt, if the payment was completed more than 30 days ago, the submission should be rejected.
**Validates: Requirements Phase1.1.1**

### Property 4: Score range validation
*For any* review submission, the score must be between 1 and 5 (inclusive). Scores outside this range should be rejected.
**Validates: Requirements Phase1.1.2**

### Property 5: Comment length validation
*For any* review submission with a comment, the comment length must not exceed 500 characters.
**Validates: Requirements Phase1.1.2**

### Property 6: Review retrieval completeness
*For any* product with reviews, retrieving reviews should return all submitted reviews with complete information (score, comment, tags, reviewer info, timestamp).
**Validates: Requirements Phase1.2**

### Property 7: Average score calculation correctness
*For any* product with N reviews, the average score should equal the sum of all scores divided by N.
**Validates: Requirements Phase1.2.1**

### Property 8: Score distribution correctness
*For any* product with reviews, the sum of all score distribution values should equal the total review count.
**Validates: Requirements Phase1.2.1**

### Property 9: Tag filtering correctness
*For any* tag filter applied to review retrieval, all returned reviews should contain the specified tag.
**Validates: Requirements Phase1.2.1**

### Property 10: Review sorting correctness
*For any* sort option (newest, oldest, highest, lowest), the returned reviews should be correctly ordered by the specified criterion.
**Validates: Requirements Phase1.2.1**

### Property 11: Anonymous review privacy
*For any* review marked as anonymous, the reviewer's name should not be revealed in the response (only "匿名" or similar should be shown).
**Validates: Requirements Phase1.1.2**

### Property 12: Purchase verified badge accuracy
*For any* review, the purchaseVerified flag should only be true if a valid payment proof exists.
**Validates: Requirements Phase1.2.2**

### Property 13: My reviews isolation
*For any* user, GET /api/reviews/my should return only that user's reviews and no other users' reviews.
**Validates: Requirements Phase1.3**

### Property 14: On-chain record consistency (Phase2)
*For any* review recorded on-chain, the on-chain data should match the off-chain database record.
**Validates: Requirements Phase2.2.2**

### Property 15: Payment proof on-chain verification (Phase2)
*For any* on-chain review submission, the payment proof (txHash) should be verifiable against the PaymentProcessor contract.
**Validates: Requirements Phase2.2.1**

---

## Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)
```typescript
interface ReviewValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  fields?: {
    score?: string;
    comment?: string;
    tags?: string;
  };
}
```

#### 2. Payment Verification Errors (403 Forbidden)
```typescript
interface PaymentVerificationError {
  code: 'PAYMENT_NOT_FOUND' | 'PAYMENT_NOT_COMPLETED' | 'REVIEW_EXPIRED';
  message: string;
  paymentId?: string;
  expiresAt?: string;
}
```

#### 3. Duplicate Review Error (409 Conflict)
```typescript
interface DuplicateReviewError {
  code: 'REVIEW_ALREADY_EXISTS';
  message: string;
  existingReviewId: string;
}
```

#### 4. Not Found Errors (404 Not Found)
```typescript
interface NotFoundError {
  code: 'PRODUCT_NOT_FOUND' | 'REVIEW_NOT_FOUND';
  message: string;
  id: string;
}
```

#### 5. Blockchain Errors (Phase2)
```typescript
interface BlockchainReviewError {
  code: 'ONCHAIN_SUBMIT_FAILED' | 'IPFS_UPLOAD_FAILED';
  message: string;
  txHash?: string;
  reason?: string;
}
```

### Error Messages (Japanese)

| Error Code | Message |
|------------|---------|
| PAYMENT_NOT_FOUND | この商品の購入記録が見つかりません |
| PAYMENT_NOT_COMPLETED | 決済が完了していません |
| REVIEW_EXPIRED | レビュー投稿期限（購入後30日）を過ぎています |
| REVIEW_ALREADY_EXISTS | この商品へのレビューは既に投稿済みです |
| VALIDATION_ERROR | 入力内容に誤りがあります |
| PRODUCT_NOT_FOUND | 商品が見つかりません |
| ONCHAIN_SUBMIT_FAILED | オンチェーン記録に失敗しました |

---

## Testing Strategy

### Unit Testing

#### Testing Framework
- **Framework**: Vitest
- **Mocking**: Vitest mocking utilities

#### Unit Test Coverage
1. **ReputationService Tests**
   - レビュー投稿ロジック
   - 支払い証明検証
   - 重複チェック
   - 期限チェック
   - 統計計算

2. **API Route Tests**
   - 各エンドポイントのリクエスト/レスポンス
   - エラーハンドリング
   - 認証チェック

### Property-Based Testing

#### Property Test Implementation
```typescript
import { test } from 'vitest';
import * as fc from 'fast-check';

// **Feature: erc8004-reputation-system, Property 4: Score range validation**
test('Score range validation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: -100, max: 100 }),
      async (score) => {
        if (score >= 1 && score <= 5) {
          // Should succeed
          const result = await reputationService.validateScore(score);
          expect(result.valid).toBe(true);
        } else {
          // Should fail
          await expect(
            reputationService.validateScore(score)
          ).rejects.toThrow('VALIDATION_ERROR');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

#### Test Scenarios
1. **Complete Review Flow**
   - 商品購入 → 決済完了 → レビュー投稿 → 表示確認

2. **Review Restrictions**
   - 未購入者のレビュー投稿拒否
   - 重複レビュー投稿拒否
   - 期限切れレビュー投稿拒否

3. **Statistics Accuracy**
   - 複数レビュー投稿後の平均スコア確認
   - スコア分布の正確性確認

### Smart Contract Testing (Phase2)

#### Test Cases
1. **ReputationRegistry Contract**
   - レビュー記録の保存
   - 平均スコア計算
   - 重複投稿防止
   - 支払い証明検証

---

## Security Considerations

### Review Integrity

#### Sybil Attack Prevention
- 支払い証明（決済完了のtxHash/paymentId）を必須化
- 1決済につき1レビューの制限
- 最低購入金額の設定（Phase3検討）

#### Review Manipulation Prevention
- レビュー内容の編集不可（削除のみ可能、Phase3検討）
- 投稿後の変更履歴記録
- オンチェーン記録による改ざん防止（Phase2）

### Input Validation

```typescript
import { z } from 'zod';

const ReviewSubmitSchema = z.object({
  productId: z.string().min(1),
  paymentId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string().max(20)).max(5),
  isAnonymous: z.boolean(),
  recordOnChain: z.boolean().optional(),
});
```

### Rate Limiting
- 1ユーザー1日10件までのレビュー投稿制限
- 短時間での大量投稿防止

### Content Moderation (Phase3)
- 不適切なコンテンツのフィルタリング
- 報告機能
- モデレーターによるレビュー

---

## Deployment Strategy

### Phase1 Deployment

#### Database Migration
```bash
# Prismaスキーマ更新後
npx prisma migrate dev --name add_review_tables
npx prisma generate
```

#### Environment Variables
```bash
# 追加設定（Phase1では特になし）
REVIEW_EXPIRY_DAYS=30
REVIEW_RATE_LIMIT=10
```

### Phase2 Deployment

#### Smart Contract Deployment
```bash
# ReputationRegistryのデプロイ
npx hardhat run scripts/deploy-reputation.ts --network fuji

# 環境変数に追加
REPUTATION_REGISTRY_ADDRESS=0x...
```

#### IPFS Configuration
```bash
# IPFS設定
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
```

---

## Future Enhancements

### Phase3: Agent Reputation

#### Architecture Changes
- Identity Registry（ERC-721）との連携
- エージェントIDへのレビュー対応
- エージェント評価ダッシュボード

#### New Components
- `AgentReviewForm`: エージェント評価フォーム
- `AgentReputationCard`: エージェント評価表示
- `AgentRanking`: エージェントランキング

### Incentive System

#### Token Rewards
- レビュー投稿報酬（ガバナンストークン等）
- 有用なレビューへの投票・報酬
- レビュアーランキングとバッジ

### Advanced Analytics

#### Review Insights
- センチメント分析
- トレンド分析
- 商品改善提案

---

## Appendix

### Default Tags

```typescript
const DEFAULT_TAGS = [
  '高品質',
  'コスパ良し',
  '期待以上',
  '期待以下',
  '初心者向け',
  '上級者向け',
  'わかりやすい',
  'ボリューム満点',
  'すぐに役立つ',
  'おすすめ',
];
```

### Score to ERC-8004 Mapping

```typescript
// 1-5スケール → 0-100スケール（ERC-8004準拠）
function convertToERC8004Score(score: number): number {
  // 1 → 20, 2 → 40, 3 → 60, 4 → 80, 5 → 100
  return score * 20;
}

// 0-100スケール → 1-5スケール
function convertFromERC8004Score(score: number): number {
  return Math.ceil(score / 20);
}
```

### Glossary

- **Reputation Registry**: ERC-8004で定義された評価記録レジストリ
- **支払い証明（Payment Proof）**: 決済完了を証明するトランザクションハッシュまたは決済ID
- **Sybil攻撃**: 偽のアイデンティティを大量作成して評価を操作する攻撃
- **オンチェーン**: ブロックチェーン上に記録されたデータ
- **オフチェーン**: ブロックチェーン外（通常のDB等）に記録されたデータ
- **IPFS**: 分散型ファイルストレージシステム
