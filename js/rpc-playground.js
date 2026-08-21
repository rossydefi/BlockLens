// ============================================================
// RPC-PLAYGROUND.JS — Interactive JSON-RPC playground
// ============================================================
// Renders a small playground into the #rpc-examples-list container
// that allows selecting common methods, editing params, previewing
// the request, executing it, and viewing the response.
//
// This reuses the existing `callRpcMethod()` function in api.js
// and the `copyToClipboard()` helper in utils.js.
// ============================================================

const RPC_PLAYGROUND_METHODS = [
  { method: 'eth_blockNumber', desc: 'Returns the most recent block number.', params: '[]' },
  { method: 'eth_chainId', desc: 'Returns the chain id.', params: '[]' },
  { method: 'eth_gasPrice', desc: 'Returns the current gas price.', params: '[]' },
  { method: 'eth_getBalance', desc: "Returns an address's ETH balance (wei).", params: '["0x0000000000000000000000000000000000000000", "latest"]' },
  { method: 'eth_getTransactionCount', desc: "Returns an address's nonce.", params: '["0x0000000000000000000000000000000000000000", "latest"]' },
  { method: 'eth_getBlockByNumber', desc: 'Returns block details by number.', params: '["0x10d4f", true]' },
  { method: 'eth_getTransactionByHash', desc: 'Get a transaction by hash.', params: '["0x..."]' },
];

function renderRpcPlayground() {
  const container = document.getElementById('rpc-examples-list');
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h2>JSON-RPC Playground</h2></div>
      <div class="rpc-playground">
        <label>Method
          <select id="rpc-method-select"></select>
        </label>
        <label>Params (JSON array)
          <textarea id="rpc-params" rows="3"></textarea>
        </label>
        <div class="rpc-controls">
          <button id="rpc-preview" class="copy-btn">Preview Request</button>
          <button id="rpc-send" class="copy-btn">Send Request</button>
          <button id="rpc-clear" class="copy-btn">Clear Response</button>
        </div>

        <h3 class="section-subtitle">Request</h3>
        <pre id="rpc-request" class="mono"></pre>
        <div style="margin-top:6px">
          <button id="rpc-copy-request" class="copy-btn">Copy Request</button>
        </div>

        <h3 class="section-subtitle">Response</h3>
        <pre id="rpc-response" class="mono">(no response yet)</pre>
        <div style="margin-top:6px">
          <button id="rpc-copy-response" class="copy-btn">Copy Response</button>
        </div>
      </div>
    </div>
  `;

  const methodSelect = document.getElementById('rpc-method-select');
  const paramsInput = document.getElementById('rpc-params');
  const requestPre = document.getElementById('rpc-request');
  const responsePre = document.getElementById('rpc-response');

  RPC_PLAYGROUND_METHODS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.method;
    opt.textContent = `${m.method} — ${m.desc}`;
    opt.dataset.example = m.params;
    methodSelect.appendChild(opt);
  });

  methodSelect.addEventListener('change', () => {
    const sel = methodSelect.selectedOptions[0];
    paramsInput.value = sel ? sel.dataset.example : '[]';
    previewRequest();
  });

  document.getElementById('rpc-preview').addEventListener('click', previewRequest);
  document.getElementById('rpc-send').addEventListener('click', sendRequest);
  document.getElementById('rpc-clear').addEventListener('click', () => { responsePre.textContent = '(no response yet)'; });
  document.getElementById('rpc-copy-request').addEventListener('click', () => copyToClipboard(requestPre.textContent));
  document.getElementById('rpc-copy-response').addEventListener('click', () => copyToClipboard(responsePre.textContent));

  // Initialize with first method example
  methodSelect.selectedIndex = 0;
  paramsInput.value = methodSelect.selectedOptions[0].dataset.example || '[]';
  previewRequest();

  function previewRequest() {
    const method = methodSelect.value;
    let params = [];
    try {
      params = JSON.parse(paramsInput.value || '[]');
    } catch (e) {
      requestPre.textContent = 'Invalid JSON in params.';
      return;
    }
    const req = { jsonrpc: '2.0', id: 1, method, params };
    requestPre.textContent = JSON.stringify(req, null, 2);
  }

  async function sendRequest() {
    const method = methodSelect.value;
    let params = [];
    try {
      params = JSON.parse(paramsInput.value || '[]');
    } catch (e) {
      responsePre.textContent = 'Invalid JSON in params.';
      return;
    }

    requestPre.textContent = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }, null, 2);
    responsePre.textContent = 'Sending request...';

    try {
      const result = await callRpcMethod(method, params);
      responsePre.textContent = JSON.stringify({ result }, null, 2);
    } catch (err) {
      responsePre.textContent = JSON.stringify({ error: err.message || String(err) }, null, 2);
    }
  }
}

// expose for app.js to call if available
window.renderRpcPlayground = renderRpcPlayground;
