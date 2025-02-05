# Visarely Punks

A generative art collection merging Victor Vasarely's optical art mastery with CryptoPunks' iconic aesthetic, featuring mathematically-derived wave patterns. Built on Base with full on-chain rendering.

## Features

- **Fully On-Chain Art**: Each NFT is generated and stored entirely on-chain
- **Deterministic Generation**: Unique compositions based on wallet address and token ID
- **USDC Integration**: Mint using USDC with funds automatically supplied to Aave
- **Governance Ready**: Built-in DAO functionality for community decisions
- **Dual Development Environment**: Supports both Hardhat and Foundry for comprehensive testing

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, shadcn/ui
- **Web3**: Wagmi v2, Viem, ConnectKit
- **Smart Contracts**: Solidity 0.8.24
- **Testing**: Hardhat & Foundry
- **Deployment**: Vercel (Frontend), Base Network (Contracts)

## Prerequisites

- Node.js 20+
- Git
- Foundry
- Hardhat

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AlvaroLuken/visarely-punks-test
cd visarely-punks
```

2. Install dependencies:
```bash
npm install
```

3. Install Foundry dependencies:
```bash
forge install
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` with your configuration:
```env
# Required for deployment
RPC_URL=                   # Your Base RPC URL
ETHERSCAN_API_KEY=        # Your Basescan API key
PRIVATE_KEY=              # Your wallet private key

# Frontend environment variables
BASE_RPC_URL=
ALCHEMY_API_KEY=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_AUSDC_ADDRESS=
NEXT_PUBLIC_AAVE_POOL_ADDRESS=
NEXT_PUBLIC_TREASURY_ADDRESS=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

## Development

### Frontend Development
```bash
npm run dev
```

### Contract Testing

Using Hardhat:
```bash
npm run test:hardhat
```

Using Foundry:
```bash
npm run test:foundry
```

Run all tests:
```bash
npm test
```

### Contract Deployment

The project supports multiple deployment methods:

#### Using Makefile (Recommended)

Check deployment configuration:
```bash
make check_visarely
```

Deploy contracts:
```bash
make deploy_visarely
```

#### Using Hardhat:
```bash
npm run deploy
```

#### Using Foundry directly:
```bash
npm run deploy:foundry
```

## Contract Architecture

```
contracts/
├── VisarelyPunks.sol      # Main NFT contract
├── VisarelyRenderer.sol    # On-chain SVG generation
├── VisarelyTreasury.sol    # USDC/Aave integration
├── VisarelyGovernor.sol    # DAO governance
└── SVGUtils.sol           # SVG generation utilities
```

### Deployment Script

The deployment script (`script/Deploy.s.sol`) handles the following:

1. Deploys VisarelyTreasury with USDC and Aave Pool integration
2. Deploys VisarelyRenderer for on-chain SVG generation
3. Deploys VisarelyPunks main contract
4. Sets up TimelockController for DAO governance
5. Logs all deployed contract addresses

Key configuration constants:
- Timelock Delay: 2 days
- USDC Address on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Aave Pool on Base: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`

## Testing

The project uses both Hardhat and Foundry for comprehensive testing:

- **Hardhat Tests**: TypeScript-based tests for complex scenarios and integration testing
- **Foundry Tests**: Solidity-based tests for fast, low-level contract testing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Victor Vasarely for the artistic inspiration
- CryptoPunks for pioneering NFT culture
- Aave protocol for DeFi integration
- Base network for the L2 infrastructure
