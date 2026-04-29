# Stellar Asset Verification Hub

Phase 1 prototype of a Stellar asset reputation portal.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run locally:
   ```bash
   npm start
   ```
3. Open `http://localhost:4000` in your browser.

## What this prototype includes

- `server.js`: Express backend with Stellar Horizon asset lookup
- `public/`: frontend for asset search and trust score display
- `PRD.md` and `architecture.md`: project documentation for Phase 1

## Example API Usage

Query a Stellar asset by code and issuer:

```bash
curl "http://localhost:4000/api/asset?code=USDC&issuer=GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ"
```

## Notes

This prototype now includes a baseline Phase 2 implementation with issuer registry scoring and liquidity analytics. Future phases will add more regulated datasets, wallet integration, and Soroban/ZK verification.
