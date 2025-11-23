# ERC-8004 Reputation Registry 実装計画

## タスクリスト

### Phase1: オフチェーンレビュー基盤

- [ ] 1. データベーススキーマの拡張
  - Prismaスキーマに Review, ReviewTag, ReviewTagRelation モデルを追加
  - マイグレーションファイルの作成と実行
  - 初期タグデータのシード作成
  - _Requirements: Phase1.4_

- [ ]* 1.1 レビューデータモデルのプロパティテスト
  - **Property 2: Duplicate review prevention**
  - **Validates: Requirements Phase1.1.1**

- [ ] 2. ReputationService の実装
  - `src/lib/reputation.ts` の作成
  - submitReview() - レビュー投稿処理
  - getReviews() - レビュー一覧取得
  - getReviewStats() - 評価統計取得
  - getMyReviews() - 自分のレビュー取得
  - canSubmitReview() - 投稿可否チェック
  - verifyPaymentProof() - 支払い証明検証
  - _Requirements: Phase1.1, Phase1.2_

- [ ]* 2.1 支払い証明検証のプロパティテスト
  - **Property 1: Payment proof required for review**
  - **Validates: Requirements Phase1.1.1**

- [ ]* 2.2 重複レビュー防止のプロパティテスト
  - **Property 2: Duplicate review prevention**
  - **Validates: Requirements Phase1.1.1**

- [ ]* 2.3 レビュー期限のプロパティテスト
  - **Property 3: Review expiration enforcement**
  - **Validates: Requirements Phase1.1.1**

- [ ]* 2.4 スコア範囲のプロパティテスト
  - **Property 4: Score range validation**
  - **Validates: Requirements Phase1.1.2**

- [ ]* 2.5 コメント長のプロパティテスト
  - **Property 5: Comment length validation**
  - **Validates: Requirements Phase1.1.2**

- [ ]* 2.6 平均スコア計算のプロパティテスト
  - **Property 7: Average score calculation correctness**
  - **Validates: Requirements Phase1.2.1**

- [ ]* 2.7 スコア分布のプロパティテスト
  - **Property 8: Score distribution correctness**
  - **Validates: Requirements Phase1.2.1**

- [ ] 3. レビューAPIエンドポイントの実装
  - POST /api/reviews - レビュー投稿
  - GET /api/reviews/:productId - レビュー一覧取得
  - GET /api/reviews/stats/:productId - 評価統計取得
  - GET /api/reviews/my - 自分のレビュー一覧
  - GET /api/reviews/eligibility/:paymentId - 投稿可否確認
  - 入力検証（Zod）とエラーハンドリング
  - _Requirements: Phase1.3_

- [ ]* 3.1 レビューAPI のプロパティテスト
  - **Property 6: Review retrieval completeness**
  - **Property 9: Tag filtering correctness**
  - **Property 10: Review sorting correctness**
  - **Property 13: My reviews isolation**
  - **Validates: Requirements Phase1.2, Phase1.3**

- [ ] 4. TypeScript型定義の追加
  - `src/types/review.ts` の作成
  - Review, ReviewStats, ReviewListResponse 等の型定義
  - API リクエスト/レスポンス型の定義
  - _Requirements: Phase1全体_

- [ ] 5. チェックポイント - Phase1 バックエンドテスト確認
  - 全てのユニットテストが通ることを確認
  - 全てのプロパティテストが通ることを確認
  - 質問があればユーザーに確認

- [ ] 6. レビュー投稿UIの実装
  - `src/components/review/ReviewForm.tsx` - レビュー投稿フォーム
  - `src/components/review/StarRating.tsx` - 星評価入力
  - `src/components/review/TagSelector.tsx` - タグ選択
  - モーダル形式での表示
  - 投稿成功/エラーのフィードバック
  - _Requirements: Phase1.1.3_

- [ ] 7. レビュー表示UIの実装
  - `src/components/review/ReviewList.tsx` - レビュー一覧
  - `src/components/review/ReviewCard.tsx` - 個別レビュー
  - `src/components/review/ReviewStats.tsx` - 評価統計
  - ソート・フィルター機能
  - ページネーション
  - _Requirements: Phase1.2_

