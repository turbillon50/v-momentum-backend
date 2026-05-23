'use strict';

const express = require('express');
const assistant = require('../services/assistant');
const { HttpError } = require('../middleware/error');
const config = require('../config');

const router = express.Router();

// Accepts either:
//   { input: 'text', context: 'precios', sessionId? }       (spec shape)
//   { input: { message: 'text', context: 'precios' } }       (spec shape, nested)
//   { message: 'text', context: 'precios', sessionId? }      (PWA shape)
router.post('/', (req, res) => {
  const body = req.body || {};

  let message;
  let context;

  if (typeof body.input === 'string') {
    message = body.input;
    context = body.context;
  } else if (body.input && typeof body.input === 'object') {
    message = body.input.message;
    context = body.input.context || body.context;
  } else {
    message = body.message;
    context = body.context;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new HttpError(400, 'Missing required field', { field: 'message' });
  }

  const response = assistant.reply({ message, context });

  res.json({
    sessionId: body.sessionId || `sess_${Date.now()}`,
    mockMode: config.mockMode,
    aiProviders: {
      openai: config.providers.openai,
      anthropic: config.providers.anthropic,
    },
    response,
  });
});

router.get('/contexts', (req, res) => {
  res.json({ contexts: assistant.VALID_CONTEXTS });
});

module.exports = router;
