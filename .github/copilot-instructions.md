# eBook Store - Copilot Instructions

This is a decentralized ebook marketplace built on Stacks (Bitcoin L2) using Clarity 4.

## Project Overview

- **Smart Contract**: `contracts/ebook-store.clar` - Clarity 4 contract for ebook registration, purchases, and access control
- **Frontend**: `frontend/` - Next.js app with Hiro Wallet integration
- **Scripts**: `scripts/` - IPFS upload and encryption utilities
- **Tests**: `tests/` - Clarinet SDK test suite

## Key Technologies

- Clarity 4 (Stacks smart contracts)
- Clarinet v3.11+ (development environment)
- Next.js 14 (frontend)
- @stacks/connect (wallet integration)
- IPFS/Pinata (decentralized storage)
- AES-256-GCM (file encryption)

## Development Commands

```bash
# Check contract syntax
clarinet check

# Run tests
npm test

# Start devnet
clarinet devnet start

# Start frontend
cd frontend && npm run dev
```

## Contract Architecture

- **Registry**: Maps ebook ID to metadata (title, description, hash, price, author)
- **Ownership**: Maps (ebook-id, buyer) to purchase record
- **Payments**: STX transfers from buyer to author via `stx-transfer?`

## Clarity 4 Features Used

- `stacks-block-time` - Block timestamp for created-at tracking
- Standard Clarity functions with safe integer math

## Common Tasks

### Adding a new contract function
1. Add function to `contracts/ebook-store.clar`
2. Run `clarinet check` to verify syntax
3. Add tests in `tests/ebook-store.test.ts`
4. Update frontend service in `frontend/services/stacks.ts`

### Frontend development
- Components are in `frontend/components/`
- Pages follow Next.js file-based routing in `frontend/pages/`
- Blockchain interactions go through `frontend/services/stacks.ts`

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - Deployed contract address
- `NEXT_PUBLIC_NETWORK` - devnet/testnet/mainnet
- `PINATA_JWT` - For IPFS uploads
