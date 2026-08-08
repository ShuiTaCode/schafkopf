# Self-hosting

## Schnell

```bash
npm ci
npm run build
# dist/ mit nginx, Caddy, GitHub Pages, …
```

Oder:

```bash
docker build -t schafkopf .
docker run --rm -p 8080:80 schafkopf
```

## Docker Compose Vorlage

`deploy/hetzner/` ist eine **Beispiel**-Compose für Traefik-Labels. Vor dem Einsatz:

1. `Host(\`…\`)` auf deine Domain setzen
2. Auth-Middleware nur behalten, wenn du Forward Auth nutzt — sonst die Middleware-Labels entfernen
3. Image-Name / Registry anpassen

## CI-Deploy (optional)

`.github/workflows/deploy-hetzner.yml` baut ein Image, pusht es nach GHCR und deployt per SSH.

Benötigte Repository-Secrets:

| Secret | Zweck |
|---|---|
| `HETZNER_SSH_PRIVATE_KEY` | Deploy-Key für SSH |
| `DEPLOY_HOST` | Server-Hostname oder IP |
| `DEPLOY_USER` | SSH-User |
| `DEPLOY_PATH` | Zielverzeichnis auf dem Server |
| `DEPLOY_HEALTHCHECK_URL` | Optional: URL für einen kurzen `curl`-Check |

Compose und Labels in `deploy/hetzner/` an die eigene Domain und den eigenen Proxy anpassen.
