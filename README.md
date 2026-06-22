# Agentic Storefront

An open-source storefront template where shoppers describe what they want in plain English — an agent finds products, streams them in real time, and lets customers virtually try them on before buying.

Fork it, swap in your brand config and catalog, deploy in minutes.

---

## Features

- **Conversational discovery** — natural language search, no filters or dropdowns
- **Streaming agent responses** — products appear card-by-card via SSE as the agent searches
- **Virtual Try-On** — upload a photo, see any garment on you in ~30s via fal.ai
- **Outfit building** — agent finds complementary pieces for a complete look
- **Persistent cart** — add by size, adjust quantity, slide-out drawer
- **Full checkout** — COD order flow with address validation
- **Admin portal** — edit brand name, agent persona, catalog, and analytics live

---

## Stack

- **Next.js 14** (App Router) · TypeScript · Tailwind CSS
- **OpenRouter** — `openai/gpt-4o-mini` with streaming tool use
- **fal.ai** — `fal-ai/nano-banana-2/edit` for Virtual Try-On
- **MongoDB + Mongoose** (optional) — users, orders, conversations, catalog
- **Web Crypto API** — zero-dependency password hashing and session tokens

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Ionio-io/agentic-storefront
cd agentic-storefront
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `FAL_KEY` | ✅ | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) |
| `MONGODB_URI` | Optional | Atlas connection string — enables accounts, orders, analytics |
| `ADMIN_SECRET` | Production | Signs admin session cookie |
| `USER_JWT_SECRET` | Production | Signs shopper session cookie |
| `ADMIN_USERNAME` | Optional | Default: `admin` |
| `ADMIN_PASSWORD` | Optional | Default: `westside2024` — change before going public |
| `NEXT_PUBLIC_APP_URL` | Production | Your deployed URL |

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin) — `admin` / `westside2024`

---

## Customizing

1. **`data/brand.ts`** — change `DEFAULT_BRAND` (name, tagline, agent name, persona)
2. **Admin → Catalog** — upload a Shopify JSON export or use the built-in demo products
3. **Admin → Agent Config** — edit agent name and persona live (no redeploy)
4. **Admin → Brand Identity** — update storefront name, tagline, description

Changes take effect within 15 seconds — no redeployment needed.

---

## Deploying to Vercel

```bash
vercel deploy
```

Set all environment variables in Vercel dashboard under `Settings → Environment Variables`.

> **Virtual try-on:** fal.ai takes ~30–40s. Vercel Hobby has a 10s function timeout — use **Vercel Pro** or deploy to Railway/Render/Fly.io.

> **MongoDB:** Use [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas). Add your deployment IP to Atlas Network Access.

---

## Without MongoDB

The app runs fully without MongoDB:
- Chat, agent, product search (static catalog), virtual try-on, cart, checkout all work
- User accounts, order history, conversation persistence, and analytics require MongoDB

---

## Project Structure

```
app/
  page.tsx              # Landing page
  chat/page.tsx         # Chat UI — reads brand config, passes to ChatWindow
  admin/                # Admin portal (brand, agent, catalog, analytics, users)
  api/
    agent/route.ts      # SSE streaming agent with tool use
    brand/route.ts      # Brand config (public GET / admin POST)
    vton/route.ts       # Virtual try-on proxy
    orders/route.ts     # Order creation + history
    catalog/route.ts    # Catalog (MongoDB or static fallback)
components/
  chat/                 # ChatWindow, MessageBubble, ChatInput, CartDrawer, VTOWidget
  admin/                # AdminDashboard
data/
  products.ts           # Demo catalog (static fallback)
  brand.ts              # DEFAULT_BRAND — edit this to rebrand
lib/
  agent-tools.ts        # Tool implementations (MongoDB-first, static fallback)
  brand-config.ts       # Brand config with 15s TTL cache
  mongodb.ts            # Mongoose connection + schemas
  vton.ts               # fal.ai wrapper with VTO prompts
```

---

## Contributing

PRs welcome. Run `npm run build` before submitting — must pass with zero TypeScript errors.

## License

MIT
