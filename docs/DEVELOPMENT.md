# 開発ガイド

## 段階的テスト・結合プロトコル

新機能の開発・拡張時は、以下の段階的アプローチを必ず遵守すること。

### 基本原則

```
単機能テスト → 疎通テスト → 機能結合テスト → 全結合テスト
```

### 標準的な段階

| Phase | 内容 | 確認項目 |
|-------|------|----------|
| 1 | コア機能の単体テスト | 認証なし・外部連携なしでの基本CRUD |
| 2 | 外部システムとの疎通 | RPC接続、API疎通、残高取得など |
| 3 | 外部連携機能の結合 | 認証なしでの外部API呼び出し |
| 4 | 認証機能の単体テスト | パスキー登録・認証フロー |
| 5 | 全機能結合テスト | E2Eシナリオ |

### 段階間の移行ルール

1. **前段階のテスト成功が必須**: 前段階が完了するまで次段階に進まない
2. **ロールバック可能性の確保**: 各段階でチェックポイントを記録
3. **失敗時の切り分け**: 問題が発生した場合、どの段階で発生したか特定可能に

---

## 新しいAPIエンドポイントの追加

### 1. 型定義の追加

`src/types/index.ts` に必要な型を追加:

```typescript
export type NewFeatureRequest = {
  field1: string;
  field2: number;
};

export type NewFeatureResponse = {
  result: string;
};
```

### 2. サービス層の実装

`src/lib/` に新しいサービスファイルを作成:

```typescript
// src/lib/new-feature.ts
import { prisma } from "./db";

export async function doSomething(input: string) {
  // ビジネスロジック
  return result;
}
```

### 3. APIルートの作成

`src/app/api/` にルートファイルを作成:

```typescript
// src/app/api/new-feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { doSomething } from "@/lib/new-feature";
import { validateSession } from "@/lib/auth";
import { z } from "zod";

const RequestSchema = z.object({
  field1: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // 認証が必要な場合
    const sessionToken = request.cookies.get("session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json(
        { error: "セッションが無効です" },
        { status: 401 }
      );
    }

    // バリデーション
    const body = await request.json();
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // ビジネスロジック実行
    const response = await doSomething(result.data.field1);

    return NextResponse.json(response);
  } catch (error) {
    console.error("エラー:", error);
    const message = error instanceof Error ? error.message : "エラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## データベーススキーマの変更

### 1. スキーマ更新

`prisma/schema.prisma` を編集:

```prisma
model NewModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

### 2. マイグレーション適用

```bash
# 開発環境（スキーマ同期）
npx prisma db push

# 本番環境（マイグレーションファイル生成）
npx prisma migrate dev --name add_new_model
```

### 3. クライアント再生成

```bash
npx prisma generate
```

---

## ブロックチェーン機能の拡張

### 新しいチェーンの追加

`src/config/chains.ts` に設定を追加:

```typescript
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  43113: { /* Avalanche Fuji */ },
  // 新しいチェーン
  80002: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorer: "https://www.oklink.com/amoy",
  },
};
```

### ERC-20トークン送金の追加

`src/lib/blockchain.ts` を拡張:

```typescript
async sendERC20Token(
  tokenAddress: string,
  to: string,
  amount: number
): Promise<TransactionResult> {
  const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
  const contract = new ethers.Contract(tokenAddress, abi, this.wallet);

  const decimals = 18; // トークンに応じて変更
  const amountWei = ethers.parseUnits(amount.toString(), decimals);

  const tx = await contract.transfer(to, amountWei);
  const receipt = await tx.wait(1);

  return {
    transactionHash: receipt.hash,
    chainId: this.chainConfig.chainId,
    status: receipt.status === 1 ? "confirmed" : "failed",
  };
}
```

---

## テストの追加

### 単体テストスクリプト

`scripts/test-*.ts` として作成:

```typescript
// scripts/test-new-feature.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 新機能テスト ===\n");

  // テストケース1
  console.log("Test 1: 正常系");
  // ...

  // テストケース2
  console.log("Test 2: エラー系");
  // ...

  console.log("\n=== テスト完了 ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

実行:

```bash
npx tsx scripts/test-new-feature.ts
```

---

## コーディング規約

### コメント

- すべてのコメントは日本語で記述
- 関数やクラスの説明は必ず日本語で記述
- インラインコメントも日本語を使用

```typescript
/**
 * 商品のアクセス権を付与する
 * @param userId ユーザーID
 * @param productId 商品ID
 * @param paymentId 決済ID
 */
export async function grantProductAccess(
  userId: string,
  productId: string,
  paymentId: string
): Promise<void> {
  // 既存のアクセス権をチェック
  const existing = await prisma.productAccess.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  // 既にアクセス権がある場合はスキップ
  if (existing) {
    return;
  }

  // アクセス権を付与
  await prisma.productAccess.create({
    data: { userId, productId, paymentId },
  });
}
```

### エラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  console.error("処理名エラー:", error);
  const message = error instanceof Error ? error.message : "エラーが発生しました";
  return NextResponse.json({ error: message }, { status: 500 });
}
```

### バリデーション

Zodを使用:

```typescript
import { z } from "zod";

const Schema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  amount: z.number().positive("金額は正の数である必要があります"),
});

const result = Schema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: result.error.issues[0].message },
    { status: 400 }
  );
}
```
