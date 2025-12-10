# eBook Store — Bitcoin L2 Marketplace

A decentralized ebook marketplace built on **Stacks (Bitcoin L2)** using **Clarity 4**. Authors sign and register ownership of ebooks, list them for sale, and buyers purchase through the Clarity smart contract to unlock access.

All business logic is governed on-chain and fully auditable.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Browse  │ │  Upload  │ │ Purchase │ │ Download (DRM)   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Hiro Wallet       │
                    └──────────┬──────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    Stacks Blockchain (Clarity 4)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ebook-store.clar                         │ │
│  │  • register-ebook()    • buy-ebook()                       │ │
│  │  • has-access()        • get-ebook()                       │ │
│  │  • update-price()      • deactivate-ebook()                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                         IPFS (Pinata)                            │
│  • Encrypted ebook storage                                       │
│  • Content-addressable by CID                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- ✅ **Author Onboarding**: Connect wallet, upload ebook to IPFS, register on-chain
- ✅ **Marketplace Listing**: Public read-only listing of all ebooks
- ✅ **Purchase Flow**: Direct STX transfers from buyer to author via smart contract
- ✅ **Access Control**: On-chain verification of purchase before content delivery
- ✅ **DRM Protection**: Wallet watermarking, encrypted storage, access logging
- ✅ **Clarity 4**: Uses latest Clarity features including `stacks-block-time`

## Project Structure

```
ebook-store/
├── contracts/
│   └── ebook-store.clar        # Clarity 4 smart contract
├── tests/
│   └── ebook-store.test.ts     # Clarinet SDK test suite
├── frontend/
│   ├── pages/
│   │   ├── index.tsx           # Marketplace listing
│   │   ├── upload.tsx          # Author submission
│   │   ├── ebook/[id].tsx      # Ebook detail + purchase
│   │   └── download/[id].tsx   # Gated DRM download
│   ├── components/
│   │   ├── Layout.tsx          # Navigation layout
│   │   ├── WalletConnect.tsx   # Hiro Wallet integration
│   │   └── EbookCard.tsx       # Listing card component
│   └── services/
│       ├── stacks.ts           # Blockchain service
│       └── ipfs.ts             # IPFS encryption/upload
├── scripts/
│   └── ipfs-upload.ts          # CLI for IPFS upload
├── Clarinet.toml               # Clarinet configuration
└── README.md
```

## Quick Start

### Prerequisites

- [Clarinet](https://docs.stacks.co/clarinet/overview) v3.11+
- [Node.js](https://nodejs.org/) v18+
- [Hiro Wallet](https://wallet.hiro.so/) browser extension
- [Pinata](https://pinata.cloud/) account (for IPFS)

### 1. Install Dependencies

```bash
# Smart contract dependencies
cd ebook-store
npm install

# Frontend dependencies
cd frontend
npm install
```

### 2. Run Tests

```bash
# Check contract syntax
clarinet check

# Run test suite
npm test
```

### 3. Start Local Development

```bash
# Start Clarinet devnet (in one terminal)
clarinet devnet start

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### 4. Deploy to Testnet

```bash
# Configure testnet in settings/Testnet.toml
clarinet deploy --network testnet
```

## Smart Contract API

### Public Functions

| Function | Description |
|----------|-------------|
| `register-ebook(title, description, content-hash, price)` | Register a new ebook |
| `buy-ebook(ebook-id)` | Purchase an ebook (transfers STX) |
| `update-price(ebook-id, new-price)` | Update ebook price (author only) |
| `deactivate-ebook(ebook-id)` | Deactivate ebook listing (author only) |
| `reactivate-ebook(ebook-id)` | Reactivate ebook listing (author only) |

### Read-Only Functions

| Function | Description |
|----------|-------------|
| `get-ebook(ebook-id)` | Get ebook metadata |
| `get-ebook-count()` | Get total number of ebooks |
| `has-access(buyer, ebook-id)` | Check if buyer has access |
| `is-author(ebook-id, user)` | Check if user is author |
| `get-author-ebooks(author)` | Get all ebooks by author |
| `get-buyer-ebooks(buyer)` | Get all ebooks owned by buyer |

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| u100 | ERR-NOT-AUTHORIZED | Caller not authorized |
| u101 | ERR-EBOOK-NOT-FOUND | Ebook does not exist |
| u104 | ERR-ALREADY-PURCHASED | Ebook already purchased |
| u105 | ERR-INVALID-PRICE | Price must be > 0 |
| u106 | ERR-INVALID-TITLE | Title cannot be empty |
| u107 | ERR-SELF-PURCHASE | Cannot buy own ebook |
| u108 | ERR-TRANSFER-FAILED | STX transfer failed |

## IPFS Upload Script

```bash
# Upload unencrypted file
PINATA_JWT=your-jwt npx ts-node scripts/ipfs-upload.ts mybook.pdf

# Upload with encryption
PINATA_JWT=your-jwt npx ts-node scripts/ipfs-upload.ts mybook.pdf --encrypt --wallet ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs
PINATA_JWT=your-pinata-jwt-token
```

## Security Features

### DRM Protection Options

1. **Wallet Watermarking**: Buyer's wallet address embedded on every PDF page
2. **Encrypted Storage**: AES-256-GCM encryption with key derived from wallet + ebook ID + server secret
3. **Access Logging**: Off-chain logging of wallet, ebook ID, timestamp, IP

### On-Chain Security

- All purchases verified on-chain before content delivery
- Author-only price updates and deactivation
- Duplicate purchase prevention
- Self-purchase prevention
- Safe integer math in all calculations

## Development

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/ebook-store.test.ts

# Run with coverage
npm test -- --coverage
```

### Clarinet Console

```bash
# Start interactive REPL
clarinet console

# Example commands in console
(contract-call? .ebook-store register-ebook u"My Book" u"Description" 0x0000... u1000000)
(contract-call? .ebook-store get-ebook-count)
```

## Deployment Checklist

- [ ] Update contract address in frontend config
- [ ] Configure Pinata JWT for production
- [ ] Set up SSL for frontend
- [ ] Configure CORS for API endpoints
- [ ] Set up access logging database
- [ ] Review gas optimization
- [ ] Audit smart contract
- [ ] Test on testnet before mainnet

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm test`
4. Submit a pull request

## Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language Reference](https://docs.stacks.co/reference/clarity)
- [Clarity 4 Features](https://docs.stacks.co/whats-new/clarity-4-is-now-live)
- [Clarinet SDK](https://docs.hiro.so/stacks/clarinet-js-sdk)
- [Hiro Wallet](https://wallet.hiro.so/)
