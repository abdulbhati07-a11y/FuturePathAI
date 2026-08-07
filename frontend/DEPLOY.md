# Deploying the frontend to Cloudflare Pages

The frontend is a static Vite/React build. Cloudflare Pages hosts it free with
**unlimited bandwidth**, global CDN, and free SSL.

## One-time setup

1. Push this repo to GitHub (or GitLab).
2. Go to **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo, then set:

   | Setting | Value |
   |---|---|
   | **Framework preset** | Vite |
   | **Root directory** | `frontend` |
   | **Build command** | `npm run build` |
   | **Build output directory** | `dist` |

4. Under **Environment variables**, add:

   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com` *(the deployed NestJS URL, no trailing slash)* |
   | `VITE_USE_MOCKS` | `false` |

5. **Save and Deploy.** Every push to the main branch redeploys automatically.

## What's already wired for you

- **`public/_redirects`** — `/* /index.html 200` so client-side routes (e.g.
  `/simulations/123/results`) don't 404 on refresh. **This is the file that
  makes SPA routing work on Pages** — don't delete it.
- **`public/_headers`** — long-cache for fingerprinted `/assets/*`, no-cache for
  `index.html`, plus baseline security headers.
- **`.env.example`** — the two env vars the app reads.

## After it's live

The frontend calls the backend at `VITE_API_BASE_URL`. Two things must line up:

1. **CORS** — the NestJS backend must allow the Pages origin
   (`https://<project>.pages.dev` and any custom domain).
2. **Backend must be deployed first** (or at least reachable) so the UI has an
   API to talk to. Until then, set `VITE_USE_MOCKS=true` to demo the UI standalone.
