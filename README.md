# TKAIPro Shop

Independent reseller storefront for **Google AI** and **Antigravity** accounts.

- Domain: https://tkaipro.shop
- Brand: TKAIPro
- Stack: Next.js + Better Auth + Postgres + SePay (same architecture as figma-shop)
- Port (VPS): `127.0.0.1:3003`
- DB: `tkaipro` / user `tkaipro_app`

## Local

```bash
cp .env.example .env
# fill DATABASE_URL and secrets
bun install
bun run db:push
bun run seed:google-ai
bun run dev
```

## VPS

```bash
DOMAIN=tkaipro.shop bash /app/tkaipro-shop/scripts/setup-vps.sh
# fill .env secrets, then:
bash /app/tkaipro-shop/scripts/deploy.sh
```

## Seed products

| Slug | Name | Placeholder price (VND) |
|------|------|-------------------------|
| `google-pro` | Google AI Pro | 199,000 |
| `google-ultra` | Google AI Ultra | 499,000 |
| `google-antigravity-pro` | Google Antigravity Pro | 249,000 |
| `google-antigravity-ultra` | Google Antigravity Ultra | 599,000 |

## Notes

- Temporary nginx `X-Robots-Tag: noindex` until content is approved.
- Add Google OAuth redirect: `https://tkaipro.shop/api/auth/callback/google`
- Add SePay webhook: `https://tkaipro.shop/api/webhooks/sepay`
