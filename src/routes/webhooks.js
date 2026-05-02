'use strict';

const express = require('express');
const store = require('../services/store');

const router = express.Router();

// All webhook endpoints are placeholders. They:
//   1. Acknowledge with 200 so the provider does not retry forever.
//   2. Persist a record so we can inspect what arrived during integration.
//   3. Skip signature verification (TODO once real keys are wired).

const PROVIDERS = ['stripe', 'mercado-pago', 'clerk', 'make', 'jotform'];

function logEvent(provider, req) {
  return store.create(
    'webhook_events',
    {
      provider,
      headers: {
        'x-signature': req.get('x-signature') || null,
        'stripe-signature': req.get('stripe-signature') || null,
        'x-clerk-signature': req.get('svix-signature') || null,
      },
      body: req.body,
      receivedAt: new Date().toISOString(),
    },
    'evt',
  );
}

for (const provider of PROVIDERS) {
  router.post(`/${provider}`, (req, res) => {
    const evt = logEvent(provider, req);
    console.log(`[webhooks] ${provider} event received`, evt.id);
    res.json({ received: true, id: evt.id, provider, mock: true });
  });
}

router.get('/', (req, res) => {
  res.json({
    providers: PROVIDERS.map((p) => `/api/webhooks/${p}`),
    note: 'All endpoints are placeholders in mock mode. Signature verification not implemented yet.',
  });
});

router.get('/events', (req, res) => {
  const { provider } = req.query;
  const items = store.list(
    'webhook_events',
    provider ? { provider: String(provider) } : undefined,
  );
  res.json({ data: items, count: items.length });
});

module.exports = router;
