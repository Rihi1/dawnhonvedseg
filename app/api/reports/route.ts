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
  const report = {
    reporterName: getString(formData, "reporterName"),
    discordName: getString(formData, "discordName"),
    reportType: getString(formData, "reportType"),
    priority: getString(formData, "priority"),
    subjectName: getString(formData, "subjectName"),
    location: getString(formData, "location"),
    incidentDate: getString(formData, "incidentDate"),
    contact: getString(formData, "contact"),
    summary: getString(formData, "summary"),
    description: getString(formData, "description"),
    evidenceLinks: getString(formData, "evidenceLinks"),
  };

  const missingFields = [
    ["reporterName", "Jelentő neve"],
    ["discordName", "Discord név"],
    ["reportType", "Jelentés típusa"],
    ["priority", "Prioritás"],
    ["incidentDate", "Esemény ideje"],
    ["summary", "Rövid tárgy"],
    ["description", "Részletes leírás"],
  ].filter(([key]) => !report[key as keyof typeof report]);

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

  const roleId = process.env.DISCORD_REPORT_ROLE_ID?.trim();
  const payload = {
    username: process.env.DISCORD_WEBHOOK_USERNAME || "Dawn Honvedseg Jelentesek",
    avatar_url: process.env.DISCORD_WEBHOOK_AVATAR_URL || undefined,
    content: roleId
      ? `<@&${roleId}> Új jelentés érkezett: ${report.summary}`
      : `Új jelentés érkezett: ${report.summary}`,
    allowed_mentions: roleId ? { roles: [roleId] } : { parse: [] },
    embeds: [
      {
        title: truncate(report.summary, 256),
        description: truncate(report.description, 3900),
        color: getPriorityColor(report.priority),
        fields: buildFields(report, files),
        timestamp: new Date().toISOString(),
        footer: {
          text: "Dawn Honvedseg jelentésíró",
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
    message: "A jelentés sikeresen megérkezett a Discord csatornába.",
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

function buildFields(
  report: {
    reporterName: string;
    discordName: string;
    reportType: string;
    priority: string;
    subjectName: string;
    location: string;
    incidentDate: string;
    contact: string;
    evidenceLinks: string;
  },
  files: UploadableFile[],
) {
  const fields: Array<DiscordField | null> = [
    createField("Jelentő", report.reporterName, true),
    createField("Discord", report.discordName, true),
    createField("Típus", report.reportType, true),
    createField("Prioritás", report.priority, true),
    createField("Esemény ideje", formatDate(report.incidentDate), true),
    createField("Helyszín", report.location || "Nincs megadva", true),
    createField("Érintett", report.subjectName || "Nincs megadva", true),
    createField("Elérhetőség", report.contact || "Nincs megadva", true),
    createField("Külső linkek", normalizeLinks(report.evidenceLinks), false),
    createField(
      "Csatolt képek",
      files.length > 0 ? `${files.length} fájl csatolva.` : "Nincs csatolt kép.",
      false,
    ),
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

function normalizeLinks(value: string) {
  if (!value.trim()) {
    return "";
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "sürgős":
      return 0xff6d7a;
    case "magas":
      return 0xffd166;
    case "alacsony":
      return 0x50d79a;
    default:
      return 0x6ea8ff;
  }
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
