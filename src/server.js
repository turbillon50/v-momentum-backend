'use strict';

const buildApp = require('./app');
const config = require('./config');

const app = buildApp();

const server = app.listen(config.port, () => {
  console.log(
    `[v-momentum-backend] listening on http://localhost:${config.port} ` +
      `(env=${config.env}, mock=${config.mockMode})`,
  );
  console.log(`[cors] allowed origins: ${config.corsOrigins.join(', ')}`);
});

function shutdown(signal) {
  console.log(`[v-momentum-backend] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
