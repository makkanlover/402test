# x402 決済プラットフォーム 実装計画

## タスクリスト

- [ ] 1. プロジェクト環境構築
  - Next.js 14プロジェクトの作成（App Router使用）
  - TypeScript、Tailwind CSS、shadcn/uiのセットアップ
  - PostgreSQLデータベースのセットアップ（Docker）
  - 環境変数の設定ファイル作成
  - _Requirements: MVP基盤構築_

- [ ] 2. データベーススキーマとモデルの実装
  - データベースマイグレーションツールのセットアップ（Prisma/Drizzle）
  - Users, Passkeys, Products, Payments, ProductAccessテーブルの作成
  - TypeScript型定義の作成
  - _Requirements: 1.1, 2.1, 2.2, 3.12_

- [ ]* 2.1 データベースモデルのプロパティテスト
  - **Property 1: Product registration round trip**
  - **Validates: Requirements 1.1**

- [ ] 3. 認証基盤の実装
  - WebAuthn（Passkey）ライブラリの統合（SimpleWebAuthn）
  - AuthServiceの実装（ユーザー登録、ログイン、パスキー管理）
  - セッション管理の実装
  - 認証ミドルウェアの作成
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.12, 3.13_

- [ ]* 3.1 パスキー登録のプロパティテスト
  - **Property 4: Passkey registration persistence**
  - **Validates: Requirements 2.5**

- [ ]* 3.2 パスキー認証のプロパティテスト
  - **Property 5: Passkey authentication correctness**
  - **Validates: Requirements 2.6**

- [ ]* 3.3 認証トークンのプロパティテスト
  - **Property 6: Auth token validity**
  - **Validates: Requirements 2.7**

- [ ]* 3.4 ユーザー登録のプロパティテスト
  - **Property 19: User registration uniqueness**
  - **Validates: Requirements 3.12**

- [ ]* 3.5 ログインのプロパティテスト
  - **Property 20: Login authentication**
  - **Validates: Requirements 3.13**

- [ ] 4. 認証APIエンドポイントの実装
  - POST /api/auth/register - ユーザー登録
  - POST /api/auth/login - ログイン
  - POST /api/auth/passkey/register - パスキー登録
  - POST /api/auth/passkey/authenticate - パスキー認証
  - 入力検証とエラーハンドリング
  - _Requirements: 4.10, 4.11, 4.12, 4.13_

- [ ]* 4.1 認証APIのプロパティテスト
  - **Property 27: User registration API response**
  - **Property 28: Login API response**
  - **Property 29: Passkey registration API response**
  - **Property 30: Passkey authentication API response**
  - **Validates: Requirements 4.10, 4.11, 4.12, 4.13**

- [ ] 5. 商品管理機能の実装
  - ProductServiceの実装（CRUD操作）
  - 商品データのバリデーション
  - アクセス権チェック機能
  - _Requirements: 1.1, 3.11_

- [ ]* 5.1 商品管理のプロパティテスト
  - **Property 1: Product registration round trip**
  - **Property 18: Product access control**
  - **Validates: Requirements 1.1, 3.11**

- [ ] 6. 商品APIエンドポイントの実装
  - GET /api/products - 商品一覧取得
  - GET /api/products/:id - 商品詳細取得
  - POST /api/products - 商品作成（管理者用）
  - 認証・認可チェック
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 6.1 商品APIのプロパティテスト
  - **Property 21: Product list API response**
  - **Property 22: Product detail API response**
  - **Property 23: Product creation API response**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 7. ブロックチェーン基盤の実装
  - ethers.js v6の統合
  - BlockchainServiceの実装（ウォレット管理、トランザクション実行）
  - マルチチェーン設定ファイルの作成（chainId, RPC URL, コントラクトアドレス）
  - システムウォレットの初期化
  - _Requirements: 2.11, 2.12, 2.19, 2.20, 2.21_

- [ ]* 7.1 ブロックチェーン基盤のプロパティテスト
  - **Property 8: System wallet initialization**
  - **Property 9: Multi-chain configuration retrieval**
  - **Property 13: Chain switching via configuration**
  - **Property 14: Chain-specific RPC URL mapping**
  - **Property 15: Chain-specific contract address mapping**
  - **Validates: Requirements 2.11, 2.12, 2.19, 2.20, 2.21**

- [ ] 8. スマートコントラクトの実装
  - Hardhatプロジェクトのセットアップ
  - PaymentProcessor.solの実装（決済記録、取得機能）
  - コントラクトのテスト作成
  - Avalanche Fuji Testnetへのデプロイ
  - コントラクトアドレスの設定ファイルへの追加
  - _Requirements: 2.13, 2.15_

- [ ]* 8.1 スマートコントラクトのユニットテスト
  - 決済記録の保存テスト
  - 決済情報の取得テスト
  - ユーザー決済履歴の取得テスト
  - イベント発行の確認
  - アクセス制御のテスト

- [ ] 9. 決済サービスの実装
  - PaymentServiceの実装
  - 決済開始処理（HTTP 402レスポンス生成）
  - 決済状態管理（pending → processing → completed/failed）
  - モック決済処理（1-3秒のシミュレーション）
  - ブロックチェーン決済実行
  - トランザクション確認処理
  - 決済完了処理（アクセス権付与、履歴記録）
  - _Requirements: 2.1, 2.2, 2.3, 2.9, 2.13, 2.14, 2.15, 2.16, 2.17, 2.22, 2.23_

