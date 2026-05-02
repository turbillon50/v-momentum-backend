'use strict';

// Quick end-to-end smoke test against a running instance.
// Usage:  node scripts/smoke.js  (assumes server on $PORT or 4000)

const BASE = process.env.SMOKE_URL || `http://localhost:${process.env.PORT || 4000}`;

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return json;
}

async function main() {
  console.log(`smoke: ${BASE}`);

  console.log('  GET  /api/health          ', (await call('GET', '/api/health')).ok);
  console.log('  GET  /api/integrations    ', (await call('GET', '/api/integrations')).categories.length, 'categories');
  console.log('  GET  /api/pricing         ', (await call('GET', '/api/pricing')).plans.length, 'plans');

  const lead = await call('POST', '/api/leads', {
    nombre: 'Smoke Test',
    email: 'smoke@example.com',
    telefono: '+5215555555555',
    empresa: 'ACME',
    tipoProyecto: 'pwa',
    plan: 'plan-1',
    mensaje: 'hola V',
  });
  console.log('  POST /api/leads           ', lead.data.id);

  const project = await call('POST', '/api/projects', {
    cliente: 'ACME',
    plan: 'plan-1',
    fase: 'descubrimiento',
    integraciones: ['stripe', 'clerk'],
    leadId: lead.data.id,
  });
  console.log('  POST /api/projects        ', project.data.id);

  const ai = await call('POST', '/api/assistant', {
    input: '¿Cuáles son los precios?',
    context: 'precios',
    sessionId: 'smoke-session',
  });
  console.log('  POST /api/assistant       ', ai.response.intent, '→', ai.response.content.slice(0, 60), '…');

  const intent = await call('POST', '/api/payments/intents', {
    amount: 12000,
    currency: 'MXN',
    planId: 'plan-1',
    leadId: lead.data.id,
  });
  console.log('  POST /api/payments/intents', intent.data.id, intent.data.status);

  const confirmed = await call('POST', `/api/payments/intents/${intent.data.id}/confirm`);
  console.log('  POST /…/confirm           ', confirmed.data.status);

  const hook = await call('POST', '/api/webhooks/stripe', { type: 'payment_intent.succeeded' });
  console.log('  POST /api/webhooks/stripe ', hook.received);

  console.log('\nsmoke: all checks passed ✓');
}

main().catch((err) => {
  console.error('\nsmoke FAILED:', err.message);
  process.exit(1);
});
