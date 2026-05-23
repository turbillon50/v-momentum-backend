'use strict';

// Mock-mode "V" assistant. Picks an answer based on the screen the user is on
// and lightweight intent detection on the message. When real AI keys are set
// (OPENAI_API_KEY / ANTHROPIC_API_KEY) this module is the seam to swap in a
// real call without touching the route.
//
// Response shape is aligned with the PWA's V orb (components/v-ai-core.tsx):
//   state ∈ 'idle' | 'thinking' | 'executing' | 'success'
//   navigate ∈ section IDs used by the PWA's onNavigate():
//     'inicio' | 'proceso' | 'integraciones' | 'precios' | 'contacto' | 'demos'

const VALID_CONTEXTS = ['inicio', 'proceso', 'integraciones', 'precios', 'contacto', 'demos'];

const INTENTS = [
  { id: 'greeting', match: /\b(hola|hi|buenas|hey|qué tal|que tal)\b/i },
  { id: 'price', match: /\b(precios?|costos?|cu[aá]nto|planes?|pagos?|mensualidad(es)?)\b/i },
  { id: 'integration', match: /\b(stripe|mercado pago|clerk|openai|anthropic|integraci[oó]n(es)?|webhooks?|apis?)\b/i },
  { id: 'process', match: /\b(proceso|fases?|etapas?|tiempos?|cu[aá]ndo|entregas?)\b/i },
  { id: 'demo', match: /\b(demos?|ejemplos?|muestras?|ver)\b/i },
  { id: 'contact', match: /\b(contacto|hablar|asesor|humano|reuni[oó]n|whatsapp)\b/i },
];

function detectIntent(text) {
  const t = String(text || '');
  for (const intent of INTENTS) {
    if (intent.match.test(t)) return intent.id;
  }
  return 'general';
}

const NAVIGATE_BY_INTENT = {
  price: 'precios',
  integration: 'integraciones',
  process: 'proceso',
  demo: 'demos',
  contact: 'contacto',
};

