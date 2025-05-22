Blockchain Message App

A full-stack DApp that lets users send and update a message on the Ethereum blockchain and interact with an AI assistant. Built with a Next.js frontend, a Koa backend (with OpenAI integration), and a Solidity smart contract deployed via Hardhat.



Table of Contents
1. [Project Structure](project-structure)
2. [Installation](installation)
3. [Usage](usage)
4. [Features](features)
5. [Configuration](configuration)
6. [MetaMask & Local Network Setup](metamask--local-network-setup)



Project Structure

- `/frontend` — Next.js React UI for interacting with the blockchain and AI
- `/backend` — Koa server providing AI chat and conversation logging
- `/smartcontract` — Solidity smart contract, deployment scripts, and Hardhat config



Installation

Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- [MetaMask browser extension](https://metamask.io/)

1. Clone the repository

git clone <repo-url>
cd lab2


2. Install dependencies
Backend

cd backend
npm install

Frontend

cd ../frontend
npm install

Smart Contract

cd ../smartcontract
npm install


3. Start the local Ethereum network (Hardhat)

cd smartcontract
npx hardhat node


4. Deploy the smart contract
In a new terminal:

cd smartcontract
npx hardhat run scripts/deploy.ts --network localhost

Change the deployed contract address (default: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`) in `pages/index.tsx`.

5. Start the backend server

cd ../backend
node index.js


6. Start the frontend

cd ../frontend
npm run dev




Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Connect your MetaMask wallet (ensure it's set to the Localhost 8545 network).
3. Enter and send messages to update the blockchain contract and interact with the AI.
4. View conversation history and the current blockchain message in the UI.



Features
- Connect MetaMask wallet and interact with a smart contract
- Set and retrieve a message stored on-chain
- AI assistant powered by OpenAI for natural language responses
- Conversation history logging via backend
- Gas estimation and error handling for transactions
- Responsive and modern UI



Configuration

- **Backend**: Set your OpenAI-compatible API key and endpoint in `index.js`.
- **Frontend**: Update the contract address in `pages/index.tsx` if your deployment address differs.
- **Smart Contract**: Edit `contracts/Message.sol` for contract logic.



MetaMask & Local Network Setup

1. **Start Hardhat local node**: `npx hardhat node` (runs on `http://localhost:8545`)
2. **Add Localhost 8545 network to MetaMask**:
   - Network Name: Localhost 8545
   - New RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. **Import an account**: Use one of the private keys output by Hardhat in your MetaMask wallet for testing.
4. **Deploy contract**: `npx hardhat run scripts/deploy.ts --network localhost`
5. **Update frontend contract address**: If the deployed address is different, update it in `pages/index.tsx`.



Example

- Sending a message:
  1. Connect wallet
  2. Enter a new message
  3. Click "Send Message"
  4. Confirm transaction in MetaMask
  5. See the updated blockchain message and AI response
