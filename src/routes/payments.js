'use strict';

const express = require('express');
const store = require('../services/store');
const { requireFields, pick } = require('../middleware/validate');
const { HttpError } = require('../middleware/error');
const config = require('../config');

const router = express.Router();

const VALID_PROVIDERS = ['stripe', 'mercado_pago', 'mock'];

router.post('/intents', (req, res) => {
  requireFields(req.body, ['amount', 'currency']);
  const { amount, currency } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    throw new HttpError(400, 'amount must be a positive number');
  }
  const provider = VALID_PROVIDERS.includes(req.body.provider)
    ? req.body.provider
    : 'mock';

  const data = pick(req.body, [
    'amount',
    'currency',
    'planId',
    'leadId',
    'projectId',
    'description',
    'metadata',
  ]);

  const intent = store.create(
    'payment_intents',
    {
      ...data,
      provider,
      status: 'requires_confirmation',
      mock: config.mockMode || provider === 'mock',
      clientSecret: `mock_secret_${Math.random().toString(36).slice(2, 12)}`,
      amount,
      currency: String(currency).toUpperCase(),
    },
    'pi',
  );

  res.status(201).json({ data: intent });
});

router.get('/intents', (req, res) => {
  res.json({ data: store.list('payment_intents'), count: undefined });
});

router.get('/intents/:id', (req, res) => {
  const intent = store.get('payment_intents', req.params.id);
  if (!intent) throw new HttpError(404, 'Payment intent not found');
  res.json({ data: intent });
});

router.post('/intents/:id/confirm', (req, res) => {
  const intent = store.get('payment_intents', req.params.id);
  if (!intent) throw new HttpError(404, 'Payment intent not found');
  if (intent.status === 'succeeded') {
    return res.json({ data: intent });
  }
  const updated = store.update('payment_intents', req.params.id, {
    status: 'succeeded',
    confirmedAt: new Date().toISOString(),
  });
  res.json({ data: updated });
});

module.exports = router;