- [ ]* 9.1 決済情報生成のプロパティテスト
  - **Property 2: Payment information completeness**
  - **Validates: Requirements 2.2**

- [ ]* 9.2 決済状態遷移のプロパティテスト
  - **Property 3: Payment state transition validity**
  - **Validates: Requirements 2.3**

- [ ]* 9.3 モック決済処理時間のプロパティテスト
  - **Property 7: Mock payment processing time**
  - **Validates: Requirements 2.10**

- [ ]* 9.4 ガス代見積もりのプロパティテスト
  - **Property 10: Gas estimation positivity**
  - **Validates: Requirements 2.14**

- [ ]* 9.5 トランザクションハッシュ永続化のプロパティテスト
  - **Property 11: Transaction hash persistence**
  - **Validates: Requirements 2.15**

- [ ]* 9.6 トランザクション状態判定のプロパティテスト
  - **Property 12: Transaction status determination**
  - **Validates: Requirements 2.17**

- [ ]* 9.7 アクセス権付与のプロパティテスト
  - **Property 16: Access grant after payment**
  - **Validates: Requirements 2.22**

- [ ]* 9.8 決済履歴永続化のプロパティテスト
  - **Property 17: Payment history persistence**
  - **Validates: Requirements 2.23**

- [ ] 10. 決済APIエンドポイントの実装
  - POST /api/payments/initiate - 決済開始（402レスポンス）
  - POST /api/payments/authenticate - パスキー認証
  - POST /api/payments/process - モック決済処理
  - POST /api/payments/execute - ブロックチェーン決済実行
  - GET /api/payments/:id - 決済状態確認
  - GET /api/payments/history - 決済履歴取得
  - エラーハンドリングとバリデーション
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ]* 10.1 決済APIのプロパティテスト
  - **Property 24: Payment authentication API correctness**
  - **Property 25: Payment status API response**
  - **Property 26: Payment history API response**
  - **Validates: Requirements 4.5, 4.8, 4.9**

- [ ] 11. チェックポイント - コアロジックのテスト確認
  - 全てのテストが通ることを確認
  - 質問があればユーザーに確認

- [ ] 12. フロントエンド共通コンポーネントの実装
  - レイアウトコンポーネント（Header, Footer, Navigation）
  - ローディングコンポーネント
  - エラー表示コンポーネント
  - shadcn/uiコンポーネントの統合
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13. 商品ページUIの実装
  - 商品一覧ページ（ProductList, ProductCard）
  - 商品詳細ページ（ProductDetail）
  - 商品データの取得とレンダリング
  - レスポンシブデザイン
  - _Requirements: 3.1, 3.5_

- [ ] 14. 認証UIの実装
  - ユーザー登録フォーム
  - ログインフォーム
  - パスキー登録フロー
  - 認証状態の管理（React Context/Zustand）
  - _Requirements: 3.14_

- [ ] 15. 決済フローUIの実装
  - 決済方法選択画面（PaymentMethodSelector）
  - パスキー認証プロンプト（PasskeyAuthPrompt）
  - 決済処理中画面（PaymentProcessing）
  - 決済完了画面（PaymentComplete）
  - エラー表示（PaymentError）
  - 決済フローの状態管理
  - _Requirements: 3.2, 3.6, 3.7, 3.8, 3.9_

- [ ] 16. マイページUIの実装
  - 購入履歴表示（PurchaseHistory）
  - 購入済み商品へのアクセス
  - ユーザー情報表示
  - _Requirements: 3.10, 3.11_

- [ ] 17. エンドツーエンド決済フローの統合
  - 商品選択から決済完了までの全フロー接続
  - エラーハンドリングの統合
  - ユーザーフィードバックの実装
  - _Requirements: MVP決済フロー全体_

- [ ] 18. セキュリティ対策の実装
  - 入力検証の強化（Zodスキーマ）
  - XSS対策（サニタイゼーション）
  - CSRF対策
  - レート制限の実装
  - HTTPS強制設定
  - _Requirements: S.1, S.2, S.3, S.4, S.6_

- [ ]* 18.1 入力検証のプロパティテスト
  - **Property 31: Input validation rejection**
  - **Validates: Requirements S.1, S.2, S.3**

- [ ] 19. エラーハンドリングの統合
  - 統一されたエラーレスポンス形式の実装
  - フロントエンドエラー表示の改善
  - エラーロギングの設定
  - ユーザーフレンドリーなエラーメッセージ（日本語）
  - _Requirements: Error Handling全体_

- [ ] 20. デプロイ準備
  - 環境変数の整理と文書化
  - ビルドスクリプトの作成
  - データベースマイグレーションスクリプト
  - デプロイ手順書の作成
  - _Requirements: Deployment Strategy_

- [ ] 21. テストネットデプロイとE2Eテスト
  - Vercelへのデプロイ
  - Avalanche Fuji Testnetでの動作確認
  - エンドツーエンドの決済フロー手動テスト
  - ブラウザ互換性テスト（Chrome, Firefox, Safari, Edge）
  - パスキー認証の各ブラウザでのテスト
  - _Requirements: MVP成功基準_

- [ ] 22. 最終チェックポイント
  - 全ての機能が動作することを確認
  - 全てのテストが通ることを確認
  - ドキュメントの最終確認
  - 質問があればユーザーに確認

- [ ] 23. デモ準備
  - デモ用データの作成
  - デモシナリオの作成
  - プレゼンテーション資料の準備
  - README.mdの更新
  - _Requirements: MVP成功基準_
