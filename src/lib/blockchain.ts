/**
 * ブロックチェーンサービス
 * Avalanche Fuji Testnetへのトランザクション実行
 */
import { ethers } from "ethers";
import { getChainConfig, DEFAULT_CHAIN_ID, type ChainConfig } from "@/config/chains";

// トランザクション結果の型
export interface TransactionResult {
  transactionHash: string;
  chainId: number;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
}

/**
 * ブロックチェーンサービスクラス
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private chainConfig: ChainConfig;

  constructor(chainId: number = DEFAULT_CHAIN_ID) {
    const config = getChainConfig(chainId);
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    this.chainConfig = config;

    // プロバイダーを初期化
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // 秘密鍵からウォレットを作成
    const privateKey = process.env.private_key;
    if (!privateKey) {
      throw new Error("Private key not found in environment variables");
    }
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * システムウォレットのアドレスを取得
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * ウォレットの残高を取得（AVAX）
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * ネイティブトークン（AVAX）を送信
   */
  async sendNativeToken(
    toAddress: string,
    amountInAvax: number
  ): Promise<TransactionResult> {
    try {
      // 金額をweiに変換
      const amountInWei = ethers.parseEther(amountInAvax.toString());

      // ガス代を見積もり
      const gasPrice = await this.provider.getFeeData();

      // トランザクションを作成
      const tx = await this.wallet.sendTransaction({
        to: toAddress,
        value: amountInWei,
        gasPrice: gasPrice.gasPrice,
      });

      console.log(`トランザクション送信: ${tx.hash}`);

      // トランザクションの確認を待つ
      const receipt = await tx.wait();

      if (!receipt) {
        return {
          transactionHash: tx.hash,
          chainId: this.chainConfig.chainId,
          status: "failed",
        };
      }

      return {
        transactionHash: tx.hash,
        chainId: this.chainConfig.chainId,
        status: receipt.status === 1 ? "confirmed" : "failed",
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("トランザクション送信エラー:", error);
      throw error;
    }
  }

  /**
   * トランザクションのステータスを確認
   */
  async getTransactionStatus(txHash: string): Promise<TransactionResult> {
    const receipt = await this.provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        transactionHash: txHash,
        chainId: this.chainConfig.chainId,
        status: "pending",
      };
    }

    return {
      transactionHash: txHash,
      chainId: this.chainConfig.chainId,
      status: receipt.status === 1 ? "confirmed" : "failed",
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * ガス代を見積もる
   */
  async estimateGas(toAddress: string, amountInAvax: number): Promise<bigint> {
    const amountInWei = ethers.parseEther(amountInAvax.toString());

    const gasEstimate = await this.provider.estimateGas({
      from: this.wallet.address,
      to: toAddress,
      value: amountInWei,
    });

    return gasEstimate;
  }

  /**
   * エクスプローラーURLを取得
   */
  getExplorerUrl(txHash: string): string {
    return `${this.chainConfig.explorerUrl}/tx/${txHash}`;
  }
}

// シングルトンインスタンス
let blockchainServiceInstance: BlockchainService | null = null;

/**
 * ブロックチェーンサービスのインスタンスを取得
 */
export function getBlockchainService(chainId?: number): BlockchainService {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService(chainId);
  }
  return blockchainServiceInstance;
}
