'use strict';

const express = require('express');
const assistant = require('../services/assistant');
const { requireFields } = require('../middleware/validate');
const config = require('../config');

const router = express.Router();

router.post('/', (req, res) => {
  requireFields(req.body, ['input']);
  const { input, context, sessionId } = req.body;

  // input may be a plain string or an object { message, context }
  const message = typeof input === 'string' ? input : input.message;
  const ctx = (typeof input === 'object' && input.context) || context;

  const response = assistant.reply({ message, context: ctx });

  res.json({
    sessionId: sessionId || `sess_${Date.now()}`,
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
