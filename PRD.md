# Stellar Asset Verification Hub — Product Requirements Document

## Overview
The Stellar Asset Verification Hub is a reputation portal for Stellar-issued assets. It helps investors, anchors, and wallets assess token credibility by combining on-chain asset metadata with issuer reputation, liquidity signals, and risk annotations.

## Problem Statement
The Stellar network exceeds 180,000 issued assets in 2026. Users struggle to distinguish legitimate tokens from low-quality or fraudulent issuances. Without a trusted verification layer, wallets and dApps risk listing risky assets, and end users may trust the wrong issuers.

## Objectives
- Prototype an early verification portal for Stellar assets.
- Provide a searchable trust score and risk summary for any `asset_code` + `asset_issuer` pair.
- Enable quick decisions for wallets, anchors, and compliance reviewers.

## Phase 1 Scope
- Build a minimal backend API to fetch Stellar asset data from Horizon mainnet.
- Introduce a basic trust scoring model using on-chain adoption metrics and a seeded trusted issuer registry.
- Create a lightweight browser UI for asset lookup, score display, and risk guidance.
- Document architecture and future expansion phases.

## Success Criteria for Phase 1
- A working local prototype that returns asset details and a computed trust score.
- A browser interface that allows users to search by asset code and issuer.
- Clear documentation in `PRD.md` and `architecture.md`.
- GitHub issues created for subsequent phases.

## Non-Goals for Phase 1
- Full regulatory integration or live compliance dataset ingestion.
- Soroban on-chain verification or ZK privacy features.
- Incentive scoring, points, or financial rewards management.

## Requirements
### Functional
- Search by `asset_code` and `asset_issuer`.
- Display Stellar Horizon asset metadata.
- Calculate a trust score from issuer registry and adoption metrics.
- Show risk factors and action recommendations.

### Technical
- Use Stellar Horizon mainnet as the source of truth.
- Ship a self-contained Node/Express backend with a static frontend.
- Keep the initial implementation lightweight and easy to extend.

## Phase 1 Deliverables
- `server.js` backend service.
- `public/index.html`, `public/app.js`, `public/styles.css` frontend.
- `PRD.md` and `architecture.md` documentation.
- GitHub issues representing Phase 2 and beyond.

## Phase 2 Progress
- Added a regulated issuer registry with risk annotations.
- Introduced liquidity analytics from Horizon asset metadata.
- Expanded the trust score model to include liquidity pools and regulatory flags.
