# v-momentum-backend

Backend mock-first para la PWA **V Momentum**
([turbillon50/v-momentum-pwa](https://github.com/turbillon50/v-momentum-pwa)).
Express + persistencia JSON en disco. Todo arranca en `MOCK_MODE=true` para
que el frontend pueda enchufarse y sentirse como producto real antes de tocar
una sola llave de provider.

> **¿Vienes a publicarlo?** Lee primero
> [`docs/HANDOFF.md`](docs/HANDOFF.md) — son las 3 acciones manuales que
> faltan para llevar esto a `vmomentum.app` (importar a Vercel, aplicar el
> patch al PWA, comprar dominio). El resto está cocinado.

---

## Filosofía

- El frontend **no se rediseña**. Este backend se adapta al shape que la PWA
  ya tiene.
- Las integraciones (Stripe, Mercado Pago, Clerk, Resend, OpenAI, Anthropic,
  DocuSign, Sumsub, Cloudflare…) están definidas como **placeholders**. Se
  activan cuando se inyecta la variable de entorno correspondiente.
- Los formularios y datos guardados aceptan tanto el shape de la spec
  (claves en español) como el shape del PWA (claves en inglés).

---

## Quick start

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:4000
npm run smoke        # end-to-end check
```

Sin configurar nada más, ya tienes:

- `GET  /api`                       lista de endpoints
- `GET  /api/health`                heartbeat + `mockMode`
- `GET  /api/leads`                 listar leads (filtros: `?estatus`, `?plan`)
- `POST /api/leads`                 crear lead (acepta español o inglés)
- `PATCH /api/leads/:id`            actualizar lead
- `GET  /api/projects`              listar proyectos
- `POST /api/projects`              crear proyecto
- `PATCH /api/projects/:id`         actualizar proyecto
- `GET  /api/integrations`          catálogo de 7 categorías (match PWA)
- `GET  /api/integrations/:id`      categoría individual
- `GET  /api/pricing`               planes + extras de tienda
- `POST /api/assistant`             V (mock por contexto)
- `POST /api/payments/intents`      crear intención de pago (mock)
- `POST /api/payments/intents/:id/confirm`
- `POST /api/webhooks/{stripe|mercado-pago|clerk|make|jotform}`
- `GET  /api/webhooks/events`       inspeccionar webhooks recibidos

---

## Conexión con el frontend

> **TL;DR:** el patch listo para aplicar al PWA está en
> [`docs/pwa-integration/connect-backend.patch`](docs/pwa-integration/) — wirea
> el formulario de contacto y agrega estados de loading / éxito / error.
> Production build del PWA con el patch aplicado: ✅ pasa.

El repo del frontend (`turbillon50/v-momentum-pwa`) **aún no llama a ningún
backend** — los formularios solo hacen `console.log` y el chat de "V" es UI
visual. Para enchufarlos manualmente:

### 1. Definir la URL del API en el frontend

Crea `.env.local` en el repo del PWA:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Y un helper mínimo (sugerencia, ejemplo):

```ts
// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL!;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
```

### 2. Conectar el formulario de contacto

Archivo: `components/sections/contact-section.tsx` (línea ~59).
Reemplazar el `console.log` por:

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await api('/api/leads', { method: 'POST', body: JSON.stringify(formData) });
  alert('¡Gracias! Te contactaremos pronto.');
};
```

El backend acepta el `formData` literal del frontend
(`name`, `whatsapp`, `email`, `company`, `projectType`, `plan`,
`storePublish`, `urgency`, `description`, `consent`) — no hay que renombrar
nada. Internamente se almacena con alias en español y en inglés para que
cualquier consumidor (CRM, dashboard admin) tenga ambos.

### 3. Conectar precios e integraciones (opcional)

Hoy esas pantallas hardcodean los datos. Se pueden migrar a fetch así:

```tsx
// pricing-section.tsx
const { data } = useSWR('/api/pricing', () => api('/api/pricing'));

// integrations-section.tsx
const { data } = useSWR('/api/integrations', () => api('/api/integrations'));
```

El shape devuelto **espeja** lo que ya consume el componente, así que el
diff visual es cero.

### 4. Conectar la V (asistente)

Archivos: `components/v-assistant-modal.tsx` / `v-assistant-panel.tsx`.

```ts
const send = async (message: string) => {
  setState('thinking');
  const { response } = await api<{ response: any }>('/api/assistant', {
    method: 'POST',
    body: JSON.stringify({ message, context: currentSection, sessionId }),
  });
  setState(response.state);              // 'success' | 'thinking' | …
  setReply(response.reply);
  if (response.navigate) onNavigate(response.navigate);
};
```

El campo `response.state` mapea 1:1 a los estados del orbe en
`components/v-ai-core.tsx` (`idle | thinking | executing | success`).
`response.navigate` te da la sección a abrir cuando V recomienda navegar
(`precios`, `integraciones`, `proceso`, `demos`, `contacto`).

---

## Variables de entorno

Ver [`.env.example`](./.env.example). Todas son opcionales mientras
`MOCK_MODE=true`. Cuando inyectas una llave real, la integración
correspondiente se marca como `configured: true` en
`GET /api/integrations`.

| Variable                     | Para qué                          |
| ---------------------------- | --------------------------------- |
| `PORT`                       | Puerto local (default `4000`)     |
| `MOCK_MODE`                  | `true` por defecto                |
| `CORS_ORIGINS`               | URLs permitidas, coma-separadas   |
| `DATABASE_URL`               | Postgres (no requerido en mock)   |
| `STRIPE_SECRET_KEY`          | Pagos globales                    |
| `MERCADO_PAGO_TOKEN`         | Pagos LATAM                       |
| `CLERK_SECRET_KEY`           | Auth                              |
| `RESEND_API_KEY`             | Emails                            |
| `OPENAI_API_KEY`             | V (asistente)                     |
| `ANTHROPIC_API_KEY`          | V (asistente)                     |
| `DOCUSIGN_KEY`, `SUMSUB_KEY` | Legal / KYC                       |
| `CLOUDFLARE_TOKEN`           | Infra                             |

---

## Arquitectura

```
src/
├── app.js                Express app + CORS + error handling
├── server.js             arranque + graceful shutdown
├── config/index.js       lee .env, expone flags `mockMode` y `providers.*`
├── data/                 catálogos seed (integrations.json, pricing.json)
├── middleware/
│   ├── error.js          HttpError + handler global
│   └── validate.js       requireFields, isEmail, pick
├── routes/
│   ├── index.js          monta /api/*
│   ├── leads.js          POST/GET/PATCH (bilingüe)
│   ├── projects.js       POST/GET/PATCH
│   ├── integrations.js   GET catálogo + estado de configuración
│   ├── pricing.js        GET planes
│   ├── assistant.js      POST V con detección de intent
│   ├── payments.js       intents + confirm (mock)
│   └── webhooks.js       placeholders por provider
├── services/
│   ├── store.js          persistencia JSON en data/runtime/
│   └── assistant.js      lógica de V mockeada
└── …

data/runtime/             (gitignored) leads.json, projects.json,
                          payment_intents.json, webhook_events.json
```

`data/runtime/` se regenera al vuelo. Borrarlo es la forma más simple de
"resetear" la base mock.

---

## Migración a base de datos real

El módulo `src/services/store.js` es la única abstracción. Para pasar a
PostgreSQL:

1. Reemplazar `list/get/create/update/remove` por queries.
2. Mantener el mismo contrato (`{ id, createdAt, updatedAt, …data }`).
3. Las rutas no cambian.

Sugerencia: Drizzle o Prisma sobre `DATABASE_URL` (Neon o Supabase, ambos
ya en el catálogo de integraciones).

---

## Seguridad

- Nada sensible cruza al frontend. El backend nunca emite llaves.
- CORS por allowlist (`CORS_ORIGINS`).
- Validación de inputs en `middleware/validate.js`.
- `consent === false` en `/api/leads` se rechaza con 400.
- Webhooks: por ahora **no** verifican firma; antes de salir a prod hay que
  añadir verificación HMAC (`STRIPE_WEBHOOK_SECRET`,
  `MERCADO_PAGO_WEBHOOK_SECRET`, `MAKE_WEBHOOK_SECRET`,
  `JOTFORM_WEBHOOK_SECRET`).

---

## Smoke test

```bash
npm run smoke
```

Crea un lead en cada idioma, un proyecto, llama al asistente, crea y
confirma una intención de pago, y dispara un webhook de Stripe mock. Si
algo se rompe, falla con código != 0.
