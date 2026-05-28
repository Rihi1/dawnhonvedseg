import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxFiles = 5;
const maxFileSize = 8 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type DiscordField = {
  name: string;
  value: string;
  inline?: boolean;
};

type UploadableFile = File & {
  name: string;
  size: number;
  type: string;
};

type ReportPayload = {
  reporterName: string;
  badgeNumber: string;
  category: string;
  reportDate: string;
  summary: string;
  fineAmount: string;
  speeders: string;
  imageEvidence: string;
  description: string;
  patrolPartners: string[];
};

export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "A Discord webhook nincs beállítva a szerveren." },
      { status: 500 },
    );
  }

  const discordEndpoint = getDiscordEndpoint(webhookUrl);
  if (!discordEndpoint) {
    return NextResponse.json(
      { error: "A Discord webhook URL formátuma hibás." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const report: ReportPayload = {
    reporterName: getString(formData, "reporterName"),
    badgeNumber: getString(formData, "badgeNumber"),
    category: getString(formData, "category"),
    reportDate: getString(formData, "reportDate"),
    summary: getString(formData, "summary"),
    fineAmount: getString(formData, "fineAmount"),
    speeders: getString(formData, "speeders"),
    imageEvidence: getString(formData, "imageEvidence"),
    description: getString(formData, "description"),
    patrolPartners: formData
      .getAll("patrolPartners")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean),
  };

  const missingFields = [
    ["reporterName", "Jelentő neve"],
    ["badgeNumber", "Jelvényszám"],
    ["category", "Kategória"],
    ["reportDate", "Intézkedés dátuma"],
    ["summary", "Cím / tárgy"],
    ["description", "Leírás"],
  ].filter(([key]) => !report[key as keyof ReportPayload]);

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: `Hiányzó kötelező mezők: ${missingFields
          .map(([, label]) => label)
          .join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("reportFiles")
    .filter(isUploadableFile)
    .filter((file) => file.size > 0);

  const fileValidationError = validateFiles(files);
  if (fileValidationError) {
    return NextResponse.json({ error: fileValidationError }, { status: 400 });
  }

  if (files.length === 0 && !report.imageEvidence) {
    return NextResponse.json(
      { error: "Legalább egy kép vagy bizonyíték link megadása kötelező." },
      { status: 400 },
    );
  }

  const roleIds = getRoleIds();
  const payload = {
    username: process.env.DISCORD_WEBHOOK_USERNAME || "DawnNAV",
    avatar_url: process.env.DISCORD_WEBHOOK_AVATAR_URL || undefined,
    content: buildMentionLine(roleIds),
    allowed_mentions: roleIds.length > 0 ? { roles: roleIds } : { parse: [] },
    embeds: [
      {
        title: getDiscordTitle(report.category),
        description: truncate(report.description, 3900),
        color: getCategoryColor(report.category),
        fields: buildFields(report, files),
        timestamp: new Date().toISOString(),
        footer: {
          text: "NAV Automatikus Értesítő",
        },
      },
    ],
  };

  const discordFormData = new FormData();
  discordFormData.append("payload_json", JSON.stringify(payload));

  for (const [index, file] of files.entries()) {
    const buffer = await file.arrayBuffer();
    const attachment = new Blob([buffer], {
      type: file.type || "application/octet-stream",
    });

    discordFormData.append(`files[${index}]`, attachment, sanitizeFileName(file.name));
  }

  const discordResponse = await fetch(discordEndpoint, {
    method: "POST",
    body: discordFormData,
  });

  if (!discordResponse.ok) {
    const discordError = await discordResponse.text().catch(() => "");
    console.error("Discord webhook error", {
      status: discordResponse.status,
      body: truncate(discordError, 500),
    });

    return NextResponse.json(
      { error: "A Discord nem fogadta a jelentést. Ellenőrizd a webhook beállítást." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "A jelentés sikeresen bekerült a Discord #webteendők csatornába.",
  });
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUploadableFile(value: FormDataEntryValue): value is UploadableFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

function validateFiles(files: UploadableFile[]) {
  if (files.length > maxFiles) {
    return `Legfeljebb ${maxFiles} kép csatolható.`;
  }

  for (const file of files) {
    if (!allowedImageTypes.has(file.type)) {
      return `Nem támogatott fájltípus: ${file.name}. Csak JPG, PNG, WEBP vagy GIF tölthető fel.`;
    }

    if (file.size > maxFileSize) {
      return `Túl nagy fájl: ${file.name}. Egy kép legfeljebb 8 MB lehet.`;
    }
  }

  return "";
}

function buildFields(report: ReportPayload, files: UploadableFile[]) {
  const fields: Array<DiscordField | null> = [
    createField("Tag", `${report.reporterName} (${report.badgeNumber})`, true),
    createField("Cím", formatReportTitle(report), true),
    createField("Kategória", report.category, true),
    createField("Bírság összege", formatMoney(report.fineAmount), true),
    createField("Bemért gyorshajtók", report.speeders || "0", true),
    createField(
      "Járőrtársak",
      report.patrolPartners.length > 0 ? report.patrolPartners.join(", ") : "Nincs megadva",
      false,
    ),
    createField("Kép / bizonyíték", buildEvidenceValue(report.imageEvidence, files), false),
  ];

  return fields.filter(Boolean) as DiscordField[];
}

function createField(name: string, value: string, inline = false): DiscordField | null {
  if (!value.trim()) {
    return null;
  }

  return {
    name,
    value: truncate(value, 1024),
    inline,
  };
}

function formatReportTitle(report: ReportPayload) {
  if (report.summary) {
    return report.summary;
  }

  return `${report.category} - ${formatDate(report.reportDate)}`;
}

function buildEvidenceValue(imageEvidence: string, files: UploadableFile[]) {
  const parts = [];

  if (imageEvidence) {
    parts.push(imageEvidence);
  }

  if (files.length > 0) {
    parts.push(`${files.length} fájl csatolva.`);
  }

  return parts.join("\n");
}

function formatMoney(value: string) {
  const normalized = value.replace(/[^0-9]/g, "");

  if (!normalized) {
    return "$0";
  }

  return `$${Number(normalized).toLocaleString("en-US")}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "medium",
  }).format(date);
}

