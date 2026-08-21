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
// Parse a decimal string (like "12.345") into a BigInt scaled
// by `decimals` places. For example, parseDecimalToBigInt("1.5", 9)
// returns 1500000000n (i.e. 1.5 * 10^9).
function parseDecimalToBigInt(valueStr, decimals) {
  const s = String(valueStr).trim();
  if (!s) return null;
  if (!/^-?\d*(\.\d+)?$/.test(s)) return null;
  const negative = s.startsWith('-');
  const [wholePart, fracPart = ''] = s.replace('-', '').split('.');
  const frac = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  const combined = BigInt(wholePart || '0') * BigInt(10 ** decimals) + BigInt(frac || '0');
  return negative ? -combined : combined;
}

// Calculate gas fee supporting units: 'wei', 'gwei', 'eth'
function calculateGasFee(gasUsed, gasPriceValue, unit = 'gwei') {
  const gasUsedNum = Number(gasUsed);
  if (!Number.isFinite(gasUsedNum) || gasUsedNum < 0) return null;

  // Determine weiPerGas as a BigInt depending on unit
  let weiPerGasBigInt;
  if (unit === 'wei') {
    const parsed = parseDecimalToBigInt(String(gasPriceValue), 0);
    if (parsed === null) return null;
    weiPerGasBigInt = parsed;
  } else if (unit === 'gwei') {
    const parsed = parseDecimalToBigInt(String(gasPriceValue), 9);
    if (parsed === null) return null;
    weiPerGasBigInt = parsed;
  } else if (unit === 'eth') {
    const parsed = parseDecimalToBigInt(String(gasPriceValue), 18);
    if (parsed === null) return null;
    weiPerGasBigInt = parsed;
  } else {
    return null;
  }

  const totalWei = weiPerGasBigInt * BigInt(Math.round(gasUsedNum));
  const feeEth = weiToEthFromBigInt(totalWei, 8);
  // Also calculate fee in Gwei for display convenience
  const feeGweiBigInt = totalWei / 1000000000n;

  return {
    feeWei: totalWei.toString(),
    feeEth,
    feeGwei: (feeGweiBigInt.toString()),
    weiPerGas: weiPerGasBigInt.toString(),
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
