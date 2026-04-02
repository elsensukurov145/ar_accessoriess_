const crypto = require('crypto');

const KAPITAL_BANK_API_URL = process.env.KAPITAL_BANK_API_URL || 'https://kassa.kapitalbank.az/merchant';
const TERMINAL_ID = process.env.KAPITAL_BANK_TERMINAL_ID || 'your_terminal_id';
const SECRET_KEY = process.env.KAPITAL_BANK_SECRET_KEY || 'your_secret_key';

function getFetch() {
  if (typeof global.fetch === 'function') {
    return global.fetch;
  }
  try {
    return require('node-fetch');
  } catch (err) {
    throw new Error('Fetch is required (Node 18+ or install node-fetch).');
  }
}

function sign(payload) {
  // Kapital Bank 3D secure usually uses HMAC SHA-256 or SHA-512 signature.
  // This function mimics the typical scheme: terminal + order_id + amount + currency + secret
  const text = `${TERMINAL_ID}:${payload.order_id}:${payload.amount}:${payload.currency}:${SECRET_KEY}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(text).digest('hex');
}

async function createPaymentSession({ orderId, amount, currency = 'AZN', description, customer, successUrl, failUrl, callbackUrl }) {
  const fetch = getFetch();

  const payload = {
    terminal_id: TERMINAL_ID,
    order_id: String(orderId),
    amount: Number(amount).toFixed(2),
    currency: currency.toUpperCase(),
    description: description || `Order #${orderId}`,
    customer_name: `${customer?.name || ''} ${customer?.surname || ''}`.trim(),
    customer_email: customer?.email || '',
    customer_phone: customer?.phone || '',
    success_url: successUrl,
    fail_url: failUrl,
    callback_url: callbackUrl,
    language: 'az',
  };

  payload.signature = sign({
    order_id: payload.order_id,
    amount: payload.amount,
    currency: payload.currency,
  });

  const endpoint = `${KAPITAL_BANK_API_URL}/create_payment`; // placeholder endpoint path

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 15000,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kapital Bank API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!data.success || !data.redirect_url) {
    throw new Error(`Kapital Bank payment not created: ${JSON.stringify(data)}`);
  }

  return {
    provider_transaction_id: data.transaction_id || data.order_id || null,
    redirectUrl: data.redirect_url,
    raw: data,
  };
}

function verifyCallbackSignature(payload) {
  // expected payload from Kapital Bank callback
  // e.g. { order_id, transaction_id, amount, currency, status, signature }
  if (!payload || !payload.signature || !payload.order_id || !payload.amount || !payload.status) {
    return false;
  }

  const text = `${TERMINAL_ID}:${payload.order_id}:${payload.amount}:${payload.currency || 'AZN'}:${payload.status}:${SECRET_KEY}`;
  const expected = crypto.createHmac('sha256', SECRET_KEY).update(text).digest('hex');
  return expected === payload.signature;
}

module.exports = {
  createPaymentSession,
  verifyCallbackSignature,
};