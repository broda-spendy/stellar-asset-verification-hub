import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'stellar-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;
const horizon = new Server('https://horizon.stellar.org');

const issuerRegistry = {
  'GCFX4XD2UE5TX4CFU4YLPCKCNE3E6VBCOQY2R7IYN7K5YGCW3GGZXW36': {
    name: 'Stellar Anchor Network',
    category: 'Anchor',
    regulation: 'regulated',
    note: 'Known regulated anchor with broad Stellar network support.'
  },
  'GBSTRUSD7IRX73KZ2EUE4NLKXSAK3G4TFU5INWF6V3AQ5F2HNMNGF7K6': {
    name: 'USD Stablecoin Issuer',
    category: 'Stablecoin',
    regulation: 'regulated',
    note: 'High-volume USD-pegged issuance with transparent reserves.'
  },
  'GDUKMGUGDZQK6YHNDYH6EH3EV4OTDA5KXKDJGRV2W2N5OH5YOJIR7OHP': {
    name: 'RWA Asset Anchor',
    category: 'RWA',
    regulation: 'regulated',
    note: 'Example regulated issuer focused on real-world asset tokenization.'
  }
};

const issuerGraph = {
  'GCFX4XD2UE5TX4CFU4YLPCKCNE3E6VBCOQY2R7IYN7K5YGCW3GGZXW36': {
    edges: [
      { issuer: 'GBSTRUSD7IRX73KZ2EUE4NLKXSAK3G4TFU5INWF6V3AQ5F2HNMNGF7K6', relation: 'partner', trust: 'high' },
      { issuer: 'GDUKMGUGDZQK6YHNDYH6EH3EV4OTDA5KXKDJGRV2W2N5OH5YOJIR7OHP', relation: 'rwa-partner', trust: 'high' }
    ],
    note: 'Connected to multiple regulated anchors and real-world asset issuers.'
  },
  'GBSTRUSD7IRX73KZ2EUE4NLKXSAK3G4TFU5INWF6V3AQ5F2HNMNGF7K6': {
    edges: [
      { issuer: 'GCFX4XD2UE5TX4CFU4YLPCKCNE3E6VBCOQY2R7IYN7K5YGCW3GGZXW36', relation: 'anchor-network', trust: 'high' }
    ],
    note: 'Popular USD stablecoin issuer associated with anchor networks.'
  }
};

const feedbackStore = {};

const sorobanContractRegistry = {
  'CBHRVWNVP4GRFB2XPDZXUHPIBZF7KJQDBSFJZ54QYJVV34SR3A5RJAWP': {
    name: 'Stellar Asset Bridge Contract',
    audit_status: 'audited',
    version: '1.0',
    note: 'Audited Soroban contract for cross-chain asset verification.'
  },
  'CBQMFUHVN2P3ZXKRJVNVPFB4GRFB2XPDZXUHPIBZF7KJQDBSFJZ54QY': {
    name: 'RWA Tokenization Contract',
    audit_status: 'audited',
    version: '1.1',
    note: 'Contract supporting real-world asset tokenization with governance rules.'
  }
};

const zkPrivacyRegistry = {
  'GA24LJXFG73JGARIBG2GP6V5TNUUOS6BD23KOFCW3INLDY5KPKS7GACZ': {
    supports_privacy: false,
    zk_proof_capability: false,
    privacy_score: 20
  },
  'GBSTRUSD7IRX73KZ2EUE4NLKXSAK3G4TFU5INWF6V3AQ5F2HNMNGF7K6': {
    supports_privacy: false,
    zk_proof_capability: false,
    privacy_score: 20
  }
};

function computeFeedbackSummary(issuer) {
  const feedbackItems = feedbackStore[issuer] || [];
  if (!feedbackItems.length) {
    return { count: 0, average_rating: 0, comments: [] };
  }

  const total = feedbackItems.reduce((sum, item) => sum + item.rating, 0);
  const averageRating = total / feedbackItems.length;

  return {
    count: feedbackItems.length,
    average_rating: Number(averageRating.toFixed(1)),
    comments: [...feedbackItems].sort((a, b) => b.timestamp - a.timestamp)
  };
}

