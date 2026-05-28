# DawnNAV jelentésíró

Next.js alapú, DAWN-NAV stílusú jelentésíró felület Discord webhook integrációval.
Az oldal a referencia képek alapján sötét admin dashboardként épül fel: bal oldali
navigáció, jelentés KPI-k, `Log leadás` / `Kézi leadás` tabok, járőrtárs választó,
bizonyíték feltöltés és Discord előnézet.

## Indítás

```bash
npm install
cp .env.example .env.local
npm run dev
```

Az oldal alapértelmezetten a `http://localhost:3000` címen érhető el.

## Discord beállítás

1. Discord szerveren hozz létre egy webhookot a cél `#webteendők` csatornában.
2. Másold be az URL-t a `.env.local` fájlba:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Opcionális változók:

- `DISCORD_TASK_ROLE_IDS`: vesszővel elválasztott Discord role ID-k, pl. vezetőségi role-ok. Ezek jelennek meg az `Új teendő érkezett!` sorban.
- `DISCORD_REPORT_ROLE_ID`: egyetlen kompatibilitási role ID; együtt használható a `DISCORD_TASK_ROLE_IDS` értékkel.
- `DISCORD_WEBHOOK_USERNAME`: webhook megjelenített neve, alapértelmezés szerint `DawnNAV`.
- `DISCORD_WEBHOOK_AVATAR_URL`: webhook avatar URL.

A beküldés szerveroldalon történik, ezért a webhook URL nem kerül a böngészőbe.

## Discord üzenet formátum

A jelentés beküldése a képeken látott DawnNAV teendő stílust követi:

```text
@Vezérkar @Főtisztikar @Tisztikar | Új teendő érkezett!
Új Jelentés Leadva!
Tag: Richard Sean (NAV-143)
Cím: Csekk - 2026. 05. 28.
Kategória: Csekk
Bírság összege: $5,000,000
Járőrtársak: Brooklyn Prescott
Kép / bizonyíték: 1 fájl csatolva.
```

A kategóriától függően a cím lehet például `Új Jármű Jelentés!`,
`Új MERKUR Speciális Jelentés!`, `Új Szolgálati Idő Leadva!` vagy
`Új cégügy a Portálon!`.

## Hasznos parancsok

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```
