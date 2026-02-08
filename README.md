# QualityCat Academy (Claude)

Platforma szkoleniowa z celowymi bugami do nauki testowania.

## Struktura

- `apps/api` — backend (API)
- `apps/web` — frontend
- `packages/shared` — współdzielone typy i DTO
- `docs/` — dokumentacja
- `infra/docker` — konfiguracja Docker Compose (dev i prod)

## Dev (lokalnie)

```bash
docker compose -f infra/docker/compose.dev.yml up -d --build
```

Domyślne porty dev:
- web: `http://localhost:8380`
- api: `http://localhost:8381`
- db: `localhost:5732`

## Prod-like / Traefik

Konfiguracja jest gotowa pod Traefik:
- domena: `academy-claude.qualitycat.com.pl`
- entrypoint: `web`
- sieć: `proxy` (external)
- bez TLS / bez `websecure`
- API pod prefiksem: `/api`

Uruchomienie:

```bash
docker compose -f infra/docker/compose.yml up -d --build
```
