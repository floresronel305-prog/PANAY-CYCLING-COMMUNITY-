# Panay Cycling Community (RON)

Personal project by Ronel S. Flores. Static website: index.html, style.css, app.js, plus.js, pro.js, ultra.js, sync.js, config.js, logo.png.

## 1. Deploy on Render
1. Upload this folder to a GitHub repository.
2. Render > New > Static Site > pick the repository.
3. Build command: (leave empty). Publish directory: `.`
4. Open the site over HTTPS (needed for Live GPS, camera and compass).

## 2. ONE shared server for everyone (do this once)
Without this step every phone only sees its own data. With it, all users share accounts, chat, photos, group rides, leaderboard, live GPS, wallet/shop/jobs, announcements and admin map pins.

1. console.firebase.google.com > Create project.
2. Build > Realtime Database > Create database (Singapore) > Start in test mode.
3. Rules tab: paste this and Publish:
```
{"rules":{".read":true,".write":true}}
```
(or the long form: users, uphotos, live, chat, photos, events, leaders, ann, pois, px each with ".read":true,".write":true)
4. Copy the database URL and paste it into `config.js` (`LIVE_URL`). Upload `config.js` again.
   Alternative: log in as admin > Admin > Shared server > paste URL > Save & test > "Share connect link". Anyone who opens that link once is connected.
5. The site shows a green "Connected to the shared server" card on Home and in Settings when it works.

## Admin login (do this FIRST)
admin@panaybike.ph / admin123. Log in once right after connecting the server and change the password in Settings, so nobody else can claim the admin account.

## Live GPS: see all riders
- Every rider turns on "Live location" (Home, Map or Settings). They appear on everyone's Map and in the "Riders live now" list.
- Position is sent every few seconds and also every 20 seconds as a heartbeat. Riders who stopped sharing recently show faded as "last seen".
- Admin > Members > Locate jumps to a rider.
- Browsers pause GPS when the phone is locked or the app is in the background. Use "Keep screen on" on the Map while riding.

## Notes
- Accounts are now stored on the server (passwords are hashed). Old accounts on a phone are moved to the server the next time they log in.
- IMPORTANT: with open Firebase rules, security is enforced in the app only. Before handling real money (Wallet), add Firebase Authentication + proper rules and a payment gateway (PayMongo/GCash).
- Map: OpenStreetMap tiles, Overpass API for gas stations, stores, vulcanizing, etc.

## Ultra AR (ultra.js / ultra.css)
10 browser AR features under the **Ultra** tab. Camera, GPS and compass require HTTPS and permission.

## Company layer (company.js / company.css)
Inbox tab: General/Rides/Marketplace rooms + private DMs stored on Firebase (/chat, /rooms, /dm, /dmidx, /typing). Demo-money Send in DMs, Top up on Home, hero + quick actions. Needs LIVE_URL in config.js. Demo money only.

## Elite layer (elite.js / elite.css)
Bottom tab bar (phones), floating SOS, splash, Challenges & badges (More > Challenges), ride chat rooms (Rides page), online presence dots, admin stats. All data on the same Firebase server.

## Extra layer (extra.js / extra.css)
Wallet card + QR (My QR, Scan to pay, DEMO money), voice messages in chat (🎤), ride summary image (Share) after a ride. Server: same Firebase (/px, /ridelog, chat paths).

## Final layer (final.js)
Polls, Ride calculator, Help & FAQ, Feedback (admin sees it in Admin), About-the-developer card. Data: /polls and /feedback on Firebase.

## Tourist spot photos (spots.js)
Admin: Admin page > Tourist spot photos (Change / Reset), or the 📷 button on Home tourist cards. Saved on Firebase at /spotimg.
