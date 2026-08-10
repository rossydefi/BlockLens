// ============================================================
// EXPLORER.JS — Search handling + rendering wallet/tx/block views
// ============================================================

async function handleSearch(rawInput) {
  const resultsEl = document.getElementById('results');
  const type = detectInputType(rawInput);

  if (type === 'invalid') {
    resultsEl.innerHTML = renderError(
      'We could not recognize that input.',
      'Please enter a valid Ethereum address (0x + 40 characters), a transaction hash (0x + 64 characters), or a block number.'
    );
    return;
  }

  resultsEl.innerHTML = renderLoading('Fetching blockchain data...');

  try {
    if (type === 'address') {
      await renderAddressView(rawInput.trim(), resultsEl);
    } else if (type === 'tx') {
      await renderTransactionView(rawInput.trim(), resultsEl);
    } else if (type === 'block') {
      await renderBlockView(rawInput.trim(), resultsEl);
    }
  } catch (err) {
    resultsEl.innerHTML = renderError(
      'Something went wrong fetching that data.',
      err.message || 'Please try again in a moment.'
    );
  }
}

function renderLoading(message) {
  return `<div class="card loading-card"><div class="spinner"></div><p>${message}</p></div>`;
}

function renderError(title, message) {
  return `<div class="card error-card"><h3>${title}</h3><p>${message}</p></div>`;
}

function copyButtonHtml(value) {
  return `<button class="copy-btn" onclick="copyToClipboard('${value}')" aria-label="Copy to clipboard">Copy</button>`;
}

async function renderAddressView(address, container) {
  const [balanceHex, txCountHex, code] = await Promise.all([
    getBalance(address),
    getTransactionCount(address),
    getCode(address),
  ]);

  const balanceEth = weiHexToEth(balanceHex, 6);
  const txCount = hexToDecimal(txCountHex);
  const isContract = code && code !== '0x';

  const analytics = buildWalletAnalyticsSummary({ balanceEth, txCount });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Wallet Overview</h2>
        ${isContract ? '<span class="badge badge-info">Smart Contract</span>' : '<span class="badge badge-neutral">Wallet (EOA)</span>'}
      </div>
      <div class="address-row">
        <code class="address-value">${address}</code>
        ${copyButtonHtml(address)}
      </div>
      <div class="stat-grid">
        <div class="stat"><span class="stat-label">ETH Balance</span><span class="stat-value">${balanceEth} ETH</span></div>
        <div class="stat"><span class="stat-label">Transactions Sent</span><span class="stat-value">${txCount}</span></div>
      </div>
      <p class="muted small-note">${analytics.note}</p>
    </div>
  `;
}

async function renderTransactionView(hash, container) {
  const [tx, receipt] = await Promise.all([
    getTransactionByHash(hash),
    getTransactionReceipt(hash),
  ]);

  if (!tx) {
    container.innerHTML = renderError('Transaction not found.', 'Please double-check the transaction hash and try again.');
    return;
  }

  let status = 'PENDING';
  let statusBadgeClass = 'badge-pending';
  if (receipt) {
    status = receipt.status === '0x1' ? 'SUCCESS' : 'FAILED';
    statusBadgeClass = receipt.status === '0x1' ? 'badge-success' : 'badge-failed';
  }

  const valueEth = weiHexToEth(tx.value, 6);
  const gasLimit = hexToDecimal(tx.gas);
  const gasUsed = receipt ? hexToDecimal(receipt.gasUsed) : null;
  const gasPriceGwei = weiHexToGwei(tx.gasPrice);
  const blockNumber = tx.blockNumber ? hexToDecimal(tx.blockNumber) : null;
  const nonce = hexToDecimal(tx.nonce);
  const txIndex = tx.transactionIndex ? hexToDecimal(tx.transactionIndex) : null;

  const explanation = explainTransaction({ from: tx.from, to: tx.to, valueEth, status, blockNumber, gasUsed });

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Transaction</h2>
        <span class="badge ${statusBadgeClass}">${status}</span>
      </div>
      <div class="address-row">
        <code class="address-value">${hash}</code>
        ${copyButtonHtml(hash)}
      </div>

      <h3 class="section-subtitle">What happened?</h3>
      <p class="explain-text">${explanation}</p>

      <h3 class="section-subtitle">Technical Details</h3>
      <div class="detail-grid">
        <div class="detail"><span>Block</span><strong>${blockNumber ?? 'Pending'}</strong></div>
        <div class="detail"><span>From</span><strong class="mono">${shortenHash(tx.from)}</strong></div>
        <div class="detail"><span>To</span><strong class="mono">${tx.to ? shortenHash(tx.to) : 'Contract Creation'}</strong></div>
        <div class="detail"><span>Value</span><strong>${valueEth} ETH</strong></div>
        <div class="detail"><span>Gas Limit</span><strong>${gasLimit}</strong></div>
        <div class="detail"><span>Gas Used</span><strong>${gasUsed ?? 'Pending'}</strong></div>
        <div class="detail"><span>Gas Price</span><strong>${gasPriceGwei} Gwei</strong></div>
        <div class="detail"><span>Nonce</span><strong>${nonce}</strong></div>
        <div class="detail"><span>Tx Index</span><strong>${txIndex ?? 'Pending'}</strong></div>
        <div class="detail"><span>Type</span><strong>${tx.type ?? 'N/A'}</strong></div>
      </div>
    </div>
  `;
}

