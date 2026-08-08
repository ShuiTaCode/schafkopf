# Schafkopf

Bayerisches Schafkopf im Browser: **du gegen drei Computer** (Sepp, Hias, Wastl).

**Live:** https://schafkopf.shui-ta.com (Authentik Forward Auth, Gruppe `app-schafkopf`)

## Spielen (lokal)

```bash
npm install
npm run dev
```

Öffne http://127.0.0.1:5173/

## Umfang (MVP)

- Langes Blatt (32 Karten)
- Rufspiel, Farbsolo, Wenz
- Farb-/Trumpfzwang, Rufsau, Davonlaufen
- Heuristik-Bots
- Mobile-optimierte UI
- Alles läuft im Frontend (kein Backend)

## Qualität

```bash
npm test
npm run build
```

## Deploy (Hetzner)

CI baut ein nginx-Image und deployt nach `/opt/apps/schafkopf` hinter Traefik + Authentik Forward Auth.

Secret: `HETZNER_SSH_PRIVATE_KEY`
