# TornBCTV Elimination Betting — v2 setup

This version changes betting from a typed player name to **Torn-account authentication**.

## Player connection

A bettor creates a Torn **Limited/custom API key** with only `user -> basic`, then pastes it into the TornBCTV betting page. TornBCTV calls `user/basic` to identify the player, creates a short-lived HTTP-only site session, and stores only the Torn player ID/name. The API key itself is not stored in D1.

This follows Torn's custom-key model: custom keys can be restricted to exact selections, but Torn warns that custom keys should still be treated like full-access credentials. The betting site should therefore never log, display, or persist a player's key.

## Required server secrets / variables

- `TORN_API_KEY` — dedicated server key for reading the current Elimination standings.
- `PAYMENT_API_KEY` — dedicated key for the Torn account receiving bets, with the minimum log access needed to verify incoming payments.
- `PAYMENT_RECIPIENT_NAME` — display name of the payment account.
- `PAYMENT_RECIPIENT_ID` — Torn ID of the payment account.
- `FEE_BPS` — service fee in basis points; `500` = 5%.
- `MIN_BET` — minimum bet, e.g. `100000`.
- `SYNC_SECRET` — secret protecting internal sync/verification calls.

## Database

Run `schema.sql` against the Cloudflare D1 database. New tables are `players` and `sessions`; `bets.player_id` is now required so every bet is tied to the authenticated Torn account.

## Payment verification

Torn's API is read-only. Players send cash manually to the designated Torn account; the backend verifies the receipt. The player's Limited key is for identity, not for moving money.

The payment verifier must be mapped to the exact current `user/log` payload for the payment account before production. Torn exposes a dedicated `user/log` endpoint, and Torn now supports custom keys restricted to specific log categories. Test the payment account with a small real transaction and record the exact returned log shape before enabling automatic activation.

## Sync

Call `POST /api/betting/sync` with `x-sync-secret: <SYNC_SECRET>` on a schedule (for example every 30–60 seconds during the event). It pulls the live Elimination standings and updates the local team list without changing the betting pools.

## Important operating rule

This is a pari-mutuel pool, not fixed-odds house betting. The displayed multiplier is only a projection. Settlement is:

`winner pool = confirmed bet pool × (1 - service fee)`

Each winning bet receives its proportional share of the winner pool. That keeps the mathematical payout bounded by confirmed money in the pool, subject to your published rules and actual account/security risks.

## Production checklist

1. Create D1 and run `schema.sql`.
2. Configure all secrets above.
3. Run `/api/betting/sync` and verify the live teams are populated.
4. Test a player connection with a brand-new Torn custom key containing only `user -> basic`.
5. Test a tiny payment and inspect `/user/log` output from the payment account.
6. Harden payment matching and idempotency using the exact current log fields.
7. Add explicit betting-open/close and settlement controls before real money is accepted.
8. Never put any Torn API key in front-end JavaScript, GitHub, HTML, or a public environment variable.


## Manual payout workflow

For launch, payment verification and payouts can be handled manually:

1. Open `betting-admin.html` over HTTPS.
2. Enter the `ADMIN_SECRET` configured in Cloudflare.
3. Independently verify the Torn cash transfer in the betting account.
4. Click **CONFIRM PAID** for the matching bet.
5. After Elimination ends, choose the winning team and close the event.
6. The public `payouts.html` page automatically lists each winning bettor, Torn ID, original stake, and exact amount to pay.

The site never sends Torn cash. It only records your manual confirmation and calculates the proportional payout from the confirmed pool.