- [ ]* 7.1 匿名レビューのプロパティテスト
  - **Property 11: Anonymous review privacy**
  - **Validates: Requirements Phase1.1.2**

- [ ]* 7.2 購入証明バッジのプロパティテスト
  - **Property 12: Purchase verified badge accuracy**
  - **Validates: Requirements Phase1.2.2**

- [ ] 8. 商品詳細ページへのレビュー統合
  - `src/app/products/[id]/page.tsx` にレビューセクション追加
  - 評価統計の表示
  - レビュー一覧の表示
  - レビュー投稿ボタン（購入済みの場合のみ表示）
  - _Requirements: Phase1.2.1_

- [ ] 9. 購入履歴からのレビュー導線実装
  - `src/app/history/page.tsx` にレビューボタン追加
  - 未レビューの購入にのみボタン表示
  - レビュー投稿モーダルへの遷移
  - _Requirements: Phase1.1.3_

- [ ] 10. マイレビューページの実装
  - `src/app/reviews/page.tsx` の作成
  - 自分が投稿したレビュー一覧
  - レビュー対象商品へのリンク
  - _Requirements: Phase1.3_

- [ ] 11. Phase1 統合テスト
  - 商品購入 → レビュー投稿 → 表示確認のE2Eテスト
  - 未購入者のレビュー投稿拒否テスト
  - 重複レビュー投稿拒否テスト
  - 期限切れレビュー投稿拒否テスト
  - _Requirements: Phase1成功基準_

- [ ] 12. チェックポイント - Phase1 完了確認
  - 全ての機能が動作することを確認
  - 全てのテストが通ることを確認
  - UIの動作確認
  - 質問があればユーザーに確認

---

### Phase2: オンチェーン統合（ERC-8004 Reputation Registry）

- [ ] 13. ReputationRegistry スマートコントラクトの実装
  - `contracts/ReputationRegistry.sol` の作成
  - submitReview() - レビュー記録
  - getAverageScore() - 平均スコア取得
  - getReviews() - レビュー一覧取得
  - getReviewCount() - レビュー数取得
  - hasReviewed() - 重複チェック
  - PaymentProcessorとの連携（支払い証明検証）
  - _Requirements: Phase2.1_

- [ ]* 13.1 スマートコントラクトのユニットテスト
  - レビュー記録の保存テスト
  - 平均スコア計算テスト
  - 重複投稿防止テスト
  - 支払い証明検証テスト
  - イベント発行テスト

- [ ] 14. スマートコントラクトのデプロイ
  - Hardhatデプロイスクリプトの作成
  - Avalanche Fuji Testnetへのデプロイ
  - コントラクトアドレスの設定ファイル追加
  - コントラクト検証（Snowtrace）
  - _Requirements: Phase2.1_

- [ ] 15. IPFS連携の実装
  - Pinata/IPFS APIの統合
  - 詳細フィードバックのIPFSアップロード
  - feedbackURIの生成と保存
  - _Requirements: Phase2.2.1_

- [ ] 16. ReputationService のオンチェーン対応
  - submitReviewOnChain() - オンチェーンレビュー投稿
  - getReviewsOnChain() - オンチェーンレビュー取得
  - syncReviews() - オフチェーン/オンチェーン同期
  - _Requirements: Phase2.2_

- [ ]* 16.1 オンチェーン整合性のプロパティテスト
  - **Property 14: On-chain record consistency**
  - **Validates: Requirements Phase2.2.2**

- [ ]* 16.2 支払い証明オンチェーン検証のプロパティテスト
  - **Property 15: Payment proof on-chain verification**
  - **Validates: Requirements Phase2.2.1**

- [ ] 17. レビューAPI のオンチェーン対応
  - POST /api/reviews に recordOnChain オプション追加
  - GET /api/reviews/:productId/onchain エンドポイント追加
  - オンチェーン記録状態の返却
  - _Requirements: Phase2.2.2_

