# Panay Cycling Community (RON)

Static website: index.html, style.css, app.js, logo.png.

## Deploy on Render
1. Upload this folder to a GitHub repository.
2. Render > New > Static Site > pick the repository.
3. Build command: (leave empty). Publish directory: `.`
4. Open the site over HTTPS (needed for Live GPS).

## Admin login
admin@panaybike.ph / admin123 (change the password in Settings).

## Notes
- Map: OpenStreetMap tiles. Gas stations, stores, vulcanizing, etc. load live from OpenStreetMap (Overpass API).
- Accounts, chat and photos are saved in each visitor's browser (localStorage). For shared accounts, add a backend such as Firebase or Supabase.

## Live rider locations (see other riders on different phones)
1. console.firebase.google.com > Create project.
2. Build > Realtime Database > Create database (Singapore) > Start in test mode.
3. Rules tab: paste `{"rules":{"live":{".read":true,".write":true},"chat":{".read":true,".write":true},"photos":{".read":true,".write":true},"events":{".read":true,".write":true},"leaders":{".read":true,".write":true}}}` and Publish.
4. Copy the database URL and paste it into config.js (LIVE_URL). Upload config.js again.
Riders appear on the map only while their browser is open and location sharing is ON.

## Community chat
Chat, ride photos, group rides (`events`) and the leaderboard (`leaders`) use the same Firebase database (the rules above). Without LIVE_URL, they only work on one device.

## Panay Wallet, Shop, Jobs, LGU (plus.js)
Added without removing anything. Uses the same Firebase LIVE_URL under `/px`. Add this to your Firebase rules: `"px":{".read":true,".write":true}`.
IMPORTANT: with open rules and browser-stored accounts, "own data only" is enforced in the app screens, not by the database. Before handling real money, add Firebase Authentication + rules (e.g. `auth.uid===$uid`) and a payment gateway (PayMongo/GCash) for real top-ups.
