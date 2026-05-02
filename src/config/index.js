'use strict';

require('dotenv').config();

const path = require('path');

const toBool = (v, fallback = false) => {
  if (v === undefined || v === null || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const parseList = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mockMode: toBool(process.env.MOCK_MODE, true),
  corsOrigins: parseList(process.env.CORS_ORIGINS).length
    ? parseList(process.env.CORS_ORIGINS)
    : ['http://localhost:3000', 'http://localhost:5173'],
  paths: {
    runtime: path.join(__dirname, '..', '..', 'data', 'runtime'),
    seed: path.join(__dirname, '..', 'data'),
  },
  providers: {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    mercadoPago: !!process.env.MERCADO_PAGO_TOKEN,
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    clerk: !!process.env.CLERK_SECRET_KEY,
    resend: !!process.env.RESEND_API_KEY,
    docusign: !!process.env.DOCUSIGN_KEY,
    sumsub: !!process.env.SUMSUB_KEY,
    cloudflare: !!process.env.CLOUDFLARE_TOKEN,
  },
};

module.exports = config;
