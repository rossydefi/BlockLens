// ============================================================
// UTILS.JS — Small reusable helper functions
// ============================================================
// This file has no blockchain logic in it. It just contains
// small, reusable functions that other files (explorer.js,
// analytics.js, merkle.js) use over and over again.
//
// Keeping these separate means we don't repeat the same code
// in five different places.
// ============================================================

// ---------------------------------------------------------
// INPUT DETECTION
// ---------------------------------------------------------
// These functions look at whatever the user typed into the
// search bar and figure out whether it LOOKS LIKE an address,
// a transaction hash, or a block number.
//
// WHAT YOU CAN EDIT:
// - Nothing usually needed here.
// WHAT YOU SHOULD NOT CHANGE CARELESSLY:
// - The regular expressions. Ethereum addresses are always
//   "0x" + 40 hex characters. Transaction hashes are always
//   "0x" + 64 hex characters. If you loosen these rules, you
//   might try to look up something invalid and get a confusing
//   error from the Ethereum node instead of our friendly message.
// ---------------------------------------------------------
function isValidAddress(value) {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

function isValidTxHash(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

function isValidBlockNumber(value) {
  return /^\d+$/.test(value.trim());
}

// ---------------------------------------------------------
// DETECT SEARCH INPUT TYPE
// ---------------------------------------------------------
// Given whatever the user typed, this returns one of:
// "address", "tx", "block", or "invalid".
// explorer.js uses this to decide which explorer view to show.
// ---------------------------------------------------------
function detectInputType(value) {
  const trimmed = value.trim();
  if (isValidAddress(trimmed)) return 'address';
  if (isValidTxHash(trimmed)) return 'tx';
  if (isValidBlockNumber(trimmed)) return 'block';
  return 'invalid';
}

// ---------------------------------------------------------
// WEI <-> ETH CONVERSION
// ---------------------------------------------------------
// Ethereum's JSON-RPC always returns money values as a HEX
// STRING representing WEI (the smallest unit of ETH).
// 1 ETH = 1,000,000,000,000,000,000 wei (that's 10^18).
//
// We use JavaScript's built-in BigInt type here instead of
// regular numbers, because wei values are often far too large
// for a normal JavaScript number to represent accurately.
//
// WHAT YOU CAN EDIT:
// - How many decimal places are displayed.
// WHAT YOU SHOULD NOT CHANGE CARELESSLY:
// - The 10^18 conversion factor. That number is fixed by the
//   Ethereum protocol itself, not something we chose.
// ---------------------------------------------------------
function weiHexToEth(weiHex, decimals = 6) {
  if (!weiHex) return '0';
  const wei = BigInt(weiHex);
  const divisor = 1000000000000000000n; // 10^18, as a BigInt
  const whole = wei / divisor;
  const remainder = wei % divisor;
  // Pad the remainder to 18 digits, then trim to the requested
  // number of decimal places for a clean display value.
  const remainderStr = remainder.toString().padStart(18, '0').slice(0, decimals);
  return `${whole}.${remainderStr}`;
}

function weiHexToGwei(weiHex) {
  if (!weiHex) return '0';
  const wei = BigInt(weiHex);
  const divisor = 1000000000n; // 10^9
  const whole = wei / divisor;
  const remainder = wei % divisor;
  return `${whole}.${remainder.toString().padStart(9, '0').slice(0, 2)}`;
}

// ---------------------------------------------------------
// HEX <-> DECIMAL HELPERS
// ---------------------------------------------------------
// Ethereum's JSON-RPC returns numbers (like block numbers)
// as hex strings, e.g. "0x14a2b3". We often want a normal
// decimal number to display or do math with.
// ---------------------------------------------------------
function hexToDecimal(hex) {
  if (hex === null || hex === undefined) return null;
  return parseInt(hex, 16);
}

function decimalToHex(num) {
  return '0x' + Number(num).toString(16);
}

// ---------------------------------------------------------
// DISPLAY FORMATTING
// ---------------------------------------------------------
function shortenHash(hash, chars = 6) {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

function formatTimestamp(hexTimestamp) {
  if (!hexTimestamp) return 'Pending';
  const seconds = hexToDecimal(hexTimestamp);
  const date = new Date(seconds * 1000);
  return date.toLocaleString();
}

// ---------------------------------------------------------
// COPY TO CLIPBOARD
// ---------------------------------------------------------
// Uses the browser's built-in Clipboard API. Shows a small
// toast message so the user gets visual confirmation.
// ---------------------------------------------------------
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  }).catch(() => {
    showToast('Could not copy — please copy it manually.');
  });
}

// ---------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------
// A small message that pops up briefly at the bottom of the
// screen, then disappears on its own. Used for "Copied!",
// error messages, etc.
// ---------------------------------------------------------
function showToast(message, isError = false) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' toast-error' : '');
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
