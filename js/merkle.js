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
    for (let j = 0; j < levels[i].length; j++) {
      const hash = levels[i][j];
      const box = document.createElement('div');
      box.className = 'merkle-box';
      box.textContent = shortenHash(('0x' + hash), 6);
      box.title = '0x' + hash;
      // data attributes to identify position in the tree
      box.dataset.level = i;
      box.dataset.index = j;
      // make keyboard-focusable for accessibility
      box.tabIndex = 0;
      // click: copy full hash and highlight path to root
      box.addEventListener('click', async () => {
        copyToClipboard('0x' + hash);
        highlightPath(i, j);
      });
      // keyboard support: Enter or Space triggers click
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          box.click();
        }
      });
      boxes.appendChild(box);
    }
    row.appendChild(boxes);
    container.appendChild(row);
  }
}

// Highlight a path from a chosen leaf/hash up to the root.
function highlightPath(startLevel, startIndex) {
  // Clear existing highlights
  document.querySelectorAll('.merkle-box--highlight').forEach((el) => el.classList.remove('merkle-box--highlight'));

  // levels are rendered with root at the last appended row (levels.length - 1)
  // We can traverse upwards by halving the index each level.
  let level = startLevel;
  let index = startIndex;
  while (level < Infinity && level >= 0) {
    const selector = `.merkle-box[data-level="${level}"][data-index="${index}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('merkle-box--highlight');
      // Scroll the element into view for small screens
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    if (level === levelsLength()) break;
    // move to parent: parent index is floor(index/2) in the next level up (level+1)
    index = Math.floor(index / 2);
    level += 1;
    // Stop when no element exists at this level/index
    if (!document.querySelector(`.merkle-box[data-level="${level}"][data-index="${index}"]`)) break;
  }
}

function levelsLength() {
  // Determine the maximum data-level rendered by inspecting any .merkle-box
  const el = document.querySelector('.merkle-box');
  if (!el) return 0;
  // Find highest level by scanning all boxes
  let max = 0;
  document.querySelectorAll('.merkle-box').forEach((b) => {
    const l = Number(b.dataset.level);
    if (!Number.isNaN(l) && l > max) max = l;
  });
  return max;
}
