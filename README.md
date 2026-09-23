# Keydris Stripe MPP Seller MCP

Seller-side Stripe Machine Payments Protocol server. It provides catalog
quotes, signed payment challenges, governed PaymentIntent creation, refunds,
and payment status through the Keydris policy gateway.

## Requirements

- Node.js 22.22.2 or newer
- A Keydris agent routed through an MCP Kit Reader connection
- A seller Stripe payment profile enabled by the agent policy

## Configure

Copy `.env.example` to `.env` for local development. Set these values in
Manufact for hosted deployments:

- `KEYDRIS_GATEWAY_URL`
- `STRIPE_NETWORK_ID`
- `SELLER_CHALLENGE_SIGNING_SECRET`
- `SELLER_CATALOG_JSON`
- `SELLER_CHALLENGE_TTL_SECONDS` (optional)

Normal MCP requests carry the single-use token in
`params._meta["keydris/kit_action_token"]`.

The agent supplies amount, currency, method, and transaction type. It does not
supply a Keydris payment connection id. During redemption, Keydris selects the
single seller Stripe connection allowed by the runtime session's policy version
for purchase, refund, and payment-status calls. Calls fail closed when no seller
connection or more than one seller connection matches.

## Develop

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Deploy to Manufact

```bash
npx --no-install mcp-use login
npm run deploy -- --name keydris-seller-mcp --open
```

Configure the seller environment variables in Manufact before exercising its
tools. After the first GitHub-backed deployment, pushes to the configured
production branch redeploy this server automatically.

## Marketplace admission

The server exposes `keydris_reader_verify` for Keydris Marketplace admission.
The marketplace sends one nonce-bound probe for each supported challenge. The
tool reports the installed KIT Reader version (`0.1.0`), rejects the negative
probes, and accepts only `valid_canary`. Publish the seller using KIT Reader
version `0.1.0`; a different declared version fails verification instead of
silently accepting an incompatible reader.

## Kit Reader boundary

`src/keydris` is an unchanged vendored subset of the open-source Apache-2.0
Kit Reader. `src/keydris-payment` is this server's adapter for sending the
downstream target and payment context to the Keydris gateway. The backend alone
evaluates payment policy and chooses whether credentials may be released.
