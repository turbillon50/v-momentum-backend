# PWA integration patch

This folder contains the **single patch** that wires the V Momentum PWA
(`turbillon50/v-momentum-pwa`) to this backend.

## What the patch does

- Adds `lib/api.ts` — a typed fetch client that reads `NEXT_PUBLIC_API_URL`.
- Modifies `components/screens/contact-screen.tsx` (the active form in the
  current screens-based UI):
  - Wires `handleSubmit` to `POST /api/leads` (was `setTimeout` + setSubmitted).
  - Adds inline error banner above the submit button.
  - Shows the backend `lead_xxx` ID under the success message.
  - If `NEXT_PUBLIC_API_URL` is not set, falls back to "soft success" so previews
    don't look broken before the backend is wired.

Nothing else in the PWA is touched. Hero, splash, integrations, pricing and
the V assistant module are left untouched — the backend's `/api/integrations`,
`/api/pricing` and `/api/assistant` are ready to be wired by the same agent
that iterates the UI when you give the go-ahead.

## How to apply

```bash
git clone https://github.com/turbillon50/v-momentum-pwa.git
cd v-momentum-pwa
curl -fsSL https://raw.githubusercontent.com/turbillon50/v-momentum-backend/main/docs/pwa-integration/connect-backend.patch | git apply
echo "NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.vercel.app" > .env.production.local
git add -A
git commit -m "feat: wire contact form to backend API"
git push origin main
```

Then in Vercel project `v0-v-momentum-pwa` → **Settings → Environment Variables**
add `NEXT_PUBLIC_API_URL` for Production and redeploy.

## Verification

Production build was confirmed locally (`pnpm next build`) — passes with
0 errors introduced by the patch. (Pre-existing TS errors in unrelated files
are bypassed by `next.config.mjs:typescript.ignoreBuildErrors`.)

## Validation in the browser

1. Open `vmomentum.app/#contacto` (or the Vercel preview).
2. Fill the form, accept consent.
3. Click *Enviar mi proyecto*.
4. You should see a green banner with `lead_xxxxxxxxxxxx`.
5. Verify it landed:
   ```bash
   curl https://YOUR-BACKEND.vercel.app/api/leads
   ```
