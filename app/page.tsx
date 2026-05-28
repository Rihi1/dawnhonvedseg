"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

const navSections = [
  {
    title: "FŐMENÜ",
    items: [
      "Kezdőlap",
      "Szolgálat",
      "Tagok",
      "Járművek",
      "Tudástár",
      "Igénylések",
      "Jelentések",
      "Toplista",
      "Heti Zárások",
      "NAVShop",
      "Profil",
    ],
  },
  {
    title: "ALOSZTÁLYOK",
    items: ["Cégnyilvántartó", "Adóigazgatóság", "MERKUR", "KNYF"],
  },
  {
    title: "VEZETŐSÉG",
    items: ["Admin felület"],
  },
];

const reportCategories = [
  "Csekk",
  "Börtön",
  "Gyorshajtás",
  "Jármű jelentés",
  "Szolgálati idő",
  "MERKUR Specialista",
  "Cégügy",
];

const patrolPartners = [
  "Brooklyn Prescott",
  "Karim Ziane",
  "Hugo Sachs",
  "Ryan Wolf",
  "Nolan Carter",
  "Noah Morgan",
  "Daniel Reid",
  "Markus Stein",
];

const previousReports = [
  { title: "Börtön - 2026. 05. 25.", status: "Függőben", amount: "$0", type: "Börtön" },
  { title: "Csekk - 2026. 05. 27.", status: "Elfogadva", amount: "$5,000,000", type: "Csekk" },
];

const reportStats = [
  { label: "JELENTÉSEID", value: "1 függő", tone: "blue" },
  { label: "MINIMUM JÁRŐRTÁRS VOLTÁL", value: "1/5", tone: "green" },
  { label: "BÍRSÁGOK ÖSSZEGE", value: "$5,000,000", tone: "gold" },
  { label: "BEMÉRT GYORSHAJTÓK", value: "0", tone: "purple" },
];

