'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

function buildApp() {
  const app = express();

  app.disable('x-powered-by');

  // Auto-allow our Vercel previews and the production apex when configured.
  // CORS_ORIGINS still wins as the explicit allow-list in dev / staging.
  const VERCEL_HOST_RE = /^https:\/\/v0-v-momentum[a-z0-9-]*\.vercel\.app$/i;
  const PWA_HOST_RE = /^https:\/\/(www\.)?vmomentum\.(app|com|mx)$/i;

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // curl / mobile / same-origin
        if (config.corsOrigins.includes('*')) return cb(null, true);
        if (config.corsOrigins.includes(origin)) return cb(null, true);
        if (VERCEL_HOST_RE.test(origin)) return cb(null, true);
        if (PWA_HOST_RE.test(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Light request log — no PII leaked.
  app.use((req, _res, next) => {
    if (config.env !== 'test') {
      console.log(`[req] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  app.use('/api', routes);
  app.get('/', (req, res) => res.redirect('/api'));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
