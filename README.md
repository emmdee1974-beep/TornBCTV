# TornBC TV — 2026 Revamp

A streamlined static rebuild designed for Cloudflare Pages / GitHub Pages style hosting.

## Main pages
- `index.html` — clean home page + TornBC Music Hour playlist
- `watch.html` — main TornBC TV YouTube playlist + featured shorts
- `elimination-2025.html` — The Punchbags Files / 11-video Elimination archive
- `thunder-maker.html` — The Thunder Maker four-part series (permanent main toolbar item)
- `tools.html` — streamlined utilities
- `archive.html` — links to old site sections
- `about.html`

## Preserved material
The old HTML pages are copied into `/legacy/` so content is not lost while keeping the main site uncluttered.

## Deployment
Upload the contents of this folder to the root of the GitHub repository connected to Cloudflare Pages. No build step is required.

## 2026 Punchbags archive update
- Rebuilt `elimination-2025.html` as **The Punchbags Files** retrospective.
- Added five cleaned surviving campaign images under `assets/elimination/`.
- Added `elimination-submission.html` and `newspaper-submission.txt` for the Torn newspaper call.
- The YouTube playlist remains the video master archive; episode card chapter names are editorial archive labels, not claimed YouTube titles.


## 2026 Revamp v3
- Restored the five known Malice/Pinguux propaganda archive links from Torn.
- The Elimination gallery now loads the full archived Torn originals when online.
- Local copies remain bundled as automatic fallbacks if a Torn image link ever stops working.
- Restored the full propaganda wall to the Punchbags Files gallery.


## v4 archive update
- Re-edited The Punchbags Files into a five-chapter story.
- Integrated surviving Malice/Pinguux campaign posters into the chronology.
- Re-grouped all surviving Elimination Shorts as campaign, propaganda, breaking news, field reports and epilogue.
- Preserved the YouTube master playlist and Torn-hosted image archive links.

## v5 image reliability fix
- Embedded all five Elimination propaganda images directly inside `elimination-2025.html` as PNG data.
- Local copies remain under `assets/elimination/` as archive backups.
- This prevents missing poster images if the assets directory is skipped during a partial GitHub/Cloudflare update.


## 2026 revamp v9
- Rebuilt The Thunder Maker as a four-part story/video feature.
- Added preserved forum screenshot and cover art.
- Added direct original forum link.
- Expanded Tools into the Digital Longhouse script shelf.
- Refreshed Watch, Archive and About pages.
- Scanned local site links and asset references before packaging.

## Elimination Betting
The site now includes an Elimination-only pari-mutuel betting desk. Bettors authenticate with a Torn Limited/custom API key restricted to `user -> basic`; the key is not stored. Bets are tied to the authenticated Torn player ID. See `BETTING-SETUP.md` for Cloudflare D1/Pages Functions deployment.
