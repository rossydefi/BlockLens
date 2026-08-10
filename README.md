# BlockLens

**Making blockchain data understandable.**

BlockLens is an interactive Ethereum blockchain explorer and learning
dashboard, built with plain HTML, CSS, and vanilla JavaScript — no
frameworks. It lets anyone search a wallet address, transaction hash,
or block number on the Sepolia test network and see the result
explained in plain English, not just raw technical fields.

## Problem

Blockchain explorers like Etherscan are powerful but intimidating —
they present raw technical data (hex-encoded values, gas fields, nonces)
with no explanation for people who are new to Ethereum.

## Solution

BlockLens fetches the exact same underlying data via Ethereum's
JSON-RPC API, but adds a "What happened?" plain-English explanation
next to every transaction, plus a built-in "Learn Ethereum" glossary,
a live gas fee calculator, and a Merkle tree visualizer — turning the
explorer into a teaching tool as much as a lookup tool.

## Features

- Universal search that auto-detects addresses, transaction hashes, and block numbers
- Wallet overview: ETH balance, transaction count, contract detection
- Transaction details with a plain-English "What happened?" summary and full technical details
- Block details with a clickable transaction list
- Live gas fee calculator (Gas Used × Gas Price, in ETH and Wei)
- Merkle Tree visualizer showing how hashes combine into a root hash
- "Learn Ethereum" glossary of 14 core concepts
- JSON-RPC methods reference showing exactly how the app talks to Ethereum
- Demo Mode banner if the RPC endpoint can't be reached
- Fully responsive, dark-mode Web3-style design

## Technologies

- HTML5
- CSS3 (no framework — custom responsive design)
- Vanilla JavaScript (ES6+): async/await, BigInt, fetch, Web Crypto API
- Ethereum JSON-RPC (via a public Sepolia testnet endpoint)
- Git / GitHub

## How It Works

\`\`\`text
index.html
   |
   v
js/app.js        <- wires up the page, runs on load
   |
   +--> js/explorer.js   <- search logic + rendering wallet/tx/block views
   |         |
   |         v
   +--> js/api.js        <- sends JSON-RPC requests to an Ethereum node
   |
   +--> js/analytics.js  <- gas fee calculator + wallet analytics summary
   |
   +--> js/merkle.js     <- Merkle tree builder + visual renderer
   |
   +--> js/utils.js      <- shared helpers (formatting, validation, toasts)
\`\`\`

Every blockchain fact on the page comes from a JSON-RPC request sent
from \`js/api.js\` directly to a public Ethereum node — there is no
backend server. See the "JSON-RPC" section on the page itself for the
exact methods used.

## Project Structure

\`\`\`text
BlockLens/
├── index.html          Page structure and all section markup
├── css/style.css        All styling (dark theme, responsive, glassmorphism)
├── js/utils.js           Formatting, validation, clipboard, toast helpers
├── js/api.js             JSON-RPC communication with Ethereum
├── js/merkle.js          Merkle tree building + rendering
├── js/analytics.js       Gas fee math + wallet analytics summary
├── js/explorer.js        Search handling + wallet/tx/block view rendering
└── js/app.js             Entry point — wires everything together on load
\`\`\`

## How To Run Locally

Browsers block JavaScript's \`fetch()\` from working correctly when a
page is opened directly as a file (\`file://...\`) rather than served
over \`http://\`, so BlockLens needs to be run through a simple local
server — not double-clicked.

If you have Python installed (most Linux systems do):

\`\`\`bash
cd BlockLens
python3 -m http.server 8000
\`\`\`

Then open your browser to:

\`\`\`text
http://localhost:8000
\`\`\`

Press Ctrl+C in the terminal to stop the server when you're done.

## How To Configure Your Own Ethereum RPC

By default, BlockLens uses a free public Sepolia endpoint. To use your
own (e.g. from Infura or Alchemy), open \`js/api.js\` and change the
\`RPC_URL\` constant near the top of the file.

## Future Improvements

- MetaMask wallet connection
- Smart contract read/write interaction via ABI
- Multi-chain support (Mainnet, Polygon, etc.)
- Full incoming/outgoing transaction history via a blockchain indexer (Etherscan API / The Graph)
- ENS name resolution
- ERC-20 token balance tracking
- Charts for wallet activity over time

## Screenshots

_(Add screenshots here once the project is running — a homepage view,
a transaction detail view, and the Merkle visualizer make good ones.)_

## Author

Your Name — [Your GitHub profile link here]

## Contributing

This is a personal learning/portfolio project, but suggestions and
pull requests are welcome via GitHub Issues.
