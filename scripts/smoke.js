'use strict';

// End-to-end smoke test against a running instance.
// Validates both spec-shape (Spanish) and PWA-shape (English) payloads.
//
//   node scripts/smoke.js              # uses http://localhost:$PORT or :4000
//   SMOKE_URL=http://host:port node scripts/smoke.js

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

function assert(cond, msg) {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

async function main() {
  console.log(`smoke: ${BASE}`);

  const health = await call('GET', '/api/health');
  assert(health.ok === true, 'health.ok');
  console.log('  GET  /api/health           ok');

  const integrations = await call('GET', '/api/integrations');
  assert(Array.isArray(integrations.categories), 'integrations.categories is array');
  const expectedCats = ['core', 'captacion', 'pagos', 'web3', 'experiencias', 'legal', 'desarrollo'];
  for (const id of expectedCats) {
    assert(integrations.categories.find((c) => c.id === id), `category ${id} present`);
  }
  console.log(`  GET  /api/integrations     ${integrations.categories.length} categories (matches PWA)`);

  const pricing = await call('GET', '/api/pricing');
  assert(pricing.plans.find((p) => p.id === 'traditional'), 'traditional plan');
  assert(pricing.plans.find((p) => p.id === 'flexible'), 'flexible plan');
  assert(pricing.storeAddons.length === 2, 'two store addons');
  assert(Array.isArray(pricing.included) && pricing.included.length > 0, 'included list');
  console.log(`  GET  /api/pricing          ${pricing.plans.length} plans, ${pricing.storeAddons.length} addons`);

  // PWA shape (English keys, what contact-section.tsx will send)
  const leadFromPwa = await call('POST', '/api/leads', {
    name: 'Smoke Test',
    whatsapp: '+5215555555555',
    email: 'smoke@example.com',
    company: 'ACME',
    projectType: 'Landing / PWA',
    plan: 'traditional',
    storePublish: 'pwa',
    urgency: 'Lo antes posible',
    description: 'Quiero una demo',
    consent: true,
  });
  assert(leadFromPwa.data.nombre === 'Smoke Test', 'PWA payload mapped to nombre');
  assert(leadFromPwa.data.telefono === '+5215555555555', 'whatsapp mapped to telefono');
  console.log(`  POST /api/leads (PWA en)   ${leadFromPwa.data.id}`);

  // Spec shape (Spanish keys)
  const leadFromSpec = await call('POST', '/api/leads', {
    nombre: 'Spec Test',
    telefono: '+5215555555556',
    email: 'spec@example.com',
    empresa: 'ACME 2',
    tipoProyecto: 'SaaS',
    plan: 'flexible',
    mensaje: 'Hola',
  });
  assert(leadFromSpec.data.name === 'Spec Test', 'spec payload mirrored to name');
  console.log(`  POST /api/leads (spec es)  ${leadFromSpec.data.id}`);

  const project = await call('POST', '/api/projects', {
    cliente: 'ACME',
    plan: 'traditional',
    fase: 'descubrimiento',
    integraciones: ['Stripe', 'Clerk'],
    leadId: leadFromPwa.data.id,
  });
  console.log(`  POST /api/projects         ${project.data.id}`);

  const ai = await call('POST', '/api/assistant', {
    message: '¿Cuáles son los precios?',
    context: 'precios',
    sessionId: 'smoke-session',
  });
  assert(ai.response.intent === 'price', `intent should be price, got ${ai.response.intent}`);
  assert(ai.response.state === 'success', 'response.state present');
  assert(ai.response.navigate === 'precios', 'navigate hint present');
  console.log(`  POST /api/assistant        ${ai.response.intent} → navigate:${ai.response.navigate}`);

  const intent = await call('POST', '/api/payments/intents', {
    amount: 12000,
    currency: 'MXN',
    planId: 'traditional',
    leadId: leadFromPwa.data.id,
  });
  console.log(`  POST /api/payments/intents ${intent.data.id} (${intent.data.status})`);

  const confirmed = await call('POST', `/api/payments/intents/${intent.data.id}/confirm`);
  assert(confirmed.data.status === 'succeeded', 'intent succeeded');
  console.log(`  POST /…/confirm            ${confirmed.data.status}`);

  const hook = await call('POST', '/api/webhooks/stripe', { type: 'payment_intent.succeeded' });
  assert(hook.received === true, 'stripe webhook received');
  console.log(`  POST /api/webhooks/stripe  received`);

  console.log('\nsmoke: all checks passed ✓');
}

main().catch((err) => {
  console.error('\nsmoke FAILED:', err.message);
  process.exit(1);
});