function explainTransaction({ from, to, valueEth, status, blockNumber, gasUsed }) {
  const sender = shortenHash(from);
  const receiver = to ? shortenHash(to) : 'a new smart contract it created';
  const statusPhrase =
    status === 'SUCCESS' ? 'This transaction completed successfully.' :
    status === 'FAILED' ? 'This transaction was included in a block but FAILED to execute.' :
    'This transaction has been submitted and is waiting to be included in a block.';

  const valuePhrase = Number(valueEth) > 0
    ? `sent ${valueEth} ETH to`
    : 'interacted with';

  const blockPhrase = blockNumber
    ? `It was included in block #${blockNumber}${gasUsed ? `, using ${gasUsed} units of gas` : ''}.`
    : "It hasn't been included in a block yet.";

  return `Address ${sender} ${valuePhrase} ${receiver}. ${blockPhrase} ${statusPhrase}`;
}

async function renderBlockView(blockNumberStr, container) {
  const block = await getBlockByNumber(blockNumberStr, true);

  if (!block) {
    container.innerHTML = renderError('Block not found.', "That block doesn't exist yet, or the number was mistyped.");
    return;
  }

  const txCount = block.transactions ? block.transactions.length : 0;
  const gasUsed = hexToDecimal(block.gasUsed);
  const gasLimit = hexToDecimal(block.gasLimit);
  const baseFee = block.baseFeePerGas ? weiHexToGwei(block.baseFeePerGas) : null;

  const txListHtml = (block.transactions || []).slice(0, 15).map((tx) => {
    const hash = typeof tx === 'string' ? tx : tx.hash;
    return `<li><a href="#" class="tx-link" data-hash="${hash}">${shortenHash(hash)}</a></li>`;
  }).join('');

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Block #${hexToDecimal(block.number)}</h2>
      </div>
      <div class="address-row">
        <code class="address-value">${block.hash}</code>
        ${copyButtonHtml(block.hash)}
      </div>
      <div class="detail-grid">
        <div class="detail"><span>Timestamp</span><strong>${formatTimestamp(block.timestamp)}</strong></div>
        <div class="detail"><span>Transactions</span><strong>${txCount}</strong></div>
        <div class="detail"><span>Parent Hash</span><strong class="mono">${shortenHash(block.parentHash)}</strong></div>
        <div class="detail"><span>Gas Used</span><strong>${gasUsed}</strong></div>
        <div class="detail"><span>Gas Limit</span><strong>${gasLimit}</strong></div>
        <div class="detail"><span>Base Fee</span><strong>${baseFee ? baseFee + ' Gwei' : 'N/A'}</strong></div>
        <div class="detail"><span>Miner</span><strong class="mono">${shortenHash(block.miner)}</strong></div>
      </div>
      ${txCount > 0 ? `<h3 class="section-subtitle">Transactions (first 15)</h3><ul class="tx-hash-list">${txListHtml}</ul>` : ''}
    </div>
  `;

  container.querySelectorAll('.tx-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const hash = link.getAttribute('data-hash');
      document.getElementById('search-input').value = hash;
      handleSearch(hash);
      window.scrollTo({ top: document.getElementById('results').offsetTop - 80, behavior: 'smooth' });
    });
  });
}
