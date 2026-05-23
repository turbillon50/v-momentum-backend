'use strict';

// Vercel serverless entry. Builds the Express app once per cold start and
// re-uses it across invocations. Vercel passes (req, res) to the exported
// handler, and Express speaks that contract natively.

const buildApp = require('../src/app');

const app = buildApp();

module.exports = app;
