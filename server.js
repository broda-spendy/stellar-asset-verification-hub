import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'stellar-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;
const horizon = new Server('https://horizon.stellar.org');

const trustedIssuers = {
  'GCFX4XD2UE5TX4CFU4YLPCKCNE3E6VBCOQY2R7IYN7K5YGCW3GGZXW36': {
    name: 'Stellar Anchor Network',
    category: 'Anchor',
    note: 'Known regulated anchor with broad Stellar network support.'
  },
  'GBSTRUSD7IRX73KZ2EUE4NLKXSAK3G4TFU5INWF6V3AQ5F2HNMNGF7K6': {
    name: 'USD Stablecoin Issuer',
    category: 'Stablecoin',
    note: 'High-volume USD-pegged issuance with transparent reserves.'
  }
};

function computeTrustScore(metrics, issuer) {
  let score = 50;
  const factors = [];

  if (trustedIssuers[issuer]) {
    score += 20;
    factors.push('Issuer matched known trusted registry.');
  }

  if (metrics.num_accounts >= 1000) {
    score += 20;
    factors.push('Wide distribution on Stellar network.');
  } else if (metrics.num_accounts >= 100) {
    score += 10;
    factors.push('Moderate network adoption.');
  } else {
    factors.push('Low on-chain adoption; proceed with caution.');
  }

  if (metrics.amount >= 1000000) {
    score += 10;
    factors.push('High total issued supply indicates liquidity.');
  } else if (metrics.amount >= 100000) {
    score += 5;
    factors.push('Moderate issued supply.');
  }

  if (metrics.flags.authorized) {
    score += 5;
    factors.push('Asset requires authorization, increasing issuer control.');
  }

  if (metrics.flags.clawback) {
    score -= 10;
    factors.push('Asset supports clawback; assess issuer governance policy.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    factors
  };
}

function normalizeAmount(amount) {
  return Number(amount || 0);
}

app.use(express.static(join(__dirname, 'public')));

app.get('/api/asset', async (req, res) => {
  const assetCode = String(req.query.code || '').trim().toUpperCase();
  const issuer = String(req.query.issuer || '').trim();

  if (!assetCode || !issuer) {
    return res.status(400).json({ error: 'Missing asset code or issuer.' });
  }

  try {
    const response = await fetch(
      `https://horizon.stellar.org/assets?asset_code=${encodeURIComponent(assetCode)}&asset_issuer=${encodeURIComponent(issuer)}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Horizon request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const record = payload._embedded?.records?.[0];

    if (!record) {
      return res.status(404).json({ error: 'Asset not found on Stellar mainnet.' });
    }

    const metrics = {
      asset_code: record.asset_code,
      asset_issuer: record.asset_issuer,
      num_accounts: record.num_accounts,
      amount: normalizeAmount(record.amount),
      paging_token: record.paging_token,
      flags: record.flags || {}
    };

    const issuerProfile = trustedIssuers[issuer] || null;
    const trust = computeTrustScore(metrics, issuer);

    return res.json({
      asset: metrics,
      issuer_profile: issuerProfile,
      trust_score: trust.score,
      trust_factors: trust.factors,
      recommendations: [
        'Verify issuer domain and anchor history.',
        'Compare price feeds and liquidity before adding trustline.',
        'Use asset code and issuer fingerprint to avoid lookalikes.'
      ]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to retrieve asset data.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Stellar Asset Verification Hub running at http://localhost:${PORT}`);
});
