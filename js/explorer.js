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
  return `<button class="copy-btn" data-copy="${value}" aria-label="Copy to clipboard">Copy</button>`;
}

async function renderAddressView(address, container) {
  try {
    const [balanceHex, txCountHex, code] = await Promise.all([
      getBalance(address),
      getTransactionCount(address),
      getCode(address),
    ]);

    const balanceEth = weiHexToEth(balanceHex, 6);
    const txCount = hexToDecimal(txCountHex);
    const isContract = code && code !== '0x';

    const analytics = buildWalletAnalyticsSummary({ balanceEth, txCount });

    // Show a shortened visual representation but keep the full
    // address visible in the code element's title attribute so
    // screen readers and tooltips can access it.
    const shortAddr = shortenHash(address, 6);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2>Wallet Overview</h2>
          ${isContract ? '<span class="badge badge-info">Smart Contract</span>' : '<span class="badge badge-neutral">Wallet (EOA)</span>'}
        </div>
        <div class="address-row">
          <code class="address-value" title="${address}">${shortAddr}</code>
          ${copyButtonHtml(address)}
        </div>
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">ETH Balance</span><span class="stat-value">${balanceEth} ETH</span></div>
          <div class="stat"><span class="stat-label">Transactions Sent</span><span class="stat-value">${txCount}</span></div>
        </div>
        <p class="muted small-note">${analytics.note}</p>
        <p class="muted small-note">Raw balance: <span class="mono">${balanceHex}</span> (wei)</p>
      </div>
    `;
  } catch (err) {
    container.innerHTML = renderError('Could not fetch address data.', err.message || 'Please try again later.');
  }
}

async function renderTransactionView(hash, container) {
  // Validate the hash locally before calling RPC
  if (!isValidTxHash(hash)) {
    container.innerHTML = renderError('Invalid transaction hash.', 'A transaction hash must be 0x followed by 64 hexadecimal characters.');
    return;
  }

  try {
    container.innerHTML = renderLoading('Fetching transaction...');

    const [tx, receipt] = await Promise.all([
      getTransactionByHash(hash),
      getTransactionReceipt(hash),
    ]);

    if (!tx) {
      container.innerHTML = renderError('Transaction not found.', 'No transaction exists with that hash on the connected chain.');
      try {
        const retryId = 'tx-retry-' + hash.slice(2,12);
        const retryWrap = document.createElement('div');
        retryWrap.style.marginTop = '10px';
        const btn = document.createElement('button');
        btn.id = retryId;
        btn.className = 'copy-btn';
        btn.textContent = 'Retry';
        retryWrap.appendChild(btn);
        container.appendChild(retryWrap);
        btn.addEventListener('click', () => handleSearch(hash));
      } catch (e) {
        /* non-fatal */
      }
      return;
    }

    let status = 'PENDING';
    let statusBadgeClass = 'badge-pending';
    if (receipt) {
      status = receipt.status === '0x1' ? 'SUCCESS' : 'FAILED';
      statusBadgeClass = receipt.status === '0x1' ? 'badge-success' : 'badge-failed';
    }

    const valueEth = weiHexToEth(tx.value, 6);
    const gasLimit = tx.gas ? hexToDecimal(tx.gas) : 'N/A';
    const gasUsed = receipt && receipt.gasUsed ? hexToDecimal(receipt.gasUsed) : null;
    const gasPriceGwei = tx.gasPrice ? weiHexToGwei(tx.gasPrice) : 'N/A';
    const blockNumber = tx.blockNumber ? hexToDecimal(tx.blockNumber) : null;
    const nonce = tx.nonce ? hexToDecimal(tx.nonce) : 'N/A';
    const txIndex = tx.transactionIndex ? hexToDecimal(tx.transactionIndex) : null;

    const explanation = explainTransaction({ from: tx.from, to: tx.to, valueEth, status, blockNumber, gasUsed });

    // Shorten for display but keep full values in title attributes
    const shortHash = shortenHash(hash, 6);
    const shortFrom = tx.from ? shortenHash(tx.from) : '';
    const shortTo = tx.to ? shortenHash(tx.to) : 'Contract Creation';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2>Transaction</h2>
          <span class="badge ${statusBadgeClass}">${status}</span>
        </div>
        <div class="address-row">
          <code class="address-value" title="${hash}">${shortHash}</code>
          ${copyButtonHtml(hash)}
        </div>

        <h3 class="section-subtitle">What happened?</h3>
        <p class="explain-text">${explanation}</p>

        <h3 class="section-subtitle">Technical Details</h3>
        <div class="detail-grid">
          <div class="detail"><span>Block</span><strong>${blockNumber ?? 'Pending'}</strong></div>
          <div class="detail"><span>From</span><strong class="mono" title="${tx.from}">${shortFrom}</strong> ${copyButtonHtml(tx.from)}</div>
          <div class="detail"><span>To</span><strong class="mono" title="${tx.to}">${shortTo}</strong> ${tx.to ? copyButtonHtml(tx.to) : ''}</div>
          <div class="detail"><span>Value</span><strong>${valueEth} ETH</strong></div>
          <div class="detail"><span>Gas Limit</span><strong>${gasLimit}</strong></div>
          <div class="detail"><span>Gas Used</span><strong>${gasUsed ?? 'Pending'}</strong></div>
          <div class="detail"><span>Gas Price</span><strong>${gasPriceGwei} Gwei</strong></div>
          <div class="detail"><span>Nonce</span><strong>${nonce}</strong></div>
          <div class="detail"><span>Tx Index</span><strong>${txIndex ?? 'Pending'}</strong></div>
          <div class="detail"><span>Type</span><strong>${tx.type ?? 'N/A'}</strong></div>
        </div>

        <h3 class="section-subtitle">Receipt</h3>
        <div class="detail-grid">
          <div class="detail"><span>Status</span><strong>${receipt ? (receipt.status === '0x1' ? 'Success (0x1)' : `Failed (${receipt.status})`) : 'Pending'}</strong></div>
          <div class="detail"><span>Gas Used</span><strong>${receipt && receipt.gasUsed ? hexToDecimal(receipt.gasUsed) : (receipt ? '0' : 'Pending')}</strong></div>
          <div class="detail"><span>Logs</span><strong>${receipt ? (receipt.logs ? receipt.logs.length : 0) : 'Pending'}</strong></div>
        </div>

        <h3 class="section-subtitle">Input Data</h3>
        <div id="${'tx-input-' + hash.slice(2,12)}" class="explain-text mono" title="${tx.input}">${tx.input && tx.input.length > 0 ? shortenHash(tx.input, 12) : 'No input data'}</div>
        <div style="margin-top:8px">
          ${tx.input && tx.input.length > 0 ? `<button id="${'tx-input-' + hash.slice(2,12) + '-toggle'}" class="copy-btn">Show full</button>` : ''}
          ${tx.input && tx.input.length > 0 ? `<button id="${'tx-input-' + hash.slice(2,12) + '-copy'}" class="copy-btn" data-copy="${tx.input}">Copy Input</button>` : ''}
        </div>
      </div>
    `;

    // Attach handlers for the Input Data controls (toggle full/short view, copy)
    try {
      const inputId = 'tx-input-' + hash.slice(2,12);
      const inputEl = container.querySelector('#' + inputId);
      const toggleBtn = container.querySelector('#' + inputId + '-toggle');
      const copyBtn = container.querySelector('#' + inputId + '-copy');
      const fullInput = tx.input || '';
      const shortInput = fullInput && fullInput.length > 0 ? shortenHash(fullInput, 12) : 'No input data';

      if (inputEl) {
        // store initial short state
        inputEl.setAttribute('data-full', '0');
      }

      if (toggleBtn && inputEl) {
        toggleBtn.addEventListener('click', () => {
          const isFull = inputEl.getAttribute('data-full') === '1';
          if (isFull) {
            inputEl.textContent = shortInput;
            inputEl.setAttribute('data-full', '0');
            toggleBtn.textContent = 'Show full';
          } else {
            inputEl.textContent = fullInput;
            inputEl.setAttribute('data-full', '1');
            toggleBtn.textContent = 'Show short';
          }
        });
      }

      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          if (fullInput) copyToClipboard(fullInput);
        });
      }
    } catch (e) {
      // non-fatal: leave UI as-is if event wiring fails
      console.warn('Input control wiring failed', e);
    }

  } catch (err) {
    container.innerHTML = renderError('Error fetching transaction.', err.message || 'Please try again later.');
    try {
      const retryId = 'tx-retry-' + hash.slice(2,12);
      const retryWrap = document.createElement('div');
      retryWrap.style.marginTop = '10px';
      const btn = document.createElement('button');
      btn.id = retryId;
      btn.className = 'copy-btn';
      btn.textContent = 'Retry';
      retryWrap.appendChild(btn);
      container.appendChild(retryWrap);
      btn.addEventListener('click', () => handleSearch(hash));
    } catch (e) {
      /* non-fatal */
    }
  }
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
  // Validate block number (only decimal numbers accepted)
  if (!isValidBlockNumber(blockNumberStr)) {
    container.innerHTML = renderError('Invalid block number.', 'Please enter a non-negative integer block number.');
    return;
  }

  try {
    container.innerHTML = renderLoading('Fetching block...');
    const block = await getBlockByNumber(blockNumberStr, true);

    if (!block) {
      container.innerHTML = renderError('Block not found.', "That block doesn't exist yet, or the number was mistyped.");
      return;
    }

    const txCount = block.transactions ? block.transactions.length : 0;
    const gasUsed = block.gasUsed ? hexToDecimal(block.gasUsed) : null;
    const gasLimit = block.gasLimit ? hexToDecimal(block.gasLimit) : null;
    const baseFee = block.baseFeePerGas ? weiHexToGwei(block.baseFeePerGas) : null;

    const txListHtml = (block.transactions || []).slice(0, 15).map((tx) => {
      const hash = typeof tx === 'string' ? tx : tx.hash;
      return `<li><a href="#" class="tx-link" data-hash="${hash}">${shortenHash(hash)}</a></li>`;
    }).join('');

    const blockHashShort = block.hash ? shortenHash(block.hash) : 'Not available';
    const parentHashShort = block.parentHash ? shortenHash(block.parentHash) : 'Not available';
    const minerShort = block.miner ? shortenHash(block.miner) : 'Not available';

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2>Block #${hexToDecimal(block.number)}</h2>
        </div>
        <div class="address-row">
          <code class="address-value" title="${block.hash || ''}">${blockHashShort}</code>
          ${block.hash ? copyButtonHtml(block.hash) : ''}
        </div>
        <div class="detail-grid">
          <div class="detail"><span>Timestamp</span><strong>${block.timestamp ? formatTimestamp(block.timestamp) : 'Not available'}</strong></div>
          <div class="detail"><span>Transactions</span><strong>${txCount}</strong></div>
          <div class="detail"><span>Parent Hash</span><strong class="mono" title="${block.parentHash || ''}">${parentHashShort}</strong> ${block.parentHash ? copyButtonHtml(block.parentHash) : ''}</div>
          <div class="detail"><span>Gas Used</span><strong>${gasUsed !== null ? gasUsed : 'Not available'}</strong></div>
          <div class="detail"><span>Gas Limit</span><strong>${gasLimit !== null ? gasLimit : 'Not available'}</strong></div>
          <div class="detail"><span>Base Fee</span><strong>${baseFee !== null ? baseFee + ' Gwei' : 'Not available'}</strong></div>
          <div class="detail"><span>Miner</span><strong class="mono" title="${block.miner || ''}">${minerShort}</strong> ${block.miner ? copyButtonHtml(block.miner) : ''}</div>
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
  } catch (err) {
    container.innerHTML = renderError('Error fetching block.', err.message || 'Please try again later.');
  }
}
