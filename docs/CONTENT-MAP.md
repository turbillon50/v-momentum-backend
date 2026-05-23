# Content Map — V Momentum

Auditoría completa del contenido (no del código). Esto es lo que el usuario
final lee/ve, dónde vive cada pieza, y qué incongruencias hay entre el PWA
y el backend.

---

## TL;DR — el problema que vamos a resolver

Hoy hay **3 fuentes paralelas de contenido sin sincronizar**:

1. **PWA hardcoded** — cada `screen.tsx` tiene sus propios arrays de datos.
2. **Backend `src/data/*.json`** — pricing, integrations en JSON.
3. **Backend `src/services/assistant.js`** — copy de respuestas del bot V.

v0 sólo edita la #1 (front). El backend nunca se entera. El usuario ve lo
que diga la #1, pero los datos "fuente de verdad" del API son la #2/#3.
Resultado: si vendemos por el PWA un Plan Starter de $5,000 USD, el backend
internamente solo conoce un Plan Tradicional de $12,000 MXN. **Eso ya es
incongruencia comercial, no técnica.**

---

## Mapa de contenido — qué dice cada cosa hoy

### 1) Layout / SEO (`v-momentum-pwa/app/layout.tsx`)

| Pieza | Contenido actual |
|---|---|
| `<title>` | V Momentum \| SaaS Technology Apps Design |
| Description | "Diseñamos y desarrollamos apps listas para operar en días. Aplicaciones, sistemas y herramientas digitales con integraciones reales para vender, operar y escalar tu negocio." |
| Tagline OG | "Tu app. Tu negocio. Sin tensiones. Diseñamos y desarrollamos apps listas para operar en días." |
| Keywords | SaaS, apps, desarrollo, software, integraciones, automatización, IA, cloud |
| URL canónica OG | `https://vmomentum.app` |

### 2) Splash (`components/premium-splash.tsx` + `app/page.tsx`)

- Sólo el logo + ring de energía animado durante 2.2 s. Sin copy.

### 3) Home (`components/screens/home-screen.tsx`)

| Pieza | Contenido actual |
|---|---|
| Badge superior | "SaaS Technology Apps Design" |
| Headline | **"Escalamos ideas. Construimos productos. Generamos momentum."** |
| Subheadline | "Apps listas para operar en días con integraciones reales." |
| CTA hero | "Quiero mi app" |
| Servicios (chips) | Apps · Automatización · IA · Cloud · Performance |
| Capabilities | Pagos · Base de datos · Autenticación · Emails · Deploy · Seguridad |
| Stats hero | "días promedio" · "integraciones" |
| Tech stack (logos) | Next.js · Tailwind · Supabase · Clerk · Stripe · Vercel · Resend |
| Sección Proceso | "Replit creates. GitHub preserves. Vercel publishes. Cursor audits. ChatGPT directs." |

### 4) Integrations (`components/screens/integrations-screen.tsx`)

**8 categorías** (no coinciden con el backend):

`all · payments · database · ai · deploy · auth · communication · dev`

**~16 integraciones**, cada una con descripción + 4 features ES/EN:
Stripe, Mercado Pago, Supabase, Neon, Airtable, OpenAI, Anthropic,
Vercel, GitHub, Cloudflare, Clerk, Twilio, Resend, Cursor, Replit, Alchemy.

### 5) Process (`components/screens/process-screen.tsx`)

3 pilares principales: **Replit (CREA) · GitHub (CONSERVA) · Vercel (PUBLICA)**.
5 satélites de "AI Creation": AntiGravity · v0 · Figma · Lovable · Bolt.new.
4 FAQs: DNS, Frontend vs Backend, API Keys/Webhooks, manejo de secretos.

### 6) Pricing (`components/screens/pricing-screen.tsx`)

| Plan | USD | MXN | Entrega |
|---|---|---|---|
| MVP | **$2,500** | $45,000 | 10–15 días |
| Starter (popular) | **$5,000** | $90,000 | 15–20 días |
| Scale | **$10,000** | $180,000 | 25–30 días |

### 7) Contact (`components/screens/contact-screen.tsx`)

- Headline: "Hablemos de tu proyecto"
- Form: nombre · email · empresa · presupuesto · mensaje
- Sidebar: Calendly placeholder · `hola@vmomentum.com` · WhatsApp `+52 55 1234 5678` · Lun-Vie 9am-6pm CST
- Testimonial: *"V Momentum transformó nuestra idea en una app funcional en solo 2 semanas. Increíble."* — Carlos M., Founder @ TechStartup

### 8) Backend `src/data/pricing.json`

| Plan | Precio |
|---|---|
| Plan Tradicional | $12,000 MXN (50/25/25) |
| Plan Flexible | $3,000 + 11×$1,000 = $14,000 MXN |
| Addon App Store iOS | $5,000 MXN |
| Addon Google Play | $3,000 MXN |