function computeTrustScore(metrics, issuer) {
  let score = 50;
  const factors = [];
  const issuerProfile = issuerRegistry[issuer];

  if (issuerProfile) {
    score += 20;
    factors.push(`Issuer recognized as ${issuerProfile.category} in the trusted registry.`);
    if (issuerProfile.regulation === 'regulated') {
      score += 10;
      factors.push('Issuer is flagged as regulated.');
    }
  }

  if (metrics.num_accounts >= 1000) {
    score += 15;
    factors.push('Wide distribution on Stellar network.');
  } else if (metrics.num_accounts >= 100) {
    score += 8;
    factors.push('Moderate network adoption.');
  } else {
    factors.push('Low on-chain adoption; proceed with caution.');
  }

  if (metrics.total_supply >= 100000000) {
    score += 15;
    factors.push('Very large supply indicates strong market presence.');
  } else if (metrics.total_supply >= 1000000) {
    score += 10;
    factors.push('High supply supports liquidity.');
  } else if (metrics.total_supply >= 100000) {
    score += 5;
    factors.push('Moderate supply level detected.');
  }

  if (metrics.num_liquidity_pools >= 2) {
    score += 10;
    factors.push('Multiple liquidity pools provide market depth.');
  } else if (metrics.num_liquidity_pools === 1) {
    score += 5;
    factors.push('Single liquidity pool present.');
  } else {
    factors.push('No liquidity pool support detected.');
  }

  if (metrics.liquidity_amount >= 1000000) {
    score += 8;
    factors.push('Strong liquidity pool capital is available.');
  }

  if (metrics.flags.auth_required) {
    score += 5;
    factors.push('Authorization required: stronger issuer control and compliance.');
  }

  if (metrics.flags.auth_clawback_enabled) {
    score -= 15;
    factors.push('Clawback enabled: higher counterparty governance risk.');
  }

  if (metrics.flags.auth_revocable) {
    score -= 5;
    factors.push('Revocable authorization may increase update risk.');
  }

  if (metrics.num_claimable_balances > 100) {
    score -= 5;
    factors.push('High claimable balance count may reflect pending settlement exposure.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    factors
  };
}

function normalizeAmount(amount) {
  if (typeof amount === 'string') {
    return Number(amount.replace(/,/g, '')) || 0;
  }
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

    const accountSummary = record.accounts || {};
    const totalAccounts = (accountSummary.authorized || 0)
      + (accountSummary.authorized_to_maintain_liabilities || 0)
      + (accountSummary.unauthorized || 0);
    const balances = record.balances || {};
    const authorizedBalance = normalizeAmount(balances.authorized);
    const authorizedToMaintain = normalizeAmount(balances.authorized_to_maintain_liabilities);
    const unauthorizedBalance = normalizeAmount(balances.unauthorized);
    const totalSupply = authorizedBalance + authorizedToMaintain + unauthorizedBalance;
    const liquidityAmount = normalizeAmount(record.liquidity_pools_amount);

    const metrics = {
      asset_code: record.asset_code,
      asset_issuer: record.asset_issuer,
      num_accounts: totalAccounts,
      amount: totalSupply,
      total_supply: totalSupply,
      authorized_supply: authorizedBalance,
      liquidity_amount: liquidityAmount,
      num_liquidity_pools: record.num_liquidity_pools || 0,
      num_claimable_balances: record.num_claimable_balances || 0,
      num_contracts: record.num_contracts || 0,
      contracts: [],
      paging_token: record.paging_token,
      flags: record.flags || {}
    };

    const issuerProfile = issuerRegistry[issuer] || null;
    const trust = computeTrustScore(metrics, issuer);
    const reputationGraph = issuerGraph[issuer] || { edges: [], note: 'No reputation relationships found.' };
    const feedback = computeFeedbackSummary(issuer);
    const walletActionUrl = `https://stellarterm.com/#asset/${encodeURIComponent(metrics.asset_code)}-${encodeURIComponent(metrics.asset_issuer)}`;
    const zkPrivacy = zkPrivacyRegistry[issuer] || { supports_privacy: false, zk_proof_capability: false, privacy_score: 0 };
    const sorobanContracts = Object.entries(sorobanContractRegistry)
      .filter(([_, contract]) => contract.name.toLowerCase().includes(metrics.asset_code.toLowerCase()))
      .map(([address, contract]) => ({ address, ...contract }));

    return res.json({
      asset: metrics,
      issuer_profile: issuerProfile,
      trust_score: trust.score,
      trust_factors: trust.factors,
      reputation: reputationGraph,
      wallet_action_url: walletActionUrl,
      feedback,
      soroban_contracts: sorobanContracts,
      zk_privacy: zkPrivacy,
      recommendations: [
        'Verify issuer domain and regulatory standing before trading.',
        'Compare price feeds and liquidity pool depth when evaluating risk.',
        'Use issuer fingerprint to prevent lookalike asset scams.',
        'Review associated Soroban contract audit status and governance rules.'
      ]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to retrieve asset data.' });
  }
});

app.post('/api/feedback', express.json(), (req, res) => {
  const issuer = String(req.body.issuer || '').trim();
  const rating = Number(req.body.rating || 0);
  const comment = String(req.body.comment || '').trim();

  if (!issuer || rating < 1 || rating > 5 || !comment) {
    return res.status(400).json({ error: 'Issuer, rating (1-5), and comment are required.' });
  }

  feedbackStore[issuer] = feedbackStore[issuer] || [];
  feedbackStore[issuer].push({ rating, comment, timestamp: Date.now() });

  return res.status(201).json({ success: true, feedback: computeFeedbackSummary(issuer) });
});

app.get('/api/soroban-contracts', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const results = Object.entries(sorobanContractRegistry)
    .filter(([_, contract]) => {
      if (!search) return true;
      return contract.name.toLowerCase().includes(search) || contract.note.toLowerCase().includes(search);
    })
    .map(([address, contract]) => ({ address, ...contract }));

  return res.json({ results });
});

app.get('/api/zk-privacy', (req, res) => {
  const issuer = String(req.query.issuer || '').trim();
  if (!issuer) {
    return res.status(400).json({ error: 'Issuer is required.' });
  }

  const privacy = zkPrivacyRegistry[issuer] || {
    supports_privacy: false,
    zk_proof_capability: false,
    privacy_score: 0,
    note: 'No ZK privacy infrastructure detected for this issuer.'
  };

  return res.json(privacy);
});

app.get('/api/feedback', (req, res) => {
  const issuer = String(req.query.issuer || '').trim();
  if (!issuer) {
    return res.status(400).json({ error: 'Issuer is required.' });
  }

  return res.json(computeFeedbackSummary(issuer));
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Stellar Asset Verification Hub running at http://localhost:${PORT}`);
});
