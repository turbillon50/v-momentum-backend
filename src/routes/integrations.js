'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { HttpError } = require('../middleware/error');

const router = express.Router();

const seedPath = path.join(config.paths.seed, 'integrations.json');
const catalog = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Map integration name → env var (truthy = real key configured).
const PROVIDER_KEYS = {
  Stripe: 'stripe',
  'Mercado Pago': 'mercadoPago',
  OpenAI: 'openai',
  Anthropic: 'anthropic',
  Clerk: 'clerk',
  Resend: 'resend',
  DocuSign: 'docusign',
  Sumsub: 'sumsub',
  Cloudflare: 'cloudflare',
};

function annotate(category) {
  return {
    ...category,
    integrations: category.integrations.map((item) => {
      const key = PROVIDER_KEYS[item.name];
      return {
        ...item,
        configured: key ? !!config.providers[key] : false,
      };
    }),
  };
}

// Frontend expects an array of categories (matches the hardcoded shape it
// already renders). `meta` carries non-breaking extras.
router.get('/', (req, res) => {
  res.json({
    categories: catalog.categories.map(annotate),
    meta: {
      mockMode: config.mockMode,
      total: catalog.categories.reduce((n, c) => n + c.integrations.length, 0),
    },
  });
});

router.get('/:categoryId', (req, res) => {
  const category = catalog.categories.find((c) => c.id === req.params.categoryId);
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ category: annotate(category), meta: { mockMode: config.mockMode } });
});

module.exports = router;
