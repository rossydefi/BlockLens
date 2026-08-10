// ============================================================
// MERKLE.JS — Beginner-friendly Merkle Tree visualizer
// ============================================================
// IMPORTANT CONCEPT TO UNDERSTAND (and to be able to explain
// to scholarship judges):
//
// This visualizer builds a SIMPLE BINARY MERKLE TREE. It is
// NOT exactly the same data structure Ethereum uses internally.
// Ethereum's real state trie is a MERKLE PATRICIA TRIE — it
// combines a "radix trie" (organizing data by shared key
// prefixes) with Merkle-style hashing, and uses RLP encoding
// plus Keccak-256 hashing rather than simple pairwise hashing.
//
// This visualizer teaches the CORE CONCEPT that underlies both
// structures: combining hashes upward until you reach one root
// hash that represents everything beneath it.
//
// HASH ALGORITHM NOTE:
// We use SHA-256 here (via the browser's built-in Web Crypto
// API) because it needs zero external libraries. Ethereum
// itself uses KECCAK-256, which is DIFFERENT from the "SHA3-256"
// standardized by NIST — Ethereum was built on an early version
// of Keccak before NIST finalized small changes for the official
// SHA-3 standard, so Keccak-256 and SHA3-256 produce different
// hashes for the same input. Implementing real Keccak-256 from
// scratch would take hundreds of lines, so this teaching demo
// uses the browser-native SHA-256 instead, and says so clearly.
//
// WHAT YOU CAN EDIT:
// - How the tree is drawn (renderMerkleTree).
// WHAT YOU SHOULD NOT CHANGE CARELESSLY:
// - The pairing/hashing logic in buildMerkleTree.
// ============================================================

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------
// BUILD MERKLE TREE
// ---------------------------------------------------------
// 1. Hash every leaf.
// 2. Pair up hashes two at a time and hash each pair together
//    (an odd one out is paired with itself).
// 3. Repeat on the smaller row until one hash remains: the root.
// ---------------------------------------------------------
async function buildMerkleTree(leaves) {
  if (!leaves || leaves.length === 0) return [];

  let currentLevel = [];
  for (const leaf of leaves) {
    currentLevel.push(await sha256Hex(leaf));
  }

  const levels = [currentLevel];

  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i];
      const combined = await sha256Hex(left + right);
      nextLevel.push(combined);
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return levels; // levels[0] = leaf hashes, last level = [root]
}

// ---------------------------------------------------------
// RENDER THE TREE INTO THE PAGE
// ---------------------------------------------------------
function renderMerkleTree(levels, container) {
  container.innerHTML = '';

  if (levels.length === 0) {
    container.innerHTML = '<p class="muted">Enter at least one value above to build a tree.</p>';
    return;
  }

  for (let i = levels.length - 1; i >= 0; i--) {
    const row = document.createElement('div');
    row.className = 'merkle-row';

    const label = document.createElement('div');
    label.className = 'merkle-row-label';
    label.textContent = i === levels.length - 1 ? 'ROOT HASH' : `Level ${i}`;
    row.appendChild(label);

    const boxes = document.createElement('div');
    boxes.className = 'merkle-boxes';
    for (const hash of levels[i]) {
      const box = document.createElement('div');
      box.className = 'merkle-box';
      box.textContent = shortenHash(('0x' + hash), 6);
      box.title = '0x' + hash;
      boxes.appendChild(box);
    }
    row.appendChild(boxes);
    container.appendChild(row);
  }
}
