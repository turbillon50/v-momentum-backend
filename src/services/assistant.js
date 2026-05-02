'use strict';

// Mock-mode "V" assistant. Picks an answer based on the screen the user is on
// and lightweight intent detection on the message. When real AI keys are set
// (OPENAI_API_KEY / ANTHROPIC_API_KEY) this module is the seam to swap in a
// real call without touching the route.

const VALID_CONTEXTS = ['inicio', 'proceso', 'integraciones', 'precios'];

const INTENTS = [
  { id: 'greeting', match: /\b(hola|hi|buenas|hey|qué tal|que tal)\b/i },
  { id: 'price', match: /\b(precios?|costos?|cu[aá]nto|planes?|pagos?|mensualidad(es)?)\b/i },
  { id: 'integration', match: /\b(stripe|mercado pago|clerk|openai|anthropic|integraci[oó]n(es)?|webhooks?|apis?)\b/i },
  { id: 'process', match: /\b(proceso|fases?|etapas?|tiempos?|cu[aá]ndo|entregas?)\b/i },
  { id: 'demo', match: /\b(demos?|ejemplos?|muestras?|ver)\b/i },
  { id: 'contact', match: /\b(contacto|hablar|asesor|humano|reuni[oó]n)\b/i },
];

function detectIntent(text) {
  const t = String(text || '');
  for (const intent of INTENTS) {
    if (intent.match.test(t)) return intent.id;
  }
  return 'general';
}

const RESPONSES = {
  inicio: {
    greeting: 'Hola, soy V. Te puedo guiar por la plataforma: cuéntame qué tipo de proyecto tienes en mente.',
    price: 'Tenemos dos planes: pago único de $12,000 MXN o anticipo de $3,000 + 11 mensualidades de $1,000. Te puedo abrir la sección de Precios.',
    integration: 'Llevamos integraciones listas para Pagos, Backend, IA, Web3, Legal e Infra. ¿Quieres que te muestre el catálogo?',
    process: 'El proceso va de descubrimiento → diseño → desarrollo → integraciones → QA → lanzamiento. ¿Te muestro la línea de tiempo?',
    demo: 'Puedo prepararte una demo con tu marca. ¿Compartes nombre, correo y tipo de proyecto?',
    contact: 'Perfecto, déjame tus datos y un humano del equipo se conecta contigo en menos de 24 horas.',
    general: 'Estoy aquí para guiarte. Pregúntame por planes, integraciones, proceso o pide una demo.',
  },
  proceso: {
    greeting: 'Estás en Proceso. Te explico cualquier fase: descubrimiento, diseño, desarrollo, integraciones, QA o lanzamiento.',
    price: 'El precio no cambia con la fase: el plan que elijas cubre todo el flujo hasta el lanzamiento.',
    integration: 'Las integraciones se enchufan típicamente en la fase 4. ¿Quieres ver el catálogo?',
    process: 'Cada proyecto pasa por 6 fases. La fase actual y entregables se ven en tu dashboard una vez que arrancamos.',
    demo: 'Si quieres ver el proceso en vivo, puedo llevarte a una demo guiada.',
    contact: 'Te paso con el equipo de delivery para una llamada de descubrimiento.',
    general: 'En el proceso todo es transparente: ves la fase, integraciones activas y URLs de demo y producción.',
  },
  integraciones: {
    greeting: 'Catálogo de integraciones: Pagos, Backend, IA, Web3, Legal e Infra. ¿Cuál te interesa?',
    price: 'Las integraciones base están incluidas. Las opcionales (ej. Web3) se cotizan aparte si las necesitas.',
    integration: 'Tengo Stripe y Mercado Pago listos para pagos, OpenAI y Anthropic para IA, Clerk para auth y Cloudflare para infra.',
    process: 'Las integraciones se configuran en la fase 4 del proceso, después de QA visual.',
    demo: 'Puedo enchufarte una demo con Stripe en modo test y un asistente IA real en sandbox.',
    contact: 'Si necesitas una integración específica que no veas, déjame tus datos y la cotizamos.',
    general: 'Todo está pensado en modo enchufable: activas la integración cuando estés listo, no antes.',
  },
  precios: {
    greeting: 'Estás en Precios. Tenemos dos planes y dos extras opcionales para tiendas de apps.',
    price: 'Plan 1: $12,000 MXN único. Plan 2: $3,000 anticipo + 11 mensualidades de $1,000. Extras: App Store $5,000, Google Play $3,000.',
    integration: 'El precio incluye las integraciones base. Si quieres una específica (ej. KYC con Sumsub), te la coticemos sin compromiso.',
    process: 'Pagar dispara la fase de descubrimiento. En 3-5 días hábiles tienes tu plan de trabajo.',
    demo: 'Antes de pagar puedes pedir una demo personalizada. ¿Qué tipo de proyecto manejas?',
    contact: 'Si quieres facturación o un esquema distinto, te paso con un humano del equipo comercial.',
    general: 'Todos los planes incluyen PWA completa, integraciones base, asistente V y despliegue en dominio propio.',
  },
};

function reply({ message, context }) {
  const ctx = VALID_CONTEXTS.includes(context) ? context : 'inicio';
  const intent = detectIntent(message);
  const text =
    (RESPONSES[ctx] && RESPONSES[ctx][intent]) ||
    RESPONSES.inicio.general;

  const suggestions = SUGGESTIONS[ctx] || SUGGESTIONS.inicio;

  return {
    role: 'assistant',
    content: text,
    context: ctx,
    intent,
    suggestions,
    mock: true,
  };
}

const SUGGESTIONS = {
  inicio: ['¿Cuáles son los planes?', 'Quiero una demo', 'Ver integraciones'],
  proceso: ['¿Cuánto tarda cada fase?', 'Ver entregables', 'Hablar con un humano'],
  integraciones: ['¿Cómo conecto Stripe?', '¿Tienen Mercado Pago?', '¿IA en español?'],
  precios: ['¿Hay descuento por pago único?', 'Quiero el Plan 2', 'Necesito factura'],
};

module.exports = { reply, VALID_CONTEXTS, detectIntent };
