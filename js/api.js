// ============================================================
// API.JS — All communication with the Ethereum blockchain
// ============================================================
// This is the ONLY file that talks to the Ethereum network.
// Every other file asks THIS file for blockchain data instead
// of calling fetch() directly. That way, if we ever change how
// we connect to Ethereum, we only have to change it in one place.
//
// HOW IT WORKS: JSON-RPC
// -----------------------
// Ethereum nodes expose an API called JSON-RPC. We send a POST
// request with a JSON body describing which "method" we want
// (e.g. "eth_getBalance") and what "params" to use, and the
// node sends back a JSON response with the "result".
//
// WHAT YOU CAN EDIT:
// - RPC_URL below, to point at your own RPC provider.
// WHAT YOU SHOULD NOT CHANGE CARELESSLY:
// - The method names (eth_getBalance, eth_getBlockByNumber, etc.)
//   These are fixed by the Ethereum protocol — every Ethereum
//   node in the world understands these exact names.
// ============================================================

// A free public Sepolia TESTNET endpoint — no signup needed.
// Sepolia is a test network: the ETH here isn't real money,
// which makes it safe to build and demo with.
// To make the RPC endpoint easy to swap without editing this
// file, we respect a global `window.BLOCKLENS_RPC_URL` if set.
// Replace or override that value as needed for your deployment.
const RPC_URL = window.BLOCKLENS_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

// ---------------------------------------------------------
// CORE JSON-RPC REQUEST FUNCTION
// ---------------------------------------------------------
// Every specific function below (getBalance, getBlock, etc.)
// calls this one function with a different "method" name.
// ---------------------------------------------------------
async function rpcRequest(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'RPC error');
  }

  return data.result;
}

// ---------------------------------------------------------
// SPECIFIC ETHEREUM QUERIES
// ---------------------------------------------------------
// Each of these wraps one JSON-RPC method with a friendlier
// JavaScript function name and handles converting inputs to
// the hex format Ethereum expects.
// ---------------------------------------------------------

// eth_blockNumber — the current latest block number.
async function getLatestBlockNumber() {
  return rpcRequest('eth_blockNumber', []);
}

// eth_getBalance — how much ETH an address holds, in wei.
// The 'latest' param means "as of the most recent block".
async function getBalance(address) {
  return rpcRequest('eth_getBalance', [address, 'latest']);
}

// eth_getTransactionCount — the address's nonce (how many
// transactions it has SENT). Often used as a rough transaction
// count for an account.
async function getTransactionCount(address) {
  return rpcRequest('eth_getTransactionCount', [address, 'latest']);
}

// eth_getCode — returns the smart contract bytecode at an
// address. A regular wallet returns "0x" (empty); a smart
// contract returns actual bytecode.
async function getCode(address) {
  return rpcRequest('eth_getCode', [address, 'latest']);
}

// eth_getBlockByNumber — full details of a block.
// blockNumber can be a decimal number; we convert it to hex.
// includeTx = true returns full transaction objects, not just hashes.
async function getBlockByNumber(blockNumber, includeTx = true) {
  const hex = decimalToHex(blockNumber);
  return rpcRequest('eth_getBlockByNumber', [hex, includeTx]);
}

// eth_getTransactionByHash — full details of one transaction.
async function getTransactionByHash(hash) {
  return rpcRequest('eth_getTransactionByHash', [hash]);
}

// eth_getTransactionReceipt — the OUTCOME of a transaction
// (did it succeed? how much gas did it actually use?).
// This is separate from the transaction itself because the
// receipt only exists once the transaction has been mined.
async function getTransactionReceipt(hash) {
  return rpcRequest('eth_getTransactionReceipt', [hash]);
}

// eth_gasPrice — the network's current suggested gas price.
async function getGasPrice() {
  return rpcRequest('eth_gasPrice', []);
}

// ---------------------------------------------------------
// ADDITIONAL HELPERS
// ---------------------------------------------------------
// A small wrapper that other parts of the app can call
// directly when they want to run arbitrary RPC methods.
function callRpcMethod(method, params = []) {
  return rpcRequest(method, params);
}

// eth_chainId — returns the chain id as a hex string
async function getChainId() {
  return rpcRequest('eth_chainId', []);
}

// getLatestBlock — convenience: fetch the latest block object
async function getLatestBlock() {
  const latestHex = await getLatestBlockNumber();
  const latestDec = hexToDecimal(latestHex);
  return getBlockByNumber(latestDec, false);
}

// ---------------------------------------------------------
// CONNECTION CHECK (used for Demo Mode banner)
// ---------------------------------------------------------
async function checkConnection() {
  try {
    await getLatestBlockNumber();
    return true;
  } catch (err) {
    return false;
  }
}
