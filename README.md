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

4. Create a `.env` file:
```env
# RPC URLs
BASE_RPC_URL=
ALCHEMY_API_KEY=

# Deployment
PRIVATE_KEY=
ETHERSCAN_API_KEY=

# Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
NEXT_PUBLIC_AUSDC_ADDRESS=
NEXT_PUBLIC_AAVE_POOL_ADDRESS=
NEXT_PUBLIC_TREASURY_ADDRESS=

# Web3
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

Using Hardhat:
```bash
npm run deploy
```

Using Foundry:
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
