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
