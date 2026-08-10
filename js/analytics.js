// ============================================================
// ANALYTICS.JS — Gas fee calculator + wallet analytics summary
// ============================================================

// ---------------------------------------------------------
// GAS FEE CALCULATOR
// ---------------------------------------------------------
// THE FORMULA:
//   Transaction Fee (in ETH) = Gas Used × Gas Price
//
// Gas Used = how much "computational work" the transaction
//            actually took (a plain ETH transfer is 21000).
// Gas Price = how much you're paying PER UNIT of gas, usually
//             quoted in Gwei (1 Gwei = 0.000000001 ETH).
//
// WHAT YOU CAN EDIT:
// - The display formatting.
// WHAT YOU SHOULD NOT CHANGE CARELESSLY:
// - The multiplication/unit conversion — mixing up Gwei and
//   Wei is a very common beginner mistake (it's off by 10^9!).
// ---------------------------------------------------------
function calculateGasFee(gasUsed, gasPriceGwei) {
  const gasUsedNum = Number(gasUsed);
  const gasPriceGweiNum = Number(gasPriceGwei);

  if (!Number.isFinite(gasUsedNum) || !Number.isFinite(gasPriceGweiNum) || gasUsedNum < 0 || gasPriceGweiNum < 0) {
    return null;
  }

  // Use BigInt for the actual math to avoid floating-point
  // rounding errors with large numbers. Gwei input can have
  // decimals (like "12.5"), so we scale it up by 10^6 first
  // to turn it into a whole number BigInt can work with, then
  // multiply by 10^3 more to reach the full gwei-to-wei factor
  // of 10^9 (1 gwei = 1,000,000,000 wei). No further scaling
  // is needed after this — weiPerGas below is already the real,
  // fully-converted wei-per-gas value.
  const gweiScaled = BigInt(Math.round(gasPriceGweiNum * 1000000)); // gwei value * 10^6
  const weiPerGas = gweiScaled * 1000n; // * 10^3 more = * 10^9 total = real wei per gas
  const totalWei = weiPerGas * BigInt(Math.round(gasUsedNum));

  const feeEth = weiToEthFromBigInt(totalWei);

  return {
    feeWei: totalWei.toString(),
    feeEth,
  };
}

// Same idea as weiHexToEth in utils.js, but takes a BigInt directly.
function weiToEthFromBigInt(weiBigInt, decimals = 8) {
  const divisor = 1000000000000000000n;
  const whole = weiBigInt / divisor;
  const remainder = weiBigInt % divisor;
  const remainderStr = remainder.toString().padStart(18, '0').slice(0, decimals);
  return `${whole}.${remainderStr}`;
}

// ---------------------------------------------------------
// WALLET ANALYTICS SUMMARY
// ---------------------------------------------------------
// HONESTY NOTE: a plain Ethereum RPC endpoint can tell us an
// address's CURRENT balance and nonce, but NOT its full
// historical transaction list or an incoming/outgoing
// breakdown — that requires an "indexer" (e.g. Etherscan API,
// The Graph) that has already scanned the whole chain. Rather
// than faking that data, we label the limitation clearly.
// ---------------------------------------------------------
function buildWalletAnalyticsSummary(addressData) {
  return {
    balanceEth: addressData.balanceEth,
    sentTransactionCount: addressData.txCount,
    note: 'A full incoming/outgoing transaction breakdown requires a blockchain indexer (e.g. Etherscan API, The Graph) in addition to a plain RPC connection — a great "Future Improvements" item.',
  };
}
