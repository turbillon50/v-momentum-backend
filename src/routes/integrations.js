'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { HttpError } = require('../middleware/error');

const router = express.Router();

const seedPath = path.join(config.paths.seed, 'integrations.json');
const catalog = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

function annotate(category) {
  return {
    ...category,
    items: category.items.map((item) => ({
      ...item,
      configured: isConfigured(item.id),
    })),
  };
}

function isConfigured(id) {
  switch (id) {
    case 'stripe':
      return config.providers.stripe;
    case 'mercado-pago':
      return config.providers.mercadoPago;
    case 'openai':
      return config.providers.openai;
    case 'anthropic':
      return config.providers.anthropic;
    case 'clerk':
      return config.providers.clerk;
    case 'resend':
      return config.providers.resend;
    case 'docusign':
      return config.providers.docusign;
    case 'sumsub':
      return config.providers.sumsub;
    case 'cloudflare':
      return config.providers.cloudflare;
    default:
      return false;
  }
}

router.get('/', (req, res) => {
  res.json({
    mockMode: config.mockMode,
    categories: catalog.categories.map(annotate),
  });
});

router.get('/:categoryId', (req, res) => {
  const category = catalog.categories.find((c) => c.id === req.params.categoryId);
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ mockMode: config.mockMode, category: annotate(category) });
});

module.exports = router;
