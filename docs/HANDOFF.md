# Handoff — V Momentum a producción

> **🚀 Estado actual: PUBLICADO Y FUNCIONANDO**
>
> - **Backend:** https://v-momentum-backend.vercel.app · `/api/health` → ok
> - **PWA:**     https://v0-v-momentum-pwa.vercel.app · form conectado
> - **Lead test E2E:** `lead_59371eb6d474` aceptado por backend desde origin del PWA
>
> El único paso pendiente para que sea "producto en producción" es comprar el
> dominio `vmomentum.app` ($14.99 USD/año) y attacharlo al proyecto del PWA.
> Las integraciones reales (Stripe, Resend, Clerk, IA) son la siguiente fase.

Documento original (los 3 pasos manuales) — ya solo aplica el #3:

---

## Lo que YA está listo (programable)

| Pieza | Estado | Dónde |
|---|---|---|
| Backend Express + 8 endpoints | ✅ Código + tests | rama `claude/build-pwa-backend-api-5X0gt`, PR #1 |
| Backend serverless (Vercel) | ✅ `vercel.json` + `api/index.js` | mismo branch |
| Smoke test E2E | ✅ Pasa file y memory mode | `npm run smoke` |
| Catálogos de integraciones / pricing | ✅ Coinciden con el PWA | `src/data/*.json` |
| CORS abierto a `*.vercel.app` y `vmomentum.{app,com,mx}` | ✅ | `src/app.js` |
| Patch del PWA — wire del form al backend | ✅ Compilado y validado | `docs/pwa-integration/connect-backend.patch` |
| Disponibilidad de dominio `vmomentum.app` | ✅ $14.99 USD / año | Verificado vía Vercel API |

---

## Las 3 acciones que tienes que hacer (manuales)

### 1. Importar el backend en Vercel (≈ 2 min)

1. Abre [vercel.com/new](https://vercel.com/new) en tu team `luis' projects`.
2. Click en **Import** junto al repo `turbillon50/v-momentum-backend`.
3. **Branch**: `main` (o `claude/build-pwa-backend-api-5X0gt` si quieres deployar antes de mergear el PR).
4. **Framework preset**: dejar en *Other* (Vercel detecta `vercel.json` y configura solo).
5. **Environment Variables**:
   - `MOCK_MODE` = `true`
   - `STORE_BACKEND` = `memory` (opcional; se autodetecta por `VERCEL=1`)
6. Click **Deploy**. Vercel devuelve una URL tipo `v-momentum-backend.vercel.app`.

Verifica que responda:
```bash
curl https://TU-URL.vercel.app/api/health
# → { "ok": true, "mockMode": true }
```

### 2. Aplicar el patch al PWA y deployar (≈ 5 min)

```bash
git clone https://github.com/turbillon50/v-momentum-pwa.git
cd v-momentum-pwa
git apply ~/Downloads/connect-backend.patch   # o copia desde este repo

# Configura la URL del backend del paso 1
echo "NEXT_PUBLIC_API_URL=https://TU-URL.vercel.app" > .env.production.local

git add -A && git commit -m "feat: wire contact form to backend API"
git push origin main
```

El push dispara el deploy automático en Vercel. Cuando termine:

1. Ve al proyecto `v0-v-momentum-pwa` → **Settings → Environment Variables**.
2. Agrega `NEXT_PUBLIC_API_URL` = `https://TU-URL.vercel.app` para Production.
3. **Deployments → Redeploy** del último commit (la var se inyecta en build).

Test final: ve a `v0-v-momentum-pwa.vercel.app/#contacto`, llena el formulario,
verifica que aparece el banner verde con el `lead_xxxx` ID.

### 3. Comprar el dominio `vmomentum.app` (≈ 1 min)

1. [vercel.com/domains/search?q=vmomentum.app](https://vercel.com/domains/search?q=vmomentum.app)
2. Confirma compra ($14.99 USD/año).
3. Vercel lo asigna automáticamente al team. Después en **Project Settings →
   Domains** del PWA, attach `vmomentum.app` y `www.vmomentum.app`. DNS auto-config.

---

## Lo que sigue (después de "publicado")

Estas son **integraciones**, no setup. Cuando quieras activarlas, una a una:

| # | Integración | Lo que necesita | Trabajo |
|---|---|---|---|
| 1 | **Resend** (emails) | API key | Variable de entorno + 1 endpoint nuevo `/api/emails/welcome-lead` |
| 2 | **Supabase** (DB real) | URL + anon key | Reemplazar memory store por Postgres adapter (~2h) |
| 3 | **Stripe** (pagos) | Secret + webhook secret | Cambiar `/api/payments/intents` de mock → real (~1h) |
| 4 | **Clerk** (auth) | Pub + secret | Middleware en backend + provider en PWA |
| 5 | **OpenAI o Anthropic** (V real) | API key | Cambiar `services/assistant.js` `reply()` por llamada SDK |
| 6 | **Mercado Pago** | Token | Equivalente a Stripe pero MX/LATAM |
| 7 | Webhooks reales | HMAC secrets | Agregar verificación de firma en `routes/webhooks.js` |

Todas estas las puedo ejecutar yo cuando me digas "siguiente". El código ya
deja un `seam` claro en cada caso.

---

## Por qué no pude completar yo el deploy

Mi MCP de Vercel en esta sesión es **read-mostly**: puedo listar proyectos,
ver deployments, leer logs y verificar dominios — pero **no expone**:

- `create_project` (importar repo desde GitHub)
- `deploy_project` (trigger manual de deploy)
- `add_env_var` (configurar variables)
- `purchase_domain` (compra real, requiere confirmación humana de cargo)

Y mi GitHub MCP está scoped a `v-momentum-backend` solamente, así que no puedo
pushear el patch al repo del PWA. Por eso la pelota va a tu cancha por exactamente
los 3 clicks/comandos arriba — todo lo demás está cocinado.