type SubmitState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>(["Brooklyn Prescott"]);
  const [selectedCategory, setSelectedCategory] = useState(reportCategories[0]);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  const fileSummary = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      })),
    [selectedFiles],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);

    setSubmitState({
      status: "loading",
      message: "Jelentés továbbítása a DawnNAV Discord csatornába...",
    });

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Nem sikerült elküldeni a jelentést.");
      }

      setSubmitState({
        status: "success",
        message:
          result?.message ??
          "A jelentés bekerült a Discord #webteendők csatornába.",
      });
      form.reset();
      setSelectedFiles([]);
      setSelectedPartners([]);
      setSelectedCategory(reportCategories[0]);
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Váratlan hiba történt a jelentés küldése közben.",
      });
    }
  }

  function togglePartner(partner: string) {
    setSelectedPartners((current) =>
      current.includes(partner)
        ? current.filter((item) => item !== partner)
        : [...current, partner],
    );
  }

  function resetForm() {
    formRef.current?.reset();
    setSelectedFiles([]);
    setSelectedPartners([]);
    setSelectedCategory(reportCategories[0]);
    setSubmitState({ status: "idle", message: "" });
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar" aria-label="DAWN-NAV navigáció">
        <div className="sidebar-brand">
          <span className="brand-emblem">DN</span>
          <div>
            <strong>DAWN-NAV</strong>
            <span>Honvédségi portál</span>
          </div>
        </div>

        <nav className="nav-groups">
          {navSections.map((section) => (
            <div className="nav-group" key={section.title}>
              <p>{section.title}</p>
              {section.items.map((item) => (
                <a
                  className={item === "Jelentések" ? "nav-item nav-item-active" : "nav-item"}
                  href={item === "Jelentések" ? "#reports" : `#${item.toLowerCase()}`}
                  key={item}
                >
                  <span aria-hidden="true">{item.slice(0, 1)}</span>
                  {item}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="user-chip">
          <div className="avatar">RS</div>
          <div>
            <strong>Richard Sean</strong>
            <span>Hadnagy</span>
          </div>
        </div>
      </aside>

      <main className="content" id="reports">
        <header className="topbar">
          <div>
            <p className="eyebrow">Jelentések</p>
            <h1>Az aznapi intézkedések és dokumentumok leadása.</h1>
          </div>
          <div className="service-pill">
            <span className="live-dot" aria-hidden="true" />
            Jelenleg szolgálatban <strong>1 aktív</strong>
          </div>
        </header>

        <section className="stats-grid" aria-label="Jelentés statisztikák">
          {reportStats.map((stat) => (
            <article className={`stat-card stat-${stat.tone}`} key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="workspace-grid">
          <div className="report-workspace">
            <div className="tabs" role="tablist" aria-label="Leadási módok">
              <button type="button" className="tab tab-muted">
                Log leadás
              </button>
              <button type="button" className="tab tab-active">
                Kézi leadás
              </button>
            </div>

            <form ref={formRef} className="report-form" onSubmit={handleSubmit}>
              <div className="form-heading">
                <div>
                  <h2>Kézi jelentés</h2>
                  <p>Manuálisan rögzítsd az intézkedésedet.</p>
                </div>
                <span className="status-badge">Discord: #webteendők</span>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>KATEGÓRIA</span>
                  <select
                    name="category"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    required
                  >
                    {reportCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>INTÉZKEDÉS DÁTUMA</span>
                  <input name="reportDate" type="date" required />
                </label>

                <label className="field">
                  <span>BÍRSÁG ÖSSZEGE ($)</span>
                  <input name="fineAmount" inputMode="numeric" placeholder="5000000" />
                </label>

                <label className="field">
                  <span>BEMÉRT GYORSHAJTÓK</span>
                  <input name="speeders" inputMode="numeric" placeholder="0" />
                </label>

                <label className="field">
                  <span>JELENTŐ NEVE</span>
                  <input name="reporterName" defaultValue="Richard Sean" required />
                </label>

                <label className="field">
                  <span>JELVÉNYSZÁM</span>
                  <input name="badgeNumber" defaultValue="NAV-143" required />
                </label>
              </div>

              <fieldset className="field fieldset">
                <legend>JÁRŐRTÁRSAK</legend>
                <p>Keresés név alapján. Válaszd ki azokat, akik veled voltak az intézkedésnél.</p>
                <div className="partner-grid">
                  {patrolPartners.map((partner) => (
                    <label
                      className={
                        selectedPartners.includes(partner)
                          ? "partner-chip partner-chip-selected"
                          : "partner-chip"
                      }
                      key={partner}
                    >
                      <input
                        checked={selectedPartners.includes(partner)}
                        name="patrolPartners"
                        type="checkbox"
                        value={partner}
                        onChange={() => togglePartner(partner)}
                      />
                      {partner}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="field field-full">
                <span>CÍM / TÁRGY</span>
                <input
                  name="summary"
                  maxLength={140}
                  placeholder={`${selectedCategory} - 2026. 05. 28.`}
                  required
                />
              </label>

              <label className="field field-full">
                <span>KÉP LINK / IMGUR</span>
                <input
                  name="imageEvidence"
                  placeholder="https://imgur.com/... vagy Drive/Medal link"
                />
              </label>

              <label className="field field-full">
                <span>LEÍRÁS</span>
                <textarea
                  name="description"
                  minLength={20}
                  placeholder="Részletes leírás..."
                  required
                />
              </label>

              <div className="field field-full">
                <span>Képek / bizonyíték</span>
                <div className="upload-panel">
                  <strong>Legalább egy kép vagy bizonyíték link megadása kötelező.</strong>
                  <p>JPG, PNG, WEBP vagy GIF; maximum 5 fájl, képenként 8 MB.</p>
                  <input
                    name="reportFiles"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    onChange={(event) =>
                      setSelectedFiles(Array.from(event.target.files ?? []))
                    }
                  />
                </div>
                {fileSummary.length > 0 ? (
                  <ul className="selected-files" aria-label="Kiválasztott bizonyítékok">
                    {fileSummary.map((file) => (
                      <li key={`${file.name}-${file.size}`}>
                        {file.name} <span>{file.size}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {submitState.message ? (
                <p
                  className={`message ${
                    submitState.status === "error" ? "message-error" : "message-success"
                  }`}
                  role={submitState.status === "error" ? "alert" : "status"}
                >
                  {submitState.message}
                </p>
              ) : null}

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitState.status === "loading"}
                >
                  {submitState.status === "loading" ? "Beküldés..." : "Jelentés beküldése"}
                </button>
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Űrlap törlése
                </button>
              </div>
            </form>
          </div>

          <aside className="right-rail" aria-label="Jelentés előnézet és előzmények">
            <section className="discord-preview">
              <div className="preview-head">
                <span className="discord-avatar">DN</span>
                <div>
                  <strong>DawnNAV</strong>
                  <span>APP • #webteendők</span>
                </div>
              </div>
              <p className="mention-line">@Vezérkar @Főtisztikar @Tisztikar | Új teendő érkezett!</p>
              <div className="embed-card">
                <h3>Új Jelentés Leadva!</h3>
                <dl>
                  <div>
                    <dt>Tag</dt>
                    <dd>Richard Sean</dd>
                  </div>
                  <div>
                    <dt>Cím</dt>
                    <dd>{selectedCategory} - 2026. 05. 28.</dd>
                  </div>
                  <div>
                    <dt>Járőrtársak</dt>
                    <dd>{selectedPartners.length ? selectedPartners.join(", ") : "Nincs megadva"}</dd>
                  </div>
                </dl>
                <footer>NAV Automatikus Értesítő</footer>
              </div>
            </section>

            <section className="previous-panel">
              <div className="panel-title-row">
                <div>
                  <h2>Korábbi jelentéseim</h2>
                  <p>e heti leadások</p>
                </div>
                <button type="button">Korábbiak mutatása</button>
              </div>
              <div className="report-list">
                {previousReports.map((report) => (
                  <article className="report-row" key={report.title}>
                    <div>
                      <span>{report.type}</span>
                      <strong>{report.title}</strong>
                    </div>
                    <div>
                      <em>{report.amount}</em>
                      <small>{report.status}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="info-panel">
              <h2>Discord integráció</h2>
              <p>
                A webhook URL szerveren marad. A beküldés formázott DawnNAV embedet,
                vezetőségi role mentiont és képmellékleteket küld a beállított csatornába.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