const RESPONSES = {
  inicio: {
    greeting: 'Hola, soy V. Te puedo guiar por la plataforma: cuéntame qué tipo de proyecto tienes en mente.',
    price: 'Tenemos dos planes: Plan Tradicional ($12,000 MXN único, 50/25/25) y Plan Flexible ($3,000 + 11×$1,000). Te puedo abrir Precios.',
    integration: 'Llevamos integraciones listas en 7 categorías: Core App, Captación, Pagos, Web3, Experiencias, Legal y Diseño/Desarrollo.',
    process: 'El proceso va de descubrimiento → diseño → desarrollo → integraciones → QA → lanzamiento, en 2 a 10 días hábiles.',
    demo: 'Puedo prepararte una demo con tu marca. ¿Compartes nombre, correo y tipo de proyecto?',
    contact: 'Perfecto, déjame tus datos y un humano del equipo se conecta contigo. También puedes escribirnos por WhatsApp.',
    general: 'Estoy aquí para guiarte. Pregúntame por planes, integraciones, proceso o pide una demo.',
  },
  proceso: {
    greeting: 'Estás en Proceso. Te explico cualquier fase del flujo de descubrimiento a lanzamiento.',
    price: 'El precio no cambia con la fase: el plan que elijas cubre todo el flujo hasta el lanzamiento.',
    integration: 'Las integraciones se enchufan típicamente después del diseño. ¿Quieres ver el catálogo?',
    process: 'Cada proyecto pasa por 6 fases. Tú ves la fase actual, integraciones activas y URLs de demo y producción.',
    demo: 'Si quieres ver el proceso en vivo, puedo llevarte a Demos.',
    contact: 'Te paso con el equipo de delivery para una llamada de descubrimiento.',
    general: 'En el proceso todo es transparente: ves la fase, integraciones activas y URLs de demo y producción.',
  },
  integraciones: {
    greeting: 'Catálogo de integraciones: Core App, Captación, Pagos, Web3, Experiencias, Legal, Desarrollo. ¿Cuál te interesa?',
    price: 'Las integraciones marcadas como "included" no tienen costo extra. Las "advanced" se cotizan según el alcance.',
    integration: 'Stripe y Mercado Pago para pagos, Clerk para auth, Resend para emails, Cloudflare para infra. Todas listas.',
    process: 'Las integraciones se configuran en la fase de desarrollo, antes de QA.',
    demo: 'Puedo enchufarte una demo con Stripe en modo test y autenticación con Clerk.',
    contact: 'Si necesitas una integración específica que no veas, déjame tus datos y la cotizamos.',
    general: 'Todo está pensado en modo enchufable: activas la integración cuando estés listo, no antes.',
  },
  precios: {
    greeting: 'Estás en Precios. Tenemos dos planes y dos extras opcionales para tiendas de apps.',
    price: 'Plan Tradicional: $12,000 MXN único en 3 pagos (50/25/25). Plan Flexible: $3,000 + 11×$1,000. Extras: App Store $5,000, Google Play $3,000.',
    integration: 'El precio incluye las integraciones base. Si quieres una específica (ej. KYC con Sumsub), te la cotizamos.',
    process: 'Pagar dispara la fase de descubrimiento. En 2-10 días hábiles tienes tu PVA listo.',
    demo: 'Antes de pagar puedes pedir una demo personalizada. ¿Qué tipo de proyecto manejas?',
    contact: 'Si quieres facturación o un esquema distinto, te paso con un humano del equipo comercial.',
    general: 'Todos los planes incluyen PWA funcional, diseño premium, auth, base de datos, pagos y deploy.',
  },
  contacto: {
    greeting: 'Bienvenido al área de contacto. Llena el formulario o háblanos por WhatsApp.',
    price: 'Indica el plan que te interesa en el formulario y lo aterrizamos en la llamada.',
    integration: 'Cuéntanos en el formulario qué integraciones específicas necesitas para cotizarte mejor.',
    process: 'Una vez que envíes el formulario, te respondemos en menos de 24 horas.',
    demo: 'Para ver demos en vivo, marca "Demos" en tipo de proyecto en el formulario.',
    contact: '¿Prefieres WhatsApp directo? Tenemos un canal abierto para responderte rápido.',
    general: 'Mientras más contexto nos des en el formulario, más concreta será la respuesta.',
  },
  demos: {
    greeting: 'En Demos puedes ver casos reales construidos con la misma plataforma.',
    price: 'Estos demos fueron construidos con el mismo plan que vas a contratar.',
    integration: 'Cada demo lista las integraciones reales que utiliza.',
    process: 'Cada demo pasó por el mismo proceso de 6 fases que aplicaríamos al tuyo.',
    demo: 'Échale un ojo a los demos y dime cuál te late más para hacer algo similar.',
    contact: '¿Quieres que un humano te muestre un demo en vivo? Agendamos llamada.',
    general: 'Demos reales, código real, clientes reales. Ningún render de Figma.',
  },
};

const SUGGESTIONS = {
  inicio: ['¿Cuáles son los planes?', 'Quiero una demo', 'Ver integraciones'],
  proceso: ['¿Cuánto tarda cada fase?', 'Ver entregables', 'Hablar con un humano'],
  integraciones: ['¿Cómo conecto Stripe?', '¿Tienen Mercado Pago?', '¿IA en español?'],
  precios: ['¿Hay descuento por pago único?', 'Quiero el Plan Flexible', 'Necesito factura'],
  contacto: ['Mejor por WhatsApp', '¿Cuándo me responden?', 'Quiero agendar llamada'],
  demos: ['Ver demo de e-commerce', '¿Tienen demo de SaaS?', 'Quiero algo similar'],
};

function reply({ message, context }) {
  const ctx = VALID_CONTEXTS.includes(context) ? context : 'inicio';
  const intent = detectIntent(message);
  const text = (RESPONSES[ctx] && RESPONSES[ctx][intent]) || RESPONSES.inicio.general;
  const suggestions = SUGGESTIONS[ctx] || SUGGESTIONS.inicio;
  const navigate = NAVIGATE_BY_INTENT[intent] || null;

  return {
    role: 'assistant',
    content: text,
    reply: text,
    state: 'success',
    context: ctx,
    intent,
    navigate,
    suggestions,
    mock: true,
  };
}

module.exports = { reply, VALID_CONTEXTS, detectIntent };