### 9) Backend `src/data/integrations.json`

**7 categorías** (no coinciden con PWA):
`core · captacion · pagos · web3 · experiencias · legal · desarrollo`

~30 integraciones con shape `{ name, description, whenUsed, clientBenefit, status }`.

### 10) Backend `src/services/assistant.js`

Respuestas de "V" mockeadas por contexto:
- Inicio · Proceso · Integraciones · Precios
- Detección de intents: greeting · price · integration · process · demo · contact

---

## 🚨 Incongruencias críticas detectadas

| # | Tema | Frontend dice | Backend dice |
|---|---|---|---|
| 1 | **Precios** | MVP $2,500 / Starter $5,000 / Scale $10,000 USD | Tradicional $12k MXN / Flexible $3k+11×$1k MXN |
| 2 | **Categorías de integraciones** | 8 (`payments, database, ai, deploy, auth, communication, dev, all`) | 7 (`core, captacion, pagos, web3, experiencias, legal, desarrollo`) |
| 3 | **IDs de integraciones** | `mercadopago` (sin guión) | `mercado-pago` (con guión) |
| 4 | **Email de contacto** | `hola@vmomentum.com` (en contact-screen) | OG meta dice `vmomentum.app` |
| 5 | **WhatsApp de contacto** | `+52 55 1234 5678` ← placeholder, no es real |
| 6 | **Testimonial** | "Carlos M., Founder @ TechStartup" ← placeholder, no es real |
| 7 | **Calendly link** | `href="#"` ← roto |
| 8 | **Dominio** | OG meta `vmomentum.app` (no comprado aún) · contact dice `.com` (otra propiedad) |
| 9 | **Plan IDs** | `mvp, starter, scale` | `traditional, flexible` (lib/api.ts valida estos) |
| 10 | **El form del PWA** | manda `plan: 'mvp'` o `'starter'` | backend valida contra `traditional/flexible/undecided` → 400 |

**El #10 es el más crítico**: si alguien selecciona un plan en el form del
PWA y lo envía, el backend lo va a rechazar porque el plan ID no matchea.
Esto está rompiendo silenciosamente porque el campo `plan` del form actual
(`contact-screen.tsx`) no expone selector de plan, sólo `budget`. Pero si
v0 lo agrega más adelante con sus IDs, va a tronar.

---

## Placeholders que NO deberían estar en producción

- `hola@vmomentum.com` ← ¿es la real o debería ser `.app`?
- `+52 55 1234 5678` ← número falso, hay que poner el real
- `Carlos M., Founder @ TechStartup` ← testimonio inventado
- Calendly link `href="#"` ← apunta a nada
- OG image apunta a una URL de preview de v0 que va a expirar:
  `https://v0-v-momentum-pwa-git-v0-turbillo-92ab9c-...vercel.app/og-image.png`

---

## Propuesta de "fuente de verdad" futura

| Pieza | Hoy vive en… | Recomendación |
|---|---|---|
| Pricing | PWA arrays + backend JSON | Backend JSON (servir vía `/api/pricing`, PWA fetch) |
| Integraciones | PWA arrays + backend JSON | Backend JSON (servir vía `/api/integrations`, PWA fetch) |
| FAQs | PWA arrays | Backend JSON (`/api/faqs`) |
| Proceso (Replit/GitHub/Vercel) | PWA arrays | Backend JSON (`/api/process-pipeline`) |
| Hero copy + headline | PWA hardcoded | OK que viva ahí — es UI directa |
| Contacto (email/wa/calendly) | PWA hardcoded | Backend JSON `/api/contact-info` (cambiable sin redeploy) |
| Tagline / SEO | layout.tsx | OK ahí, pero usar `metadataBase` |

Una vez centralizado: **un solo cambio en el backend → toda la PWA actualiza**.
v0 puede iterar visual sin tocar copy. Y cuando me mandes las fotos con la
versión correcta del contenido, lo edito en una sola fuente.

---

## Lo que necesito de ti

Para reescribir todo con consistencia, las preguntas estratégicas son:

1. **¿Plan correcto cuál es?** ¿Los precios USD del PWA o los MXN del backend?
2. **¿Email real?** `hola@vmomentum.app` o `.com`?
3. **¿WhatsApp real?**
4. **¿Calendly real?** (link público)
5. **¿Testimonios reales?** ¿Tenemos clientes que cita-mos?
6. **¿La oferta es B2C o B2B?** (cambia tono y copy)
7. **¿"Hablamos de…" — propuesta de valor núcleo?** (la headline de Home)

Cuando me mandes las **fotos** te las leo y extraigo el contenido exacto.
Si están en español me das ya la fuente de verdad. Si son screenshots de
versiones que te gustaron, comparo y propongo cambios.
