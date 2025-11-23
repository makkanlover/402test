/**
 * Phase 2: ブロックチェーン疎通テスト
 * Avalanche Fuji Testnetとの接続を確認
 */
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const AVALANCHE_FUJI_RPC = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS || "0x8865f71851db42e9bdcc3df7eecf936b355c73ea";
const PRIVATE_KEY = process.env.private_key;

async function main() {
  console.log("=== Phase 2: ブロックチェーン疎通テスト ===\n");

  // 1. RPC接続テスト
  console.log("1. Avalanche Fuji Testnet RPC接続テスト:");
  const provider = new ethers.JsonRpcProvider(AVALANCHE_FUJI_RPC);

  try {
    const network = await provider.getNetwork();
    console.log(`   ✓ 接続成功`);
    console.log(`   - ネットワーク名: ${network.name}`);
    console.log(`   - チェーンID: ${network.chainId}`);
  } catch (error) {
    console.log(`   ✗ 接続失敗: ${error}`);
    process.exit(1);
  }

  // 2. ブロック番号取得テスト
  console.log("\n2. 最新ブロック番号取得テスト:");
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✓ 最新ブロック番号: ${blockNumber}`);
  } catch (error) {
    console.log(`   ✗ 取得失敗: ${error}`);
  }

  // 3. マーチャントウォレット残高確認
  console.log("\n3. マーチャントウォレット残高確認:");
  try {
    const balance = await provider.getBalance(MERCHANT_WALLET);
    const balanceInAvax = ethers.formatEther(balance);
    console.log(`   ✓ ウォレットアドレス: ${MERCHANT_WALLET}`);
    console.log(`   ✓ 残高: ${balanceInAvax} AVAX`);

    if (parseFloat(balanceInAvax) < 0.001) {
      console.log(`   ⚠ 警告: 残高が少なすぎます。テストネットのfaucetから取得してください。`);
    }
  } catch (error) {
    console.log(`   ✗ 残高取得失敗: ${error}`);
  }

  // 4. ウォレット署名テスト
  console.log("\n4. ウォレット署名テスト:");
  if (!PRIVATE_KEY) {
    console.log(`   ✗ 秘密鍵が設定されていません（.envのprivate_keyを確認）`);
  } else {
    try {
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      console.log(`   ✓ ウォレットアドレス: ${wallet.address}`);

      // アドレスが一致するか確認
      if (wallet.address.toLowerCase() === MERCHANT_WALLET.toLowerCase()) {
        console.log(`   ✓ マーチャントウォレットと一致`);
      } else {
        console.log(`   ⚠ 警告: マーチャントウォレットと一致しません`);
        console.log(`     期待: ${MERCHANT_WALLET}`);
        console.log(`     実際: ${wallet.address}`);
      }

      // ガス価格取得
      const feeData = await provider.getFeeData();
      console.log(`   ✓ ガス価格: ${ethers.formatUnits(feeData.gasPrice || 0, "gwei")} gwei`);
    } catch (error) {
      console.log(`   ✗ ウォレット作成失敗: ${error}`);
    }
  }

  console.log("\n=== Phase 2 テスト完了 ===");
}

main().catch(console.error);
