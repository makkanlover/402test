/**
 * トランザクション確認スクリプト
 */
import { ethers } from "ethers";

const txHash = process.argv[2] || "0x277e229cfe5652dbf274354ec93a0ba47ca16295605e9596f2daef12b882c7a9";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");

  console.log(`トランザクション確認: ${txHash}`);
  console.log("");

  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!tx || !receipt) {
    console.log("トランザクションが見つかりません");
    return;
  }

  console.log("トランザクション詳細:");
  console.log(`  From: ${tx.from}`);
  console.log(`  To: ${tx.to}`);
  console.log(`  Value: ${ethers.formatEther(tx.value)} AVAX`);
  console.log(`  ステータス: ${receipt.status === 1 ? "成功 ✓" : "失敗 ✗"}`);
  console.log(`  ブロック番号: ${receipt.blockNumber}`);
  console.log(`  ガス使用量: ${receipt.gasUsed.toString()}`);
  console.log("");
  console.log(`Explorer: https://testnet.snowtrace.io/tx/${txHash}`);
}

main().catch(console.error);
