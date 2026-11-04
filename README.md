# Apex Riviera Real Racing

Browser F1 racing: six circuits (Monaco, Austin, Silverstone, New York at sunset, Tokyo at night, Mumbai), 19 AI drivers, weather, pit stops, a spoken race engineer, keyboard and full controller support, and online multiplayer.

```
public/              your website (deploy this folder to Vercel)
  index.html         homepage: big photo, name, tagline, game launcher (opens in its own window)
  me.png             your cutout photo (transparent background)
  preview.jpg        game screenshot (also the image in link previews)
  vercel.json
  play/index.html    the game (three.js and PeerJS included)
  play/config.js     your relay server address
relay/               the online race server (deploy to Render)
  server.js
  package.json
```

To change the tagline, edit the `<p class="tag">` line (and the two description lines at the top) in `public/index.html`.

## Go live in 3 steps

### 1. Put this folder on GitHub
Create a new repository (for example `apex-riviera`) and upload everything in this folder.

### 2. Deploy the game on Vercel
1. vercel.com → **Add New… → Project** → import the repository.
2. **Root Directory:** `public`  ·  **Framework Preset:** Other  ·  no build command.
4. Your site is live at `https://<project>.vercel.app` and the game at `/play/`.
3. **Deploy.** You get a link like `https://apex-riviera.vercel.app`.

Online play already works at this point using direct peer-to-peer connections (no server). Step 3 makes it more reliable and adds Quick match.

### 3. (Recommended) Deploy the race relay on Render
1. render.com → **New → Web Service** → connect the same repository.
2. **Root Directory:** `relay`  ·  **Build Command:** `npm install`  ·  **Start Command:** `npm start`  ·  Instance type: Free.
3. Deploy, then copy the service address, for example `https://apex-riviera-relay.onrender.com`.
4. In `public/play/config.js` set:
   ```js
   window.APEX_RELAY = "wss://apex-riviera-relay.onrender.com";
   ```
   (same address, but starting with `wss://`). Commit — Vercel redeploys on its own.

Opening the relay address in a browser shows `apex-riviera relay ok`. Render's free tier sleeps after 15 minutes without players; the first person to connect wakes it up (up to a minute).

### 4. Your own domain
1. Buy the domain (Vercel → Domains → Buy is simplest; Namecheap, Cloudflare or GoDaddy also work).
2. Vercel project → **Settings → Domains → Add** → `yourname.com`, then add `www.yourname.com` and set it to redirect to `yourname.com`.
3. If you bought it on Vercel, you're done. Otherwise, in your registrar's DNS settings add the records Vercel shows on the domain card — usually an **A** record for `@` (typically `76.76.21.21`) and a **CNAME** for `www` pointing to the target Vercel gives you. Delete any old A/CNAME records for `@` and `www` first.
4. Wait for the green "Valid Configuration" tick (minutes to a few hours). HTTPS is automatic.
5. Optional: a branded race server address. In Render → your relay → **Settings → Custom Domains** add `race.yourname.com`, add the CNAME Render shows at your registrar, then put `wss://race.yourname.com` in `public/play/config.js`.

## Playing online
- **Online multiplayer → Create room.** Press **Copy invite link** and send it. Anyone who opens the link lands in your room.
- Friends can also type the 5-letter room code and press **Join room**, or press **Quick match** to drop into any open room (relay only).
- The room creator is the host: their circuit, laps, weather, AI setting and start lights apply to everyone. If the host leaves mid-race, another driver takes over the AI cars.
- Up to 20 drivers per room. AI fills the rest of the grid unless the host picks "Humans only".

## Run it on your own computer
```
cd relay && npm install && npm start          # relay on ws://localhost:8787
npx serve public                              # site on http://localhost:3000, game at /play/
```
Set `window.APEX_RELAY = "ws://localhost:8787";` in `public/play/config.js` while testing locally.

## Controls
Keyboard: arrows / WASD drive, E/Q shift, Space DRS, C or 1–5 cameras, B look back, P box, T tyre, R reset, M mute, Esc pause.
Controllers: Xbox, PlayStation, Samsung and most USB/Bluetooth pads — press any button, then open **Controller** to remap.

## Credits
Circuit geometry for Monaco, Austin and Silverstone: bacinger/f1-circuits (MIT). three.js (MIT). PeerJS (MIT).
All teams, drivers, sponsors and the New York, Tokyo and Mumbai layouts are fictional.
