# Stellar Asset Verification Hub — Architecture

## System Overview
The Phase 1 architecture is a lightweight web prototype that combines a Node.js backend with a static frontend. It enables users to query Stellar asset metadata and compute a provisional trust score based on on-chain adoption and issuer reputation.

## Components
### 1. Web Frontend
- Single-page application served from `/public`.
- Search form for `asset_code` and `asset_issuer`.
- Displays asset metadata, trust score, issuer profile, and risk guidance.
- Uses fetch to call the backend API.

### 2. Backend API
- Built with Express and served from `server.js`.
- Fetches asset information from Horizon mainnet via Stellar Horizon asset endpoint.
- Calculates a trust score using a seeded trusted issuer registry and key metrics.
- Returns normalized JSON for frontend rendering.

### 3. Data Sources
- Stellar Horizon mainnet: authoritative asset details.
- Local issuer registry: seeded trusted issuer metadata.
- Derived scoring heuristics: adoption, supply, authorization flags.

## Data Flow
1. User enters asset code and issuer in frontend.
2. Frontend sends `GET /api/asset?code=...&issuer=...`.
3. Backend queries Horizon and extracts the first matching asset record.
4. Backend computes the trust score and risk factors.
5. Backend returns JSON to the frontend.
6. Frontend renders score, asset metrics, issuer annotations, and recommendations.

## Trust Score Model (Phase 1)
- Base score of 50.
- +20 for seed-listed trusted issuers.
- +20 for high network adoption (`num_accounts >= 1000`).
- +10 for large issued supply (`amount >= 1,000,000`).
- +5 if authorization is required.
- -10 if the asset supports clawback.
- Score clamped between 0 and 100.

## Phase 1 Constraints
- No real-time regulatory database integration.
- No advanced risk scoring from price or liquidity feeds.
- No wallet or login integration.

## Future Expansion (Phases 2-4)
- Phase 2: Integrate regulated anchor data, liquidity analytics, and cross-border payment health metrics.
  - Current progress: Phase 2 baseline analytics are implemented with an issuer registry, liquidity pool signals, and enhanced trust scoring.
- Phase 3: Add issuer reputation graph, community feedback loops, and wallet integration.
  - Current progress: Phase 3 features now include a reputation graph endpoint, wallet action links, and community feedback scoring.
- Phase 4: Support Soroban smart contract validation, ZK privacy insights, and secure governance.
  - Current progress: Phase 4 includes Soroban contract registry with audit status, ZK privacy scoring for issuers, and enhanced trust model.
