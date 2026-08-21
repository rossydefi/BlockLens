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
  initNetworkStatus();
  initGasCalculator();
  initMerkleVisualizer();
  initCopyDelegation();
  renderLearningCards();
  renderJsonRpcExamples();
    if (window.renderRpcPlayground) renderRpcPlayground();
  });

function initCopyDelegation() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.copy-btn');
    if (!btn) return;
    const value = btn.dataset && btn.dataset.copy;
    if (value !== undefined) {
      // Use the existing helper
      // show an inline confirmation near the button on success/failure
      copyToClipboard(value).then(() => {
        showInlineCopyConfirm(btn, 'Copied');
      }).catch(() => {
        showInlineCopyConfirm(btn, 'Could not copy');
      });
    }
  });
}

function showInlineCopyConfirm(button, text) {
  try {
    // remove any existing confirm next to this button
    const existing = button.parentNode.querySelector('.inline-copy-confirm');
    if (existing) existing.remove();
    const span = document.createElement('span');
    span.className = 'inline-copy-confirm';
    span.textContent = text;
    span.style.marginLeft = '8px';
    span.style.fontSize = '0.85rem';
    span.style.color = 'var(--accent-2)';
    button.parentNode.appendChild(span);
    setTimeout(() => span.remove(), 1600);
  } catch (e) {
    /* non-fatal */
  }
}

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

  // Add a small dynamic hint below the input that tells the user
  // whether their current input looks like an address, tx hash,
  // or block number so they get immediate feedback before submit.
  let hint = document.getElementById('search-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'search-hint';
    hint.className = 'search-hint muted';
    input.parentNode.insertBefore(hint, input.nextSibling);
  }

  input.addEventListener('input', () => {
    const v = input.value.trim();
    if (!v) { hint.textContent = ''; return; }
    const t = detectInputType(v);
    if (t === 'address') hint.textContent = 'Detected: Ethereum address';
    else if (t === 'tx') hint.textContent = 'Detected: Transaction hash';
    else if (t === 'block') hint.textContent = 'Detected: Block number';
    else hint.textContent = 'Not recognized — expected address, tx hash, or block number';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) {
      showToast('Please enter an address, transaction hash, or block number.', true);
      return;
    }
    // Final validation happens inside handleSearch; this avoids
    // accidental extra RPC calls here and gives immediate feedback.
    handleSearch(value);
  });
}

function initGasCalculator() {
  const gasUsedInput = document.getElementById('gas-used-input');
  const gasPriceInput = document.getElementById('gas-price-input');
  const output = document.getElementById('gas-fee-output');
  // Add a unit selector next to the gas price input
  let unitSelect = document.getElementById('gas-unit-select');
  if (!unitSelect) {
    unitSelect = document.createElement('select');
    unitSelect.id = 'gas-unit-select';
    unitSelect.innerHTML = `<option value="gwei" selected>Gwei</option><option value="wei">Wei</option><option value="eth">ETH</option>`;
    gasPriceInput.parentNode.insertBefore(unitSelect, gasPriceInput.nextSibling);
  }

  // Additional small info element to explain conversions
  let conversionInfo = document.getElementById('gas-conversion-info');
  if (!conversionInfo) {
    conversionInfo = document.createElement('div');
    conversionInfo.id = 'gas-conversion-info';
    conversionInfo.className = 'muted small-note';
    output.parentNode.insertBefore(conversionInfo, output.nextSibling);
  }

  function update() {
    const result = calculateGasFee(gasUsedInput.value, gasPriceInput.value, unitSelect.value);
    if (!result) {
      output.textContent = 'Enter valid numbers above.';
      return;
    }
    output.innerHTML = `Fee: <strong>${result.feeEth} ETH</strong> (${result.feeWei} wei)`;
    conversionInfo.textContent = `Also: ${result.feeGwei} Gwei — weiPerGas: ${result.weiPerGas}`;
  }

  gasUsedInput.addEventListener('input', update);
  gasPriceInput.addEventListener('input', update);
  unitSelect.addEventListener('change', update);
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

// ---------------------------------------------------------
// NETWORK STATUS (Dashboard card)
// Inserts a small network status card below the search form
// and keeps it up to date with a retry button.
// ---------------------------------------------------------
function initNetworkStatus() {
  const form = document.getElementById('search-form');
  if (!form) return;

  // Create container right after the search form
  const wrapper = document.createElement('div');
  wrapper.id = 'network-status-container';
  wrapper.className = 'network-status';
  form.parentNode.insertBefore(wrapper, form.nextSibling);

  async function update() {
    wrapper.innerHTML = renderLoading('Checking network connection...');
    try {
      const [chainIdHex, latestBlockHex, gasPriceHex] = await Promise.all([
        getChainId(),
        getLatestBlockNumber(),
        getGasPrice(),
      ]);

      const chainMap = {
        '0x1': 'Mainnet',
        '0x5': 'Goerli',
        '0xaa36a7': 'Sepolia',
      };

      const chainName = chainMap[chainIdHex] || (`Chain ${chainIdHex}`);
      const latestBlock = hexToDecimal(latestBlockHex);
      const gasGwei = weiHexToGwei(gasPriceHex);

      wrapper.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>Network Status</h2>
            <span class="badge badge-info">${chainName}</span>
          </div>
          <div class="stat-grid">
            <div class="stat"><span class="stat-label">Status</span><span class="stat-value">● Connected</span></div>
            <div class="stat"><span class="stat-label">Latest Block</span><span class="stat-value">${latestBlock}</span></div>
            <div class="stat"><span class="stat-label">Gas Price</span><span class="stat-value">${gasGwei} Gwei</span></div>
          </div>
          <div style="margin-top:10px"><button id="network-retry" class="copy-btn">Retry</button></div>
        </div>
      `;

      const retryBtn = document.getElementById('network-retry');
      if (retryBtn) retryBtn.addEventListener('click', update);
    } catch (err) {
      wrapper.innerHTML = renderError('Unable to reach RPC', 'Unable to connect to the configured RPC endpoint.');
      const retry = document.createElement('div');
      retry.style.marginTop = '10px';
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Retry';
      btn.addEventListener('click', update);
      wrapper.appendChild(retry);
      retry.appendChild(btn);
    }
  }

  update();
}
