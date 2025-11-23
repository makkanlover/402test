# API仕様書

## 認証API

### POST /api/auth/register
ユーザー登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "name": "ユーザー名"
}
```

**レスポンス:** `200 OK`
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "name": "ユーザー名"
}
```

---

### POST /api/auth/login
ログイン（メールアドレスでユーザー検索）

**リクエスト:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス:** `200 OK`
```json
{
  "userId": "uuid",
  "hasPasskey": true
}
```

---

### POST /api/auth/passkey/register
パスキー登録オプション取得

**リクエスト:**
```json
{
  "userId": "uuid"
}
```

**レスポンス:** `200 OK`
```json
{
  "challenge": "base64url",
  "rp": { "name": "x402 Payment Platform", "id": "localhost" },
  "user": { "id": "base64url", "name": "email", "displayName": "name" },
  "pubKeyCredParams": [...],
  "authenticatorSelection": {...}
}
```

---

### PUT /api/auth/passkey/register
パスキー登録レスポンス検証

**リクエスト:**
```json
{
  "userId": "uuid",
  "response": { /* WebAuthn RegistrationResponse */ }
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true
}
```

---

### POST /api/auth/passkey/authenticate
パスキー認証オプション取得

**リクエスト:**
```json
{
  "userId": "uuid"
}
```

**レスポンス:** `200 OK`
```json
{
  "challenge": "base64url",
  "rpId": "localhost",
  "allowCredentials": [...]
}
```

---

### PUT /api/auth/passkey/authenticate
パスキー認証レスポンス検証 & セッション作成

**リクエスト:**
```json
{
  "userId": "uuid",
  "response": { /* WebAuthn AuthenticationResponse */ }
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "sessionToken": "uuid"
}
```

**Cookie設定:** `session=<token>; HttpOnly; SameSite=Lax`

---

## 商品API

### GET /api/products
商品一覧取得

**レスポンス:** `200 OK`
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "商品名",
      "description": "説明",
      "price": 0.00001,
      "currency": "AVAX",
      "type": "article",
      "thumbnailUrl": "https://...",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/products/[id]
商品詳細取得

**レスポンス:** `200 OK`
```json
{
  "id": "uuid",
  "name": "商品名",
  "description": "説明",
  "price": 0.00001,
  "currency": "AVAX",
  "type": "article",
  "contentUrl": "https://...",
  "thumbnailUrl": "https://..."
}
```

---

## 決済API

### POST /api/payments/initiate
決済開始（HTTP 402レスポンス）

**認証:** Cookie `session` 必須

**リクエスト:**
```json
{
  "productId": "uuid"
}
```

**レスポンス:** `402 Payment Required`
```json
{
  "paymentId": "pay_xxx",
  "amount": 0.00001,
  "currency": "AVAX",
  "productId": "uuid",
  "productName": "商品名",
  "expiresAt": "2025-01-01T00:30:00Z"
}
```

**ヘッダー:**
- `X-Payment-Required: true`
- `X-Payment-Id: pay_xxx`

---

### POST /api/payments/process
決済処理（ブロックチェーン送金実行）

**認証:** Cookie `session` 必須

**リクエスト:**
```json
{
  "paymentId": "pay_xxx",
  "paymentMethod": "mock" | "credit_card" | "paypay" | "apple_pay"
}
```

**レスポンス:** `200 OK`
```json
{
  "success": true,
  "paymentId": "pay_xxx",
  "transactionHash": "0x...",
  "chainId": 43113,
  "status": "confirmed",
  "explorerUrl": "https://testnet.snowtrace.io/tx/0x..."
}
```

---

### GET /api/payments/[id]
決済状態取得

**レスポンス:** `200 OK`
```json
{
  "paymentId": "pay_xxx",
  "status": "pending" | "processing" | "completed" | "failed",
  "amount": 0.00001,
  "currency": "AVAX",
  "productName": "商品名",
  "transactionHash": "0x...",
  "chainId": 43113,
  "confirmedAt": "2025-01-01T00:00:00Z"
}
```

---

### GET /api/payments/history
購入履歴取得

**認証:** Cookie `session` 必須

**レスポンス:** `200 OK`
```json
{
  "payments": [
    {
      "paymentId": "pay_xxx",
      "productId": "uuid",
      "productName": "商品名",
      "amount": 0.00001,
      "currency": "AVAX",
      "status": "completed",
      "transactionHash": "0x...",
      "chainId": 43113,
      "createdAt": "2025-01-01T00:00:00Z",
      "confirmedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## 管理API

### POST /api/seed
初期データ投入（開発用）

**レスポンス:** `200 OK`
```json
{
  "message": "商品データを投入しました",
  "count": 3
}
```

---

## エラーレスポンス

すべてのAPIで共通のエラーフォーマット：

```json
{
  "error": "エラーメッセージ"
}
```

| ステータス | 意味 |
|-----------|------|
| 400 | バリデーションエラー |
| 401 | 認証エラー（ログイン必要） |
| 402 | 決済が必要 |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |
