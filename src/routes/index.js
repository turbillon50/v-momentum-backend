'use strict';

const express = require('express');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: 'v-momentum-backend',
    version: '0.1.0',
    mockMode: config.mockMode,
    endpoints: [
      'GET  /api/health',
      'GET  /api/leads',
      'POST /api/leads',
      'PATCH /api/leads/:id',
      'GET  /api/projects',
      'POST /api/projects',
      'PATCH /api/projects/:id',
      'GET  /api/integrations',
      'GET  /api/integrations/:categoryId',
      'GET  /api/pricing',
      'POST /api/assistant',
      'POST /api/payments/intents',
      'GET  /api/payments/intents',
      'POST /api/payments/intents/:id/confirm',
      'POST /api/webhooks/{stripe|mercado-pago|clerk|make|jotform}',
    ],
  });
});

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: config.env,
    mockMode: config.mockMode,
    timestamp: new Date().toISOString(),
  });
});

router.use('/leads', require('./leads'));
router.use('/projects', require('./projects'));
router.use('/integrations', require('./integrations'));
router.use('/pricing', require('./pricing'));
router.use('/assistant', require('./assistant'));
router.use('/payments', require('./payments'));
router.use('/webhooks', require('./webhooks'));

module.exports = router;
