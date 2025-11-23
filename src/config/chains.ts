/**
 * ブロックチェーンネットワーク設定
 * マルチチェーン対応の設計
 */

// チェーン設定の型定義
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Avalanche Fuji Testnet設定
export const AVALANCHE_FUJI: ChainConfig = {
  chainId: 43113,
  name: "Avalanche Fuji Testnet",
  rpcUrl: process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
  explorerUrl: "https://testnet.snowtrace.io",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
};

// サポートされているチェーンのマップ
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [AVALANCHE_FUJI.chainId]: AVALANCHE_FUJI,
};

// デフォルトチェーン
export const DEFAULT_CHAIN_ID = AVALANCHE_FUJI.chainId;

/**
 * チェーンIDから設定を取得
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

/**
 * チェーンがサポートされているか確認
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS;
}
