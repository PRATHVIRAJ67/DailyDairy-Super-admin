# DailyDairy Super Admin

The platform console for DailyDairy. DailyDairy is one app shared by many dairies; this is where the platform
operator (you) runs it:

| Page | What it does |
| --- | --- |
| Overview | Active and suspended dairies, customers, active plans, money collected in the last 30 days, and PIN codes where customers saved an address that no dairy serves yet |
| Dairies | Add a dairy together with its first owner, search, and check which dairy delivers to a PIN code |
| Dairy detail | Owners (add or remove), areas and PIN codes, totals, recent activity, edit details, suspend or reactivate with a reason |
| Leads | "Partner with us" requests from the website. Call them, keep a note, then **Add as dairy** (prefilled) |
| Activity | The audit log for every dairy and the platform |

It shows totals only. Customers' addresses, phone numbers and payments stay with each dairy.

Stack: Vite, React 19, TypeScript, TanStack Query, React Router, Tailwind CSS 4. Data comes from the DailyDairy API
(`services/api` in `Milkdelivery application`, routes under `/api/v1/platform`), the same API the app and the
partner dashboard use.

## How dairies, owners and customers fit together

- **You add a dairy** here with the owner's mobile number. Nobody can sign up as a dairy.
- **The owner** signs in to the partner dashboard (`DailyDairy-Dashboard`) with that number and adds their areas
  (PIN codes), suppliers and products. They only ever see their own dairy.
- **Customers** use one app. The PIN code of their delivery address decides which dairy serves them: a PIN code can
  belong to only one active area on the whole platform, so there is never a choice to make.
- **Suspending** a dairy stops its owner and suppliers from working and hides it from new customers. Deliveries
  that customers already paid for are kept.

## Become a super admin

Only possible from the database, never from an app. In `Milkdelivery application`:

```bash
node services/api/scripts/make-super-admin.mjs +91XXXXXXXXXX "Your Name"
```

Any other number that signs in here sees "No platform access", and the API refuses every `/platform` call from it.

## Commands

```bash
npm install
npm run dev        # http://localhost:5175 (uses .env)
npm test
npm run build
npm run deploy     # build + deploy to Cloudflare (needs `npx wrangler login` once)
```

Sign-in works like the partner dashboard: with `VITE_TEST_LOGIN=1` the shared test code, otherwise SMS OTP through
Supabase. `.env.production` holds only public values.

Deployed as `dailydairy-super-admin` on Cloudflare: https://dailydairy-super-admin.prathviholla67.workers.dev. The API
already allows this origin (`CORS_ORIGINS` in `services/api/wrangler.jsonc`); add your custom domain there too.