- [ ] 18. UIのオンチェーン対応
  - レビュー投稿フォームにオンチェーン記録オプション追加
  - 「オンチェーン記録済み」バッジ表示
  - トランザクションハッシュのリンク表示
  - _Requirements: Phase2.3_

- [ ] 19. Phase2 統合テスト
  - オンチェーンレビュー投稿のE2Eテスト
  - オフチェーン/オンチェーン整合性テスト
  - トランザクション確認テスト
  - _Requirements: Phase2成功基準_

- [ ] 20. チェックポイント - Phase2 完了確認
  - オンチェーン機能が動作することを確認
  - 全てのテストが通ることを確認
  - UIの動作確認
  - 質問があればユーザーに確認

---

### Phase3: 高度な機能（将来拡張）

- [ ] 21. エージェント評価への拡張設計
  - Identity Registry（ERC-721）との連携設計
  - エージェントIDへのレビュー対応
  - データモデルの拡張
  - _Requirements: Phase3.1_

- [ ] 22. インセンティブシステム設計
  - レビュー投稿報酬の設計
  - 有用なレビューへの投票機能設計
  - レビュアーランキング設計
  - _Requirements: Phase3.2_

- [ ] 23. Sybil攻撃対策強化
  - 最低購入金額の設定
  - 購入からの待機期間設定
  - 異常パターン検出アルゴリズム
  - _Requirements: Phase3.4_

---

## プロパティテスト一覧

| ID | Property | Validates |
|----|----------|-----------|
| 1 | Payment proof required for review | Phase1.1.1 |
| 2 | Duplicate review prevention | Phase1.1.1 |
| 3 | Review expiration enforcement | Phase1.1.1 |
| 4 | Score range validation | Phase1.1.2 |
| 5 | Comment length validation | Phase1.1.2 |
| 6 | Review retrieval completeness | Phase1.2 |
| 7 | Average score calculation correctness | Phase1.2.1 |
| 8 | Score distribution correctness | Phase1.2.1 |
| 9 | Tag filtering correctness | Phase1.2.1 |
| 10 | Review sorting correctness | Phase1.2.1 |
| 11 | Anonymous review privacy | Phase1.1.2 |
| 12 | Purchase verified badge accuracy | Phase1.2.2 |
| 13 | My reviews isolation | Phase1.3 |
| 14 | On-chain record consistency | Phase2.2.2 |
| 15 | Payment proof on-chain verification | Phase2.2.1 |

---

## 依存関係

```
[Phase1]
1. データベーススキーマ
   └─► 2. ReputationService
       └─► 3. レビューAPI
           └─► 6. レビュー投稿UI
           └─► 7. レビュー表示UI
               └─► 8. 商品詳細ページ統合
               └─► 9. 購入履歴導線
               └─► 10. マイレビューページ

[Phase2]
13. スマートコントラクト
    └─► 14. デプロイ
        └─► 15. IPFS連携
            └─► 16. Service拡張
                └─► 17. API拡張
                    └─► 18. UI拡張
```

---

## 見積もり（目安）

| Phase | タスク数 | 目安期間 |
|-------|---------|---------|
| Phase1 | 12タスク | 3-5日 |
| Phase2 | 8タスク | 5-7日 |
| Phase3 | 3タスク | 将来 |

---

## チェックリスト

### Phase1 完了条件
- [ ] 購入者のみがレビュー投稿できる
- [ ] 1決済につき1レビューの制限が機能する
- [ ] 購入後30日以内のみ投稿可能
- [ ] 商品詳細ページで平均評価・レビュー一覧が表示される
- [ ] 購入履歴からレビュー投稿できる
- [ ] マイレビューページで自分のレビューが確認できる
- [ ] 全てのプロパティテストが通る

### Phase2 完了条件
- [ ] レビューがオンチェーンに記録される
- [ ] オンチェーン記録のトランザクションが確認できる
- [ ] 詳細フィードバックがIPFSに保存される
- [ ] オフチェーン/オンチェーンデータが整合する
- [ ] 全てのプロパティテストが通る