function getDiscordTitle(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("merkur")) {
    return "Új MERKUR Speciális Jelentés!";
  }

  if (normalized.includes("jármű")) {
    return "Új Jármű Jelentés!";
  }

  if (normalized.includes("szolgálati")) {
    return "Új Szolgálati Idő Leadva!";
  }

  if (normalized.includes("cég")) {
    return "Új cégügy a Portálon!";
  }

  return "Új Jelentés Leadva!";
}

function getCategoryColor(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("merkur")) {
    return 0x9b8cff;
  }

  if (normalized.includes("börtön")) {
    return 0xff6b78;
  }

  if (normalized.includes("csekk") || normalized.includes("gyors")) {
    return 0xe9b949;
  }

  if (normalized.includes("cég")) {
    return 0x58a6ff;
  }

  return 0x10ba81;
}

function getRoleIds() {
  const roleConfig = [
    process.env.DISCORD_TASK_ROLE_IDS,
    process.env.DISCORD_REPORT_ROLE_ID,
  ]
    .filter(Boolean)
    .join(",");

  return roleConfig
    .split(",")
    .map((roleId) => roleId.trim())
    .filter(Boolean);
}

function buildMentionLine(roleIds: string[]) {
  const mentions = roleIds.map((roleId) => `<@&${roleId}>`).join(" ");
  return mentions ? `${mentions} | Új teendő érkezett!` : "Új teendő érkezett!";
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 96);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function getDiscordEndpoint(webhookUrl: string) {
  try {
    const url = new URL(webhookUrl);
    url.searchParams.set("wait", "true");
    return url.toString();
  } catch {
    return "";
  }
}
