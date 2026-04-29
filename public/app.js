const form = document.getElementById('asset-form');
const message = document.getElementById('message');
const result = document.getElementById('result');
const assetTitle = document.getElementById('asset-title');
const issuerName = document.getElementById('issuer-name');
const trustScore = document.getElementById('trust-score');
const profileField = document.getElementById('field-profile');
const regulationField = document.getElementById('field-regulation');
const codeField = document.getElementById('field-code');
const issuerField = document.getElementById('field-issuer');
const accountsField = document.getElementById('field-accounts');
const supplyField = document.getElementById('field-supply');
const liquidityPoolsField = document.getElementById('field-liquidity-pools');
const liquidityAmountField = document.getElementById('field-liquidity-amount');
const claimableBalancesField = document.getElementById('field-claimable-balances');
const contractsField = document.getElementById('field-contracts');
const reputationNote = document.getElementById('reputation-note');
const reputationGraph = document.getElementById('reputation-graph');
const walletActionUrl = document.getElementById('wallet-action-url');
const feedbackForm = document.getElementById('feedback-form');
const feedbackRating = document.getElementById('feedback-rating');
const feedbackComment = document.getElementById('feedback-comment');
const feedbackMessage = document.getElementById('feedback-message');
const feedbackSummary = document.getElementById('feedback-summary');
const feedbackList = document.getElementById('feedback-list');
const sorobanContracts = document.getElementById('soroban-contracts');
const sorobanNote = document.getElementById('soroban-note');
const zkPrivacySupport = document.getElementById('zk-privacy-support');
const zkPrivacyProof = document.getElementById('zk-privacy-proof');
const riskFactors = document.getElementById('risk-factors');
const recommendations = document.getElementById('recommendations');
let currentIssuer = '';
let currentData = null;

function clearResult() {
  result.classList.add('hidden');
  message.textContent = '';
  feedbackMessage.textContent = '';
}

function renderAsset(data) {
  assetTitle.textContent = `${data.asset.asset_code} • ${data.asset.asset_issuer}`;
  issuerName.textContent = data.issuer_profile?.name || 'Issuer profile unavailable';
  trustScore.textContent = `${data.trust_score}/100`;
  codeField.textContent = data.asset.asset_code;
  issuerField.textContent = data.asset.asset_issuer;
  accountsField.textContent = data.asset.num_accounts.toLocaleString();
  supplyField.textContent = data.asset.amount.toLocaleString();
  liquidityPoolsField.textContent = data.asset.num_liquidity_pools.toLocaleString();
  liquidityAmountField.textContent = data.asset.liquidity_amount.toLocaleString();
  claimableBalancesField.textContent = data.asset.num_claimable_balances.toLocaleString();
  contractsField.textContent = data.asset.num_contracts.toLocaleString();
  profileField.textContent = data.issuer_profile?.note || 'No known trusted issuer metadata.';
  regulationField.textContent = data.issuer_profile?.regulation ? data.issuer_profile.regulation.toUpperCase() : 'Unknown';
  walletActionUrl.href = data.wallet_action_url;
  walletActionUrl.textContent = 'Open asset in StellarTerm';
  currentIssuer = data.asset.asset_issuer;

  reputationNote.textContent = data.reputation?.note || 'No reputation relationship data available.';
  reputationGraph.innerHTML = '';
  if (data.reputation?.edges?.length) {
    data.reputation.edges.forEach((edge) => {
      const li = document.createElement('li');
      li.textContent = `${edge.relation} → ${edge.issuer} (${edge.trust})`;
      reputationGraph.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No issuer relationships found.';
    reputationGraph.appendChild(li);
  }

  feedbackSummary.textContent = data.feedback.count
    ? `Average rating ${data.feedback.average_rating}/5 from ${data.feedback.count} comments.`
    : 'No feedback yet for this issuer.';
  feedbackList.innerHTML = '';
  data.feedback.comments.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `(${entry.rating}/5) ${entry.comment}`;
    feedbackList.appendChild(li);
  });

  sorobanContracts.innerHTML = '';
  if (data.soroban_contracts && data.soroban_contracts.length) {
    data.soroban_contracts.forEach((contract) => {
      const li = document.createElement('li');
      li.textContent = `${contract.name} (${contract.audit_status}) - v${contract.version}`;
      sorobanContracts.appendChild(li);
    });
    sorobanNote.textContent = 'Soroban contracts associated with this asset.';
  } else {
    sorobanNote.textContent = 'No associated Soroban contracts found.';
  }

  zkPrivacySupport.textContent = data.zk_privacy?.supports_privacy
    ? 'Privacy transactions are supported.'
    : 'Privacy transactions are not natively supported.';
  zkPrivacyProof.textContent = data.zk_privacy?.zk_proof_capability
    ? `Zero-knowledge proof verification available (score: ${data.zk_privacy.privacy_score}/100).`
    : `No ZK proof infrastructure (privacy score: ${data.zk_privacy?.privacy_score || 0}/100).`;

  currentData = data;

  riskFactors.innerHTML = '';
  data.trust_factors.forEach((factor) => {
    const li = document.createElement('li');
    li.textContent = factor;
    riskFactors.appendChild(li);
  });

  recommendations.innerHTML = '';
  data.recommendations.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    recommendations.appendChild(li);
  });

  result.classList.remove('hidden');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearResult();

  const code = document.getElementById('asset-code').value.trim();
  const issuer = document.getElementById('asset-issuer').value.trim();

  if (!code || !issuer) {
    message.textContent = 'Please enter both an asset code and an issuer address.';
    return;
  }

  message.textContent = 'Fetching asset data…';

  try {
    const response = await fetch(`/api/asset?code=${encodeURIComponent(code)}&issuer=${encodeURIComponent(issuer)}`);
    const payload = await response.json();

    if (!response.ok) {
      message.textContent = payload.error || 'Unable to fetch asset information.';
      return;
    }

    message.textContent = '';
    renderAsset(payload);
  } catch (error) {
    console.error(error);
    message.textContent = 'Network error while fetching asset data.';
  }
});

feedbackForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedbackMessage.textContent = '';

  if (!currentIssuer) {
    feedbackMessage.textContent = 'Load an asset before submitting feedback.';
    return;
  }

  const rating = Number(feedbackRating.value);
  const comment = feedbackComment.value.trim();

  if (!rating || !comment) {
    feedbackMessage.textContent = 'Please provide a rating and comment.';
    return;
  }

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ issuer: currentIssuer, rating, comment })
    });
    const payload = await response.json();

    if (!response.ok) {
      feedbackMessage.textContent = payload.error || 'Unable to submit feedback.';
      return;
    }

    feedbackMessage.textContent = 'Feedback submitted successfully.';
    feedbackComment.value = '';
    if (currentData) {
      currentData.feedback = payload.feedback;
      renderAsset(currentData);
    }
  } catch (error) {
    console.error(error);
    feedbackMessage.textContent = 'Network error while submitting feedback.';
  }
});
