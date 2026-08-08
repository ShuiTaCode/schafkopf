# Schafkopf

Bayerisches Schafkopf im Browser — allein gegen drei Computer (Sepp, Hias, Wastl).

**Spielen:** https://schafkopf.shui-ta.com

## Lokal starten

```bash
npm install
npm run dev
```

Dann http://127.0.0.1:5173/ öffnen.

## Was drin ist

- Langes Blatt (32 Karten)
- Rufspiel, Farbsolo, Wenz
- Farb-/Trumpfzwang, Rufsau, Davonlaufen
- Heuristik-Bots
- Mobile-taugliche UI
- Reines Frontend (kein Backend nötig)

## Entwickeln

```bash
npm test
npm run build
```

## Selbst hosten

Das Spiel ist eine statische SPA. Nach `npm run build` reicht jeder Static-File-Server (oder das mitgelieferte `Dockerfile` mit nginx).

Unter `deploy/` liegt eine optionale Vorlage für Docker Compose hinter einem Reverse Proxy. Domain, Auth und CI-Secrets sind absichtlich nicht fest verdrahtet — bitte an die eigene Umgebung anpassen. Details: [docs/self-hosting.md](docs/self-hosting.md).
