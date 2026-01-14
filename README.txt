TornBC • Muggins (Option 2 package)

What you get
- muggins.html            Public page that shows the mugging list.
- muggins/latest.json     The data file you overwrite daily.
- js/muggins.js           Renders/sorts/filters and builds Attack links.
- tools/torn-muggins-collector.user.js  Tampermonkey script that helps YOU collect networth and copy latest.json.
- index.html              Your homepage with a new top-nav link: "Muggins".

Daily update workflow (you, the admin)
1) In Torn, open a target networth page like:
   https://www.torn.com/personalstats.php?ID=3853621&stats=networth&from=All
2) The collector script captures Total networth.
3) Click "Copy latest.json".
4) Paste into your repo file: muggins/latest.json (overwrite).
5) Push to GitHub Pages. Done.

Visitors
- Visit https://<your-site>/muggins.html
- Sort, search, filter, click Attack.

Notes
- Attack links require the visitor to be logged into Torn in their browser.
- If you want to hide the list sometimes, you can remove the nav link and keep the page unlinked.

