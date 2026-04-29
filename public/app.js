const form = document.getElementById('asset-form');
const message = document.getElementById('message');
const result = document.getElementById('result');
const assetTitle = document.getElementById('asset-title');
const issuerName = document.getElementById('issuer-name');
const trustScore = document.getElementById('trust-score');
const profileField = document.getElementById('field-profile');
const codeField = document.getElementById('field-code');
const issuerField = document.getElementById('field-issuer');
const accountsField = document.getElementById('field-accounts');
const supplyField = document.getElementById('field-supply');
const riskFactors = document.getElementById('risk-factors');
const recommendations = document.getElementById('recommendations');

function clearResult() {
  result.classList.add('hidden');
  message.textContent = '';
}

function renderAsset(data) {
  assetTitle.textContent = `${data.asset.asset_code} • ${data.asset.asset_issuer}`;
  issuerName.textContent = data.issuer_profile?.name || 'Issuer profile unavailable';
  trustScore.textContent = `${data.trust_score}/100`;
  codeField.textContent = data.asset.asset_code;
  issuerField.textContent = data.asset.asset_issuer;
  accountsField.textContent = data.asset.num_accounts.toLocaleString();
  supplyField.textContent = data.asset.amount.toLocaleString();
  profileField.textContent = data.issuer_profile?.note || 'No known trusted issuer metadata.';

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
