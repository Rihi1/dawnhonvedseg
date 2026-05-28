# Dawn Honvedseg jelentésíró

Next.js alapú jelentésíró felület Discord webhook integrációval. Az űrlap
magyar nyelvű, képes mellékleteket fogad, majd a beküldött adatokat egy
formázott Discord üzenetként továbbítja.

## Indítás

```bash
npm install
cp .env.example .env.local
npm run dev
```

Az oldal alapértelmezetten a `http://localhost:3000` címen érhető el.

## Discord beállítás

1. Discord szerveren hozz létre egy webhookot a cél csatornában.
2. Másold be az URL-t a `.env.local` fájlba:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Opcionális változók:

- `DISCORD_REPORT_ROLE_ID`: szerepkör megjelölése új jelentésnél.
- `DISCORD_WEBHOOK_USERNAME`: webhook megjelenített neve.
- `DISCORD_WEBHOOK_AVATAR_URL`: webhook avatar URL.

## Hasznos parancsok

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```
