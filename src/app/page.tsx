"use client";

import { useEffect, useState } from "react";

// 商品の型定義
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: string;
  thumbnailUrl: string | null;
}

// 商品カードコンポーネント
function ProductCard({ product }: { product: Product }) {
  return (
    <a
      href={`/products/${product.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* サムネイル */}
      <div className="aspect-video bg-gray-200">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            No Image
          </div>
        )}
      </div>

      {/* 情報 */}
      <div className="p-4">
        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded mb-2">
          {product.type}
        </span>
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">
            {product.price} {product.currency}
          </span>
          <span className="text-sm text-gray-700 font-medium">購入する →</span>
        </div>
      </div>
    </a>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 商品データを取得
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("商品の取得に失敗しました");
        const data = await res.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // ローディング中
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // エラー時
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  // 商品がない場合
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">商品一覧</h1>
        <p className="text-gray-700 mb-4">商品がまだ登録されていません</p>
        <button
          onClick={async () => {
            await fetch("/api/seed", { method: "POST" });
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          デモ商品を追加
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">商品一覧</h1>
      <p className="text-gray-700 mb-8">
        デジタルコンテンツを購入できます。決済はAvalanche Fuji Testnetで行われます。
      </p>

      {/* 商品グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
