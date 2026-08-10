// ============================================================
// APP.JS — Entry point. Wires up the page once it loads.
// ============================================================
// WHAT YOU CAN EDIT:
// - Learning card content (LEARN_TOPICS array).
// - Which JSON-RPC methods are shown as examples.
// WHAT YOU SHOULD NOT CHANGE CARELESSLY:
// - The script load order in index.html. app.js must load
//   LAST, after utils.js, api.js, merkle.js, analytics.js,
//   and explorer.js, because it uses functions from all of them.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initDemoModeCheck();
  initSearch();
  initGasCalculator();
  initMerkleVisualizer();
  renderLearningCards();
  renderJsonRpcExamples();
});

async function initDemoModeCheck() {
  const banner = document.getElementById('demo-banner');
  const connected = await checkConnection();
  if (!connected) {
    banner.classList.remove('hidden');
    banner.textContent = 'Demo Mode — could not reach the Ethereum RPC endpoint. Live search will not work until connectivity is restored.';
  }
}

function initSearch() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) {
      showToast('Please enter an address, transaction hash, or block number.', true);
      return;
    }
    handleSearch(value);
  });
}

function initGasCalculator() {
  const gasUsedInput = document.getElementById('gas-used-input');
  const gasPriceInput = document.getElementById('gas-price-input');
  const output = document.getElementById('gas-fee-output');

  function update() {
    const result = calculateGasFee(gasUsedInput.value, gasPriceInput.value);
    if (!result) {
      output.textContent = 'Enter valid numbers above.';
      return;
    }
    output.innerHTML = `Fee: <strong>${result.feeEth} ETH</strong> (${result.feeWei} wei)`;
  }

  gasUsedInput.addEventListener('input', update);
  gasPriceInput.addEventListener('input', update);
  update();
}

function initMerkleVisualizer() {
  const form = document.getElementById('merkle-form');
  const textarea = document.getElementById('merkle-input');
  const container = document.getElementById('merkle-tree-output');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lines = textarea.value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      renderMerkleTree([], container);
      return;
    }
    container.innerHTML = '<p class="muted">Building tree...</p>';
    const levels = await buildMerkleTree(lines);
    renderMerkleTree(levels, container);
  });
}

const LEARN_TOPICS = [
  { term: 'Blockchain', explanation: 'A shared, tamper-resistant record book that many computers keep identical copies of, instead of one company controlling a single central database.' },
  { term: 'Ethereum', explanation: 'A public blockchain that runs programs ("smart contracts") in addition to just tracking payments, using its own currency, ETH.' },
  { term: 'Block', explanation: 'A batch of transactions bundled together, cryptographically linked to the block before it, forming the "chain".' },
  { term: 'Transaction', explanation: 'A single signed instruction, like "send 1 ETH from address A to address B", submitted to the network.' },
  { term: 'Ethereum Account', explanation: 'An address that can hold ETH and send transactions. Comes in two types: EOAs and smart contracts.' },
  { term: 'EOA', explanation: '"Externally Owned Account" — a normal wallet controlled by a private key (as opposed to a smart contract account).' },
  { term: 'Smart Contract', explanation: 'A program stored on the blockchain that runs automatically when called, with rules no single party can quietly change.' },
  { term: 'Gas', explanation: 'The fee paid for computational work on Ethereum. More complex transactions need more gas.' },
  { term: 'Nonce', explanation: "A counter that increases by one each time an account sends a transaction — it prevents the same transaction from being replayed twice." },
  { term: 'Hash', explanation: 'A fixed-length "fingerprint" of data. Changing even one character of the input completely changes the hash.' },
  { term: 'Merkle Tree', explanation: 'A structure that combines many hashes in pairs, layer by layer, until a single "root hash" represents all of them at once.' },
  { term: 'Merkle Patricia Trie', explanation: "Ethereum's actual data structure for storing accounts and contract data — combines a Merkle tree's hashing with a radix trie's prefix-based organization." },
  { term: 'JSON-RPC', explanation: 'The standard request/response format Ethereum nodes use to answer questions like "what is this address\'s balance?"' },
  { term: 'Ethereum Node', explanation: 'A computer running Ethereum software that stores the blockchain and answers JSON-RPC requests from apps like this one.' },
];

function renderLearningCards() {
  const grid = document.getElementById('learn-grid');
  grid.innerHTML = LEARN_TOPICS.map((topic) => `
    <div class="learn-card">
      <h4>${topic.term}</h4>
      <p>${topic.explanation}</p>
    </div>
  `).join('');
}

const RPC_EXAMPLES = [
  { method: 'eth_blockNumber', description: 'Returns the most recent block number.' },
  { method: 'eth_getBalance', description: "Returns an address's ETH balance, in wei." },
  { method: 'eth_getTransactionByHash', description: 'Returns full details of one transaction.' },
  { method: 'eth_getBlockByNumber', description: 'Returns full details of one block.' },
  { method: 'eth_getTransactionCount', description: "Returns an address's nonce (roughly, transactions sent)." },
];

function renderJsonRpcExamples() {
  const list = document.getElementById('rpc-examples-list');
  list.innerHTML = RPC_EXAMPLES.map((ex) => `
    <div class="rpc-example">
      <code>${ex.method}</code>
      <span>${ex.description}</span>
    </div>
  `).join('');
}
